const jwt = require('jsonwebtoken');

const auth = (allowedRoles = []) => {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;

            // SaaS: Verify license status if not Super Admin
            if (decoded.role !== 'ADMIN' && decoded.licenseId) {
                const prisma = require('../config/prisma');
                const license = await prisma.license.findUnique({ where: { id: decoded.licenseId } });
                
                if (!license || license.status !== 'ACTIVE') {
                    return res.status(403).json({ message: 'License is inactive or invalid' });
                }
                
                if (new Date(license.expiryDate) < new Date()) {
                    return res.status(403).json({ message: 'License has expired' });
                }
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ message: 'Access denied: insufficient permissions' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
};

module.exports = auth;
