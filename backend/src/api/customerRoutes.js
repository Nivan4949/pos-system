const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { search, activeOnly } = req.query;
    const customers = await prisma.customer.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search || '' } },
              { phone: { contains: search || '' } },
              { email: { contains: search || '' } }
            ]
          } : {},
          activeOnly === 'true' ? { is_active: true } : {}
        ]
      },
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const customer = await prisma.customer.create({
      data: req.body
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.update({
      where: { id },
      data: req.body
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle customer active status
router.put('/inactive/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ message: 'is_active is required' });
    
    const customer = await prisma.customer.update({
      where: { id },
      data: { is_active }
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
