// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// @route   POST /api/payments
// @desc    Créer un paiement pour une commande
// @access  Private
router.post('/', auth, async (req, res) => {
    const { orderId, paymentMethod, cardLast4 } = req.body;

    try {
        // Vérifier que la commande existe
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        // Vérifier que l'utilisateur est propriétaire de la commande
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Vérifier qu'il n'y a pas déjà un paiement complété pour cette commande
        const existingPayment = await Payment.findOne({ order: orderId, status: 'completed' });
        if (existingPayment) {
            return res.status(400).json({ message: 'Cette commande a déjà été payée' });
        }

        // Simuler le traitement du paiement (dans un vrai projet, intégrer Stripe/PayPal ici)
        const paymentSuccess = true; // Simulation: toujours réussi

        const payment = new Payment({
            user: req.user.id,
            order: orderId,
            amount: order.totalPrice,
            paymentMethod: paymentMethod || 'card',
            cardLast4: cardLast4 || '****',
            status: paymentSuccess ? 'completed' : 'failed',
            metadata: {
                orderItems: order.orderItems.length,
                shippingCity: order.shippingAddress.city
            }
        });

        await payment.save();

        // Mettre à jour la commande si le paiement est réussi
        if (paymentSuccess) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.payment = payment._id;
            await order.save();
        }

        res.status(201).json(payment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors du traitement du paiement: ' + err.message });
    }
});

// @route   GET /api/payments
// @desc    Récupérer tous les paiements de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.id })
            .populate('order', 'orderItems totalPrice status createdAt')
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/payments/stats/summary
// @desc    Obtenir un résumé des paiements de l'utilisateur
// @access  Private
// NOTE: Cette route doit être AVANT /:id pour éviter que "stats" soit interprété comme un ID
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.id });

        const summary = {
            totalPayments: payments.length,
            totalSpent: payments
                .filter(p => p.status === 'completed' || p.status === 'partially_refunded')
                .reduce((acc, p) => acc + p.amount - p.refundedAmount, 0),
            completedPayments: payments.filter(p => p.status === 'completed').length,
            refundedPayments: payments.filter(p => p.status === 'refunded').length,
            pendingPayments: payments.filter(p => p.status === 'pending').length,
            totalRefunded: payments.reduce((acc, p) => acc + p.refundedAmount, 0)
        };

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/payments/transaction/:transactionId
// @desc    Récupérer un paiement par ID de transaction
// @access  Private
router.get('/transaction/:transactionId', auth, async (req, res) => {
    try {
        const payment = await Payment.findOne({ transactionId: req.params.transactionId })
            .populate('order', 'orderItems totalPrice shippingAddress status');

        if (!payment) {
            return res.status(404).json({ message: 'Transaction introuvable' });
        }

        // Vérifier que l'utilisateur est propriétaire du paiement
        if (payment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/payments/:id
// @desc    Récupérer un paiement par ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('order', 'orderItems totalPrice shippingAddress status createdAt');

        if (!payment) {
            return res.status(404).json({ message: 'Paiement introuvable' });
        }

        // Vérifier que l'utilisateur est propriétaire du paiement
        if (payment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/payments/:id/refund
// @desc    Demander un remboursement
// @access  Private
router.post('/:id/refund', auth, async (req, res) => {
    const { amount, reason } = req.body;

    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Paiement introuvable' });
        }

        // Vérifier que l'utilisateur est propriétaire du paiement
        if (payment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Vérifier que le paiement peut être remboursé
        if (payment.status === 'refunded') {
            return res.status(400).json({ message: 'Ce paiement a déjà été remboursé' });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ message: 'Seuls les paiements complétés peuvent être remboursés' });
        }

        // Calculer le montant du remboursement
        const refundAmount = amount || payment.amount;
        const totalRefunded = payment.refundedAmount + refundAmount;

        if (totalRefunded > payment.amount) {
            return res.status(400).json({ message: 'Le montant du remboursement dépasse le montant payé' });
        }

        // Simuler le remboursement
        payment.refundedAmount = totalRefunded;
        payment.refundReason = reason || 'Remboursement demandé par le client';
        payment.status = totalRefunded >= payment.amount ? 'refunded' : 'partially_refunded';

        await payment.save();

        // Mettre à jour la commande si remboursement total
        if (payment.status === 'refunded') {
            const order = await Order.findById(payment.order);
            if (order) {
                order.status = 'cancelled';
                order.isPaid = false;
                await order.save();
            }
        }

        res.json({
            message: 'Remboursement effectué avec succès',
            payment,
            refundedAmount: refundAmount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
