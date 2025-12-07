// backend/middleware/admin.js
const jwt = require('jsonwebtoken');

function adminMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Non autorise, token manquant' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Acces refuse. Droits administrateur requis.' });
        }

        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
}

module.exports = adminMiddleware;
