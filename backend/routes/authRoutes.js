// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, ERRORS } = require('../utils/helpers');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: ERRORS.MISSING_FIELDS });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: ERRORS.EMAIL_EXISTS });
        }

        const user = new User({ username, email, password });
        await user.save();

        const token = generateToken(user);
        res.status(201).json({ token, user: user.toJSON() });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: ERRORS.MISSING_FIELDS });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: ERRORS.INVALID_CREDENTIALS });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: ERRORS.INVALID_CREDENTIALS });
        }

        const token = generateToken(user);
        res.json({ token, user: user.toJSON() });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
