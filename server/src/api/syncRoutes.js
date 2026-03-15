const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Bulk sync endpoints
router.post('/orders', auth(['ADMIN']), async (req, res) => {
  const { orders } = req.body;
  const results = { synced: [], failed: [] };

  for (const orderData of orders) {
    try {
      // Idempotency check using serverId (client-side UUID)
      const existing = await prisma.order.findUnique({
        where: { serverId: orderData.id }
      });

      if (existing) {
        results.synced.push(existing.invoiceNo);
        continue;
      }

      const syncOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            invoiceNo: orderData.invoiceNo,
            serverId: orderData.id,
            customerId: orderData.customerId,
            subtotal: orderData.subtotal,
            taxTotal: orderData.taxTotal,
            grandTotal: orderData.grandTotal,
            paymentMode: orderData.paymentMode,
            status: 'COMPLETED',
            isSynced: true,
            createdAt: new Date(orderData.timestamp),
            orderItems: {
              create: orderData.orderItems.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.sellingPrice,
                taxAmount: (item.sellingPrice * (item.gstRate / 100)) * item.quantity,
                total: (item.sellingPrice * item.quantity) + ((item.sellingPrice * (item.gstRate / 100)) * item.quantity)
              }))
            },
            payments: {
              create: {
                method: orderData.paymentMode,
                amount: orderData.grandTotal,
                status: 'SUCCESS'
              }
            }
          }
        });

        // Deduct inventory
        for (const item of orderData.orderItems) {
          await tx.product.update({
            where: { id: item.id },
            data: { stockQuantity: { decrement: item.quantity } }
          });
        }

        return order;
      });

      results.synced.push(syncOrder.invoiceNo);
      
      // Broadcast to other terminals
      const io = req.app.get('io');
      io.emit('ORDER_SYNCED', { invoiceNo: syncOrder.invoiceNo });

    } catch (error) {
      console.error('Sync Order Failed:', error);
      results.failed.push({ id: orderData.id, error: error.message });
    }
  }

  res.json(results);
});

module.exports = router;
