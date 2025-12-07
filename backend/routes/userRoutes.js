// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Mettre à jour les champs
        if (username) user.username = username;
        if (email) user.email = email;
        
        // Mettre à jour le mot de passe s'il est fourni
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        // On ne renvoie pas le mot de passe
        const userToReturn = await User.findById(req.user.id).select('-password');
        res.json(userToReturn);

    } catch (err) {
        // Gérer les erreurs de duplications (username/email déjà pris) de manière plus robuste
        if (err.code === 11000) {
            if (err.message.includes('username')) {
                return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris." });
            }
            if (err.message.includes('email')) {
                return res.status(400).json({ message: "Cet email est déjà utilisé." });
            }
        }
        console.error(err.message);
        res.status(500).send('Erreur du serveur');
    }
});

// @route   DELETE api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        await User.findByIdAndDelete(req.user.id);

        res.json({ message: 'Compte supprimé avec succès' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erreur du serveur' });
    }
});

module.exports = router;
