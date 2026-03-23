const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Helper to handle date filters
const getDateRange = (filter, startDate, endDate) => {
  const now = new Date();
  let start = new Date();
  start.setHours(0, 0, 0, 0);
  let end = new Date();
  end.setHours(23, 59, 59, 999);

  if (filter === 'Today') {
    // Keep start and end as today
  } else if (filter === 'Week') {
    start.setDate(now.getDate() - 7);
  } else if (filter === 'Month') {
    start.setDate(now.getDate() - 30);
  } else if (filter === 'Custom' && startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default All Time roughly
    start = new Date('2020-01-01');
  }
  return { gte: start, lte: end };
};

// 1. Sale Report
router.get('/sales', async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateRange = getDateRange(filter, startDate, endDate);
    
    const sales = await prisma.order.findMany({
      where: { createdAt: dateRange },
      include: { customer: true, payments: true }
    });
    
    const summary = {
      totalSales: sales.reduce((sum, order) => sum + order.grandTotal, 0),
      totalTax: sales.reduce((sum, order) => sum + order.taxTotal, 0),
      billCount: sales.length,
      cashReceived: sales.filter(o => o.paymentMode === 'CASH').reduce((sum, o) => sum + o.grandTotal, 0),
      upiReceived: sales.filter(o => o.paymentMode === 'UPI').reduce((sum, o) => sum + o.grandTotal, 0),
      cardReceived: sales.filter(o => o.paymentMode === 'CARD').reduce((sum, o) => sum + o.grandTotal, 0)
    };
    res.json({ summary, details: sales });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. Purchase Report
router.get('/purchase', async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateRange = getDateRange(filter, startDate, endDate);
    
    // Using try/catch locally since Purchase might not exist remotely yet
    const purchases = await prisma.purchase.findMany({
      where: { createdAt: dateRange }
    }).catch(() => []); // Fallback if table missing during sync
    
    const summary = {
      totalPurchases: purchases.reduce((sum, p) => sum + p.grandTotal, 0),
      totalTax: purchases.reduce((sum, p) => sum + p.taxTotal, 0),
      billCount: purchases.length,
    };
    
    // grouped by supplier
    const supplierWise = purchases.reduce((acc, p) => {
      acc[p.supplierName] = (acc[p.supplierName] || 0) + p.grandTotal;
      return acc;
    }, {});

    res.json({ summary, supplierWise, details: purchases });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. Profit & Loss
router.get('/profit-loss', async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateRange = getDateRange(filter, startDate, endDate);
    
    const totalSales = await prisma.order.aggregate({
      where: { createdAt: dateRange },
      _sum: { subtotal: true }
    });
    
    // We assume COGS (Cost of goods sold) via items
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { createdAt: dateRange } },
      include: { product: true }
    });
    const cogs = orderItems.reduce((sum, item) => sum + (item.product?.purchasePrice || 0) * item.quantity, 0);
    const grossProfit = (totalSales._sum.subtotal || 0) - cogs;
    
    const expenses = await prisma.expense.aggregate({
      where: { createdAt: dateRange },
      _sum: { amount: true }
    });
    
    const totalExpense = expenses._sum.amount || 0;
    const netProfit = grossProfit - totalExpense;
    
    res.json({
      salesAmount: totalSales._sum.subtotal || 0,
      cogs,
      grossProfit,
      expenses: totalExpense,
      netProfit
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. Day Book & 5. All Transactions (Combined Logically)
router.get('/daybook', async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = filter === 'Custom' ? filter : 'Today'; // Default DayBook to Today
    const dateRange = getDateRange(dateFilter, startDate, endDate);

    const sales = await prisma.order.findMany({ where: { createdAt: dateRange } });
    const purchases = await prisma.purchase.findMany({ where: { createdAt: dateRange } }).catch(() => []);
    const expenses = await prisma.expense.findMany({ where: { createdAt: dateRange } });
    
    const transactions = [
      ...sales.map(s => ({ type: 'SALE', amount: s.grandTotal, date: s.createdAt, details: `Bill: ${s.invoiceNo}` })),
      ...purchases.map(p => ({ type: 'PURCHASE', amount: -p.grandTotal, date: p.createdAt, details: `Inv: ${p.invoiceNo}` })),
      ...expenses.map(e => ({ type: 'EXPENSE', amount: -e.amount, date: e.createdAt, details: e.type }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const cashIn = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const cashOut = purchases.reduce((sum, p) => sum + p.grandTotal, 0) + expenses.reduce((sum, e) => sum + e.amount, 0);
    
    res.json({ cashIn, cashOut, netBalance: cashIn - cashOut, transactions });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 6. Cashflow (Simplified to In/Out matching daybook)
router.get('/cashflow', async (req, res) => {
  // Alias to DayBook logic but formatted for high level cashflow
  res.redirect('/api/reports/daybook?filter=' + req.query.filter);
});

// 7. Balance Sheet (Summary snapshot)
router.get('/balance-sheet', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    const inventoryValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0);
    
    const customers = await prisma.customer.findMany();
    const receivables = customers.reduce((sum, c) => sum + c.creditBalance, 0);
    
    res.json({
      assets: {
        inventoryValue,
        receivables,
        totalAssets: inventoryValue + receivables
      },
      liabilities: {} // Simplified for POS
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 8. Party Reports (All Parties)
router.get('/parties', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { totalSpent: 'desc' }
    });
    res.json(customers);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 9. Party Statement
router.get('/party-statement/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id }, include: { orders: true } });
    if (!customer) return res.status(404).json({ message: 'Not found' });
    res.json(customer);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 10. Party Wise Profit & Loss
router.get('/party-profit', async (req, res) => {
  try {
    // Advanced: grouping profit by customer
    const orders = await prisma.order.findMany({
      include: { customer: true, orderItems: { include: { product: true } } }
    });
    
    const profitByParty = orders.reduce((acc, order) => {
      if (!order.customer) return acc;
      const cname = order.customer.name;
      if (!acc[cname]) acc[cname] = { totalSales: 0, cogs: 0, profit: 0, points: order.customer.loyaltyPoints };
      
      const sales = order.subtotal;
      const cogs = order.orderItems.reduce((sum, item) => sum + ((item.product?.purchasePrice || 0) * item.quantity), 0);
      
      acc[cname].totalSales += sales;
      acc[cname].cogs += cogs;
      acc[cname].profit += (sales - cogs);
      return acc;
    }, {});
    
    res.json(Object.entries(profitByParty).map(([name, data]) => ({ name, ...data })));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 11. Stock Summary Report
router.get('/stock-summary', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { is_active: true }
    });
    
    const summary = {
      totalItems: products.length,
      totalStockValue: products.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0),
      totalRetailValue: products.reduce((sum, p) => sum + (p.stockQuantity * p.sellingPrice), 0),
    };
    
    res.json({ summary, details: products });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 12. Item Wise Profit & Loss
router.get('/item-profit', async (req, res) => {
  try {
    const orderItems = await prisma.orderItem.findMany({
      include: { product: true }
    });
    
    const itemProfit = orderItems.reduce((acc, item) => {
      if (!item.product) return acc;
      const name = item.product.name;
      if (!acc[name]) acc[name] = { qtySold: 0, revenue: 0, cost: 0, profit: 0 };
      
      const rev = item.price * item.quantity;
      const cost = item.product.purchasePrice * item.quantity;
      
      acc[name].qtySold += item.quantity;
      acc[name].revenue += rev;
      acc[name].cost += cost;
      acc[name].profit += (rev - cost);
      return acc;
    }, {});
    
    res.json(Object.entries(itemProfit).map(([name, data]) => ({ name, ...data })).sort((a,b) => b.profit - a.profit));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 13. Expense Reports 
router.get('/expenses', async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateRange = getDateRange(filter, startDate, endDate);
    
    const expenses = await prisma.expense.findMany({
      where: { createdAt: dateRange },
      orderBy: { createdAt: 'desc' }
    });
    
    const totalByCat = expenses.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + e.amount;
      return acc;
    }, {});
    
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ total, categorySummary: totalByCat, details: expenses });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 14. All Transactions alias
router.get('/transactions', async (req, res) => {
  res.redirect('/api/reports/daybook?filter=' + req.query.filter);
});

// 15. Stock Detail
router.get('/stock-detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { inventoryLogs: { orderBy: { createdAt: 'desc' } } }
    });
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
