const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Create new order
router.post('/', auth(['ADMIN', 'MANAGER', 'CASHIER']), async (req, res) => {
  try {
    const { customerId, orderItems, subtotal, discount, taxTotal, grandTotal, paymentMode, loyaltyPointsRedeemed = 0 } = req.body;

    // Generate Robust Invoice Number (e.g., ST01-1710500000-A1B2)
    const terminalId = req.headers['x-terminal-id'] || 'T1';
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNo = `INV-${terminalId}-${timestamp}-${random}`;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Calculate points earned (1 point per ₹100 of grandTotal)
      const earnRate = 100;
      const loyaltyPointsEarned = Math.floor(grandTotal / earnRate);

      // 2. Verify points if redeeming
      if (customerId && loyaltyPointsRedeemed > 0) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (!customer) throw new Error('Customer not found');
        if (customer.loyaltyPoints < loyaltyPointsRedeemed) throw new Error('Insufficient loyalty points');
      }

      // 3. Check Stock Levels (Guard against negative stock)
      for (const item of orderItems) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product) throw new Error(`Product ${item.name} not found`);
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
        }
      }

      // 4. Create the order
      const newOrder = await tx.order.create({
        data: {
          invoiceNo,
          customerId,
          subtotal,
          discount,
          taxTotal,
          grandTotal,
          paymentMode,
          loyaltyPointsEarned,
          loyaltyPointsRedeemed,
          status: 'COMPLETED',
          orderItems: {
            create: orderItems.map((item) => {
              const gst = parseFloat(item.gstRate ?? item.product?.gstRate ?? 18);
              return {
                productId: item.id,
                quantity: item.quantity,
                price: item.sellingPrice,
                discount: item.discount || 0,
                taxAmount: (item.sellingPrice * (gst / 100)) * item.quantity,
                total: (item.sellingPrice * item.quantity) + ((item.sellingPrice * (gst / 100)) * item.quantity)
              };
            })
          },
          payments: {
            create: {
              method: paymentMode,
              amount: grandTotal,
              status: 'SUCCESS'
            }
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          payments: true
        }
      });

      // 5. Deduct inventory and log it
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.id,
            type: 'OUT',
            quantity: item.quantity,
            reason: `Order ${invoiceNo}`
          }
        });
      }

      // 6. Update customer loyalty points and total spent
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: {
              increment: loyaltyPointsEarned - (loyaltyPointsRedeemed || 0)
            },
            totalSpent: {
              increment: Number(grandTotal)
            },
            lastPurchaseDate: new Date()
          }
        });
      }

      // 7. Emit real-time events for other terminals
      const io = req.app.get('io');
      if (io) {
        io.emit('INVENTORY_UPDATE', { items: orderItems });
        io.emit('ORDER_CREATED', newOrder);
      }

      return newOrder;
    });

    res.json(order);
  } catch (error) {
    console.error('Order Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
