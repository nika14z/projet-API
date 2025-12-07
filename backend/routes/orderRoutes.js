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
        // 1. Vérification des stocks AVANT de créer la commande
        for (const item of orderItems) {
            const book = await Book.findById(item.product);
            if (!book || book.stock < item.qty) {
                return res.status(400).json({ message: `Stock insuffisant pour le livre : ${book ? book.title : 'inconnu'}` });
            }
        }

        // 2. Création de la commande, on prend l'id depuis le token
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

        // 3. Mise à jour des Stocks
        for (const item of orderItems) {
            const book = await Book.findById(item.product);
            if (book) {
                book.stock -= item.qty;
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

// Récupérer une commande par ID
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        // Vérifier que l'utilisateur est propriétaire de la commande
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mettre à jour une commande (adresse de livraison)
router.put('/:id', auth, async (req, res) => {
    const { shippingAddress } = req.body;

    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        // Vérifier que l'utilisateur est propriétaire de la commande
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // On ne peut modifier que si la commande n'est pas encore expédiée
        if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled') {
            return res.status(400).json({ message: 'Cette commande ne peut plus être modifiée' });
        }

        if (shippingAddress) {
            order.shippingAddress = shippingAddress;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Annuler une commande
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        // Vérifier que l'utilisateur est propriétaire de la commande
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // On ne peut annuler que si la commande n'est pas encore expédiée ou déjà annulée
        if (order.status === 'shipped' || order.status === 'delivered') {
            return res.status(400).json({ message: 'Cette commande ne peut plus être annulée car elle a déjà été expédiée' });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'Cette commande est déjà annulée' });
        }

        // Remettre les articles en stock
        for (const item of order.orderItems) {
            const book = await Book.findById(item.product);
            if (book) {
                book.stock += item.qty;
                await book.save();
            }
        }

        order.status = 'cancelled';
        const updatedOrder = await order.save();

        res.json({ message: 'Commande annulée avec succès', order: updatedOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;