const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', async (req, res) => {
  try {
    const expense = await prisma.expense.create({
      data: req.body
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
