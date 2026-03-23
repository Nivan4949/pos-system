const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Create new purchase (Stock In)
router.post('/', auth(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { supplierName, purchaseItems, subtotal, taxTotal, grandTotal, paymentMode, date } = req.body;

    // Generate Purchase Invoice Number
    const timestamp = Date.now().toString().slice(-10);
    const invoiceNo = `PUR-${timestamp}`;

    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase record
      const newPurchase = await tx.purchase.create({
        data: {
          invoiceNo,
          supplierName,
          subtotal,
          taxTotal,
          grandTotal,
          paymentMode,
          date: date ? new Date(date) : new Date(),
          status: 'COMPLETED',
          purchaseItems: {
            create: purchaseItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              taxAmount: item.taxAmount || 0,
              total: item.total
            }))
          }
        },
        include: {
          purchaseItems: true
        }
      });

      // 2. Increment inventory and log it
      for (const item of purchaseItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity
            }
          }
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            reason: `Purchase ${invoiceNo}`
          }
        });
      }

      // 3. Emit real-time events for other terminals
      const io = req.app.get('io');
      if (io) {
          io.emit('INVENTORY_UPDATE', { items: purchaseItems.map(pi => ({ id: pi.productId, quantity: pi.quantity })) });
      }

      return newPurchase;
    });

    res.json(purchase);
  } catch (error) {
    console.error('Purchase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
