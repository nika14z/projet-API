// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const {
    ERRORS,
    isOwner,
    checkStockAvailability,
    decrementStock,
    incrementStock,
    canModifyOrder,
    canCancelOrder
} = require('../utils/helpers');

// POST /api/orders - Creer une nouvelle commande
router.post('/orders', auth, async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'Aucun article commande' });
    }

    try {
        // 1. Verification des stocks
        const stockCheck = await checkStockAvailability(orderItems);
        if (!stockCheck.success) {
            return res.status(400).json({ message: stockCheck.error });
        }

        // 2. Creation de la commande
        const order = new Order({
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            isPaid: true,
            paidAt: Date.now()
        });

        const createdOrder = await order.save();

        // 3. Mise a jour des stocks
        await decrementStock(orderItems);

        res.status(201).json(createdOrder);
    } catch (err) {
        res.status(500).json({ message: 'Erreur creation commande: ' + err.message });
    }
});

// GET /api/orders/myorders - Recuperer les commandes de l'utilisateur
router.get('/myorders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/orders/:id - Recuperer une commande par ID
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: ERRORS.ORDER_NOT_FOUND });
        }

        if (!isOwner(order.user, req.user.id)) {
            return res.status(403).json({ message: ERRORS.ACCESS_DENIED });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/orders/:id - Modifier une commande (adresse de livraison)
router.put('/:id', auth, async (req, res) => {
    const { shippingAddress } = req.body;

    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: ERRORS.ORDER_NOT_FOUND });
        }

        if (!isOwner(order.user, req.user.id)) {
            return res.status(403).json({ message: ERRORS.ACCESS_DENIED });
        }

        if (!canModifyOrder(order.status)) {
            return res.status(400).json({ message: ERRORS.ORDER_CANNOT_MODIFY });
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

// PUT /api/orders/:id/cancel - Annuler une commande
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: ERRORS.ORDER_NOT_FOUND });
        }

        if (!isOwner(order.user, req.user.id)) {
            return res.status(403).json({ message: ERRORS.ACCESS_DENIED });
        }

        if (!canCancelOrder(order.status)) {
            return res.status(400).json({ message: ERRORS.ORDER_CANNOT_CANCEL });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({ message: ERRORS.ORDER_ALREADY_CANCELLED });
        }

        // Remettre les articles en stock
        await incrementStock(order.orderItems);

        order.status = 'cancelled';
        const updatedOrder = await order.save();

        res.json({ message: 'Commande annulee avec succes', order: updatedOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
