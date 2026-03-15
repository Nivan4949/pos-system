const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get sales summary
router.get('/summary', auth(['ADMIN']), async (req, res) => {
  try {
    const totalSales = await prisma.order.aggregate({
      _sum: { grandTotal: true },
      _count: { id: true }
    });

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });

    res.json({
      totalRevenue: totalSales._sum.grandTotal || 0,
      totalOrders: totalSales._count.id || 0,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
