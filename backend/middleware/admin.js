// backend/middleware/admin.js
const { extractAndVerifyToken, ERRORS } = require('../utils/helpers');

function adminMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const user = extractAndVerifyToken(authHeader);

    if (!user) {
        return res.status(401).json({ message: ERRORS.TOKEN_MISSING });
    }

    if (user.role !== 'admin') {
        return res.status(403).json({ message: ERRORS.ADMIN_REQUIRED });
    }

    req.user = user;
    next();
}

module.exports = adminMiddleware;
