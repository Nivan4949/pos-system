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
// Get purchase by ID
router.get('/:id', auth(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: { purchaseItems: { include: { product: true } } }
    });
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update purchase bill (with inventory reconciliation)
router.put('/:id', auth(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierName, purchaseItems: newItems, subtotal, taxTotal, grandTotal, paymentMode, date } = req.body;

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      const oldPurchase = await tx.purchase.findUnique({
        where: { id },
        include: { purchaseItems: true }
      });

      if (!oldPurchase) throw new Error('Purchase not found');

      // 1. REVERSE: Decrement stock for old items
      for (const item of oldPurchase.purchaseItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            reason: `Edit Reverse: ${oldPurchase.invoiceNo}`
          }
        });
      }

      // 2. APPLY: Delete old and create new
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

      for (const item of newItems) {
        const pid = item.productId || item.id;
        await tx.product.update({
          where: { id: pid },
          data: { stockQuantity: { increment: item.quantity } }
        });
        await tx.inventoryLog.create({
          data: {
            productId: pid,
            type: 'IN',
            quantity: item.quantity,
            reason: `Edit Apply: ${oldPurchase.invoiceNo}`
          }
        });
      }

      return await tx.purchase.update({
        where: { id },
        data: {
          supplierName,
          subtotal,
          taxTotal,
          grandTotal,
          paymentMode,
          date: date ? new Date(date) : undefined,
          purchaseItems: {
            create: newItems.map(item => ({
              productId: item.productId || item.id,
              quantity: item.quantity,
              price: item.price,
              taxAmount: item.taxAmount || 0,
              total: item.total
            }))
          }
        },
        include: { purchaseItems: { include: { product: true } } }
      });
    });

    res.json(updatedPurchase);
  } catch (error) {
    console.error('Update Purchase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
