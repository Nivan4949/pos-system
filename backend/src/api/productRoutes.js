const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get all products with search and category filter
router.get('/', async (req, res) => {
  try {
    const { search, categoryId, activeOnly } = req.query;
    const products = await prisma.product.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search } },
              { barcode: { contains: search } }
            ]
          } : {},
          categoryId ? { categoryId } : {},
          activeOnly === 'true' ? { is_active: true } : {}
        ]
      },
      include: {
        category: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
router.post('/', auth(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const data = { ...req.body };
    // Handle barcode unique constraint: if not provided, generate uniquely
    if (!data.barcode || data.barcode.trim() === '') {
      data.barcode = 'PRD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
    
    console.log('Creating product with data:', JSON.stringify(data, null, 2));
    
    const product = await prisma.product.create({
      data: data
    });
    res.json(product);
  } catch (error) {
    console.error('Prisma Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', auth(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    // Handle barcode unique constraint (empty string -> null)
    if (data.barcode === '') {
      data.barcode = null;
    }

    const product = await prisma.product.update({
      where: { id },
      data: data
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', auth(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle product active status
router.put('/inactive/:id', auth(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ message: 'is_active is required' });
    
    const product = await prisma.product.update({
      where: { id },
      data: { is_active }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Barcode
router.post('/generate-barcode', auth(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const uniqueBarcode = 'PRD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    res.json({ barcode: uniqueBarcode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan Barcode
router.post('/scan-barcode', async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ message: 'Barcode is required' });
    
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: { category: true }
    });
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!product.is_active) return res.status(400).json({ message: 'Product is inactive' });
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: { category: true }
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
