// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { ERRORS, isOwner } = require('../utils/helpers');

// POST /api/payments - Creer un paiement pour une commande
router.post('/', auth, async (req, res) => {
    const { orderId, paymentMethod, cardLast4 } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: ERRORS.ORDER_NOT_FOUND });
        }

        if (!isOwner(order.user, req.user.id)) {
            return res.status(403).json({ message: ERRORS.ACCESS_DENIED });
        }

        // Verifier qu'il n'y a pas deja un paiement complete
        const existingPayment = await Payment.findOne({ order: orderId, status: 'completed' });
        if (existingPayment) {
            return res.status(400).json({ message: ERRORS.ORDER_ALREADY_PAID });
        }

        // Simuler le traitement du paiement
        const paymentSuccess = true;

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

        if (paymentSuccess) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.payment = payment._id;
            await order.save();
        }

        res.status(201).json(payment);
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors du traitement du paiement: ' + err.message });
    }
});

// GET /api/payments - Recuperer tous les paiements de l'utilisateur
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

// GET /api/payments/stats/summary - Resume des paiements
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

// GET /api/payments/transaction/:transactionId - Paiement par ID de transaction
router.get('/transaction/:transactionId', auth, async (req, res) => {
    try {
        const payment = await Payment.findOne({ transactionId: req.params.transactionId })
            .populate('order', 'orderItems totalPrice shippingAddress status');

        if (!payment) {
            return res.status(404).json({ message: 'Transaction introuvable' });
        }

        if (!isOwner(payment.user, req.user.id)) {
            return res.status(403).json({ message: ERRORS.ACCESS_DENIED });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/payments/:id - Paiement par ID
router.get('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('order', 'orderItems totalPrice shippingAddress status createdAt');

        if (!payment) {
            return res.status(404).json({ message: ERRORS.PAYMENT_NOT_FOUND });
        }

        if (!isOwner(payment.user, req.user.id)) {
            return res.status(403).json({ message: ERRORS.ACCESS_DENIED });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/payments/:id/refund - Demander un remboursement
router.post('/:id/refund', auth, async (req, res) => {
    const { amount, reason } = req.body;

    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: ERRORS.PAYMENT_NOT_FOUND });
        }

        if (!isOwner(payment.user, req.user.id)) {
            return res.status(403).json({ message: ERRORS.ACCESS_DENIED });
        }

        if (payment.status === 'refunded') {
            return res.status(400).json({ message: ERRORS.PAYMENT_ALREADY_REFUNDED });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ message: 'Seuls les paiements completes peuvent etre rembourses' });
        }

        const refundAmount = amount || payment.amount;
        const totalRefunded = payment.refundedAmount + refundAmount;

        if (totalRefunded > payment.amount) {
            return res.status(400).json({ message: ERRORS.REFUND_EXCEEDS_AMOUNT });
        }

        payment.refundedAmount = totalRefunded;
        payment.refundReason = reason || 'Remboursement demande par le client';
        payment.status = totalRefunded >= payment.amount ? 'refunded' : 'partially_refunded';

        await payment.save();

        if (payment.status === 'refunded') {
            const order = await Order.findById(payment.order);
            if (order) {
                order.status = 'cancelled';
                order.isPaid = false;
                await order.save();
            }
        }

        res.json({
            message: 'Remboursement effectue avec succes',
            payment,
            refundedAmount: refundAmount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
