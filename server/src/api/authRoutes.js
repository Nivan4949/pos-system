const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Simplified for demo - in production use bcrypt and real password check
  try {
    const user = await prisma.user.findUnique({ where: { email: username } });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: { id: user.id, username: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
