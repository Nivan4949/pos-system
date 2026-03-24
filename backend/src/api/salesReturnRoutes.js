const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Create new sales return (Credit Note)
router.post('/', auth(['ADMIN', 'MANAGER', 'CASHIER']), async (req, res) => {
  try {
    const { 
      orderId, 
      customerId, 
      returnItems, 
      subtotal, 
      taxTotal, 
      totalAmount, 
      reason 
    } = req.body;

    // Generate Return Number (e.g., RET-1710500000)
    const timestamp = Date.now().toString().slice(-10);
    const returnNo = `RET-${timestamp}`;

    const salesReturn = await prisma.$transaction(async (tx) => {
      // 1. Create the Sales Return
      const newReturn = await tx.salesReturn.create({
        data: {
          returnNo,
          orderId: orderId || null,
          customerId: customerId || null,
          subtotal,
          taxTotal,
          totalAmount,
          reason,
          status: 'COMPLETED',
          returnItems: {
            create: returnItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              taxAmount: item.taxAmount || 0,
              total: item.total
            }))
          }
        },
        include: {
          returnItems: true
        }
      });

      // 2. Increment inventory and log it
      for (const item of returnItems) {
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
            reason: `Sales Return ${returnNo}`
          }
        });
      }

      // 3. Update customer credit balance if customerId is present
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            creditBalance: {
              increment: totalAmount
            }
          }
        });
      }

      return newReturn;
    });

    res.json(salesReturn);
  } catch (error) {
    console.error('Sales Return Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all sales returns
router.get('/', auth(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const returns = await prisma.salesReturn.findMany({
      include: {
        customer: true,
        order: true,
        returnItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single return details
router.get('/:id', auth(['ADMIN', 'MANAGER', 'CASHIER']), async (req, res) => {
  try {
    const { id } = req.params;
    const salesReturn = await prisma.salesReturn.findUnique({
      where: { id },
      include: {
        customer: true,
        order: true,
        returnItems: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!salesReturn) {
      return res.status(404).json({ error: 'Sales return not found' });
    }
    
    res.json(salesReturn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
