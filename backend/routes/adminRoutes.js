// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const admin = require('../middleware/admin');
const xss = require('xss');

// ========================================
// GESTION DES PRODUITS (LIVRES)
// ========================================

// GET tous les livres (avec pagination)
router.get('/books', admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await Book.countDocuments();
        const books = await Book.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            books,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST ajouter un livre
router.post('/books', admin, async (req, res) => {
    try {
        const { title, author, price, category, description, image, stock } = req.body;

        const book = new Book({
            title: xss(title),
            author: xss(author),
            price,
            category: xss(category),
            description: xss(description || ''),
            image: xss(image || ''),
            stock: stock || 10
        });

        const newBook = await book.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT modifier un livre
router.put('/books/:id', admin, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre introuvable' });
        }

        const { title, author, price, category, description, image, stock } = req.body;

        if (title) book.title = xss(title);
        if (author) book.author = xss(author);
        if (price !== undefined) book.price = price;
        if (category) book.category = xss(category);
        if (description !== undefined) book.description = xss(description);
        if (image !== undefined) book.image = xss(image);
        if (stock !== undefined) book.stock = stock;

        const updatedBook = await book.save();
        res.json(updatedBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE supprimer un livre
router.delete('/books/:id', admin, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre introuvable' });
        }

        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: 'Livre supprime avec succes' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ========================================
// GESTION DES COMMANDES
// ========================================

// GET toutes les commandes (avec pagination et filtres)
router.get('/orders', admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        let filter = {};
        if (status) {
            filter.status = status;
        }

        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('user', 'username email')
            .populate('payment')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET une commande par ID
router.get('/orders/:id', admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username email')
            .populate('payment');

        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT modifier une commande (statut, livraison)
router.put('/orders/:id', admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        const { status, isDelivered, shippingAddress } = req.body;

        if (status) {
            order.status = status;
            // Si annulee, remettre le stock
            if (status === 'cancelled' && order.status !== 'cancelled') {
                for (const item of order.orderItems) {
                    const book = await Book.findById(item.product);
                    if (book) {
                        book.stock += item.qty;
                        await book.save();
                    }
                }
            }
        }

        if (isDelivered !== undefined) {
            order.isDelivered = isDelivered;
            if (isDelivered) {
                order.status = 'delivered';
            }
        }

        if (shippingAddress) {
            order.shippingAddress = shippingAddress;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE supprimer une commande
router.delete('/orders/:id', admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        // Remettre le stock si la commande n'etait pas annulee
        if (order.status !== 'cancelled') {
            for (const item of order.orderItems) {
                const book = await Book.findById(item.product);
                if (book) {
                    book.stock += item.qty;
                    await book.save();
                }
            }
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Commande supprimee avec succes' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ========================================
// GESTION DES PAIEMENTS
// ========================================

// GET tous les paiements (avec pagination et filtres)
router.get('/payments', admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        let filter = {};
        if (status) {
            filter.status = status;
        }

        const total = await Payment.countDocuments(filter);
        const payments = await Payment.find(filter)
            .populate('user', 'username email')
            .populate('order', 'orderItems totalPrice status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            payments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET un paiement par ID
router.get('/payments/:id', admin, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('user', 'username email')
            .populate('order');

        if (!payment) {
            return res.status(404).json({ message: 'Paiement introuvable' });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT modifier un paiement (remboursement admin)
router.put('/payments/:id', admin, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Paiement introuvable' });
        }

        const { status, refundedAmount, refundReason } = req.body;

        if (status) payment.status = status;
        if (refundedAmount !== undefined) payment.refundedAmount = refundedAmount;
        if (refundReason) payment.refundReason = refundReason;

        // Si rembourse completement, mettre a jour la commande
        if (status === 'refunded') {
            const order = await Order.findById(payment.order);
            if (order) {
                order.status = 'cancelled';
                order.isPaid = false;
                await order.save();
            }
        }

        const updatedPayment = await payment.save();
        res.json(updatedPayment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ========================================
// GESTION DES UTILISATEURS
// ========================================

// GET tous les utilisateurs
router.get('/users', admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT modifier le role d'un utilisateur
router.put('/users/:id/role', admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Role invalide' });
        }

        user.role = role;
        await user.save();

        res.json({ message: `Role mis a jour: ${role}`, user: user.toJSON() });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE supprimer un utilisateur
router.delete('/users/:id', admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        // Empecher la suppression de son propre compte admin
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Utilisateur supprime avec succes' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ========================================
// STATISTIQUES DASHBOARD
// ========================================

router.get('/stats', admin, async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalPayments = await Payment.countDocuments();

        // Commandes par statut
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Revenus totaux
        const revenueResult = await Payment.aggregate([
            { $match: { status: { $in: ['completed', 'partially_refunded'] } } },
            { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$refundedAmount'] } } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // Commandes recentes (7 derniers jours)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentOrders = await Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // Livres en rupture de stock
        const outOfStock = await Book.countDocuments({ stock: 0 });

        // Top 5 des livres les plus vendus
        const topBooks = await Order.aggregate([
            { $unwind: '$orderItems' },
            { $group: { _id: '$orderItems.product', totalSold: { $sum: '$orderItems.qty' }, title: { $first: '$orderItems.title' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            summary: {
                totalBooks,
                totalOrders,
                totalUsers,
                totalPayments,
                totalRevenue,
                recentOrders,
                outOfStock
            },
            ordersByStatus,
            topBooks
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
