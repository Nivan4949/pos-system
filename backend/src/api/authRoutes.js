const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
  const { username, password, deviceId } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: username },
      include: { license: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Bcrypt comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       // Support migration: also check plain text if it looks like one (not recommended for production but helpful for your existing passwords)
       if (password !== user.password) {
          return res.status(401).json({ message: 'Invalid credentials' });
       }
    }


    const token = jwt.sign(
      { id: user.id, role: user.role, licenseId: user.licenseId }, 
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Device Registration Request
router.post('/register-device', async (req, res) => {
    const { deviceId, name, licenseKey } = req.body;
    try {
        const license = await prisma.license.findUnique({ 
            where: { key: licenseKey },
            include: { devices: true }
        });

        if (!license || license.status !== 'ACTIVE') {
            return res.status(404).json({ message: 'Invalid or inactive license key' });
        }

        if (license.devices.length >= license.maxDevices) {
            return res.status(403).json({ message: 'Maximum device limit reached for this license' });
        }

        const device = await prisma.device.upsert({
            where: { deviceId },
            update: { name, licenseId: license.id },
            create: { deviceId, name, licenseId: license.id }
        });

        res.json({ message: 'Device registration request sent. Please contact Admin for authorization.', device });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
