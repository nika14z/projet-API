// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Book = require('../models/Book');

// Créer une nouvelle commande (protégée)
const auth = require('../middleware/auth');

router.post('/orders', auth, async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'Aucun article commandé' });
    }

    try {
        // 1. Création de la commande, on prend l'id depuis le token
        const order = new Order({
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            isPaid: true, // Simulation de paiement
            paidAt: Date.now()
        });

        const createdOrder = await order.save();

        // 2. Mise à jour des Stocks
        for (const item of orderItems) {
            const book = await Book.findById(item.product);
            if (book) {
                book.stock = Math.max(0, book.stock - item.qty);
                await book.save();
            }
        }

        res.status(201).json(createdOrder);
    } catch (err) {
        res.status(500).json({ message: "Erreur création commande: " + err.message });
    }
});

// Récupérer les commandes d'un utilisateur (Historique)
// Récupérer les commandes de l'utilisateur connecté (protégé)
router.get('/myorders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;