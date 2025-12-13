// backend/middleware/auth.js
const { extractAndVerifyToken, ERRORS } = require('../utils/helpers');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const user = extractAndVerifyToken(authHeader);

    if (!user) {
        return res.status(401).json({ message: ERRORS.TOKEN_MISSING });
    }

    req.user = user;
    next();
}

module.exports = authMiddleware;
