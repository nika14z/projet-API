// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Champs manquants' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }
        const user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
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
            return res.status(400).json({ message: 'Champs manquants' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Identifiants invalides' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Identifiants invalides' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: user.toJSON() });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;