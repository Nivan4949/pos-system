const jwt = require('jsonwebtoken');

const auth = (allowedRoles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;

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
