// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const admin = require('../middleware/admin');
const { sanitize } = require('../utils/sanitize');
const {
    ERRORS,
    incrementStock,
    isValidOrderStatus
} = require('../utils/helpers');

// ========================================
// CREATION COMPTE ADMIN
// ========================================

// POST /api/admin/create-admin - Creer un compte admin (par un admin existant)
router.post('/create-admin', admin, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: ERRORS.MISSING_FIELDS });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: ERRORS.EMAIL_EXISTS });
        }

        const newAdmin = new User({ username, email, password, role: 'admin' });
        await newAdmin.save();

        res.status(201).json({
            message: 'Compte admin cree avec succes',
            user: newAdmin.toJSON()
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/admin/setup-admin - Creer le premier compte admin (avec cle secrete)
router.post('/setup-admin', async (req, res) => {
    try {
        const { username, email, password, secretKey } = req.body;

        const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'BIBLIO_ADMIN_SECRET_2024';

        if (secretKey !== ADMIN_SECRET_KEY) {
            return res.status(403).json({ message: 'Cle secrete invalide' });
        }

        if (!username || !email || !password) {
            return res.status(400).json({ message: ERRORS.MISSING_FIELDS });
        }

        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Un compte admin existe deja. Utilisez /api/admin/create-admin' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: ERRORS.EMAIL_EXISTS });
        }

        const newAdmin = new User({ username, email, password, role: 'admin' });
        await newAdmin.save();

        res.status(201).json({
            message: 'Premier compte admin cree avec succes',
            user: newAdmin.toJSON()
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ========================================
// GESTION DES PRODUITS (LIVRES)
// ========================================

// GET /api/admin/books - Tous les livres (avec pagination)
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

// POST /api/admin/books - Ajouter un livre
router.post('/books', admin, async (req, res) => {
    try {
        const { title, author, price, category, description, image, stock } = req.body;

        const book = new Book({
            title: sanitize(title),
            author: sanitize(author),
            price,
            category: sanitize(category),
            description: sanitize(description || ''),
            image: sanitize(image || ''),
            stock: stock || 10
        });

        const newBook = await book.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/admin/books/:id - Modifier un livre
router.put('/books/:id', admin, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: ERRORS.BOOK_NOT_FOUND });
        }

        const { title, author, price, category, description, image, stock } = req.body;

        if (title) book.title = sanitize(title);
        if (author) book.author = sanitize(author);
        if (price !== undefined) book.price = price;
        if (category) book.category = sanitize(category);
        if (description !== undefined) book.description = sanitize(description);
        if (image !== undefined) book.image = sanitize(image);
        if (stock !== undefined) book.stock = stock;

        const updatedBook = await book.save();
        res.json(updatedBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/admin/books/:id - Supprimer un livre
router.delete('/books/:id', admin, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: ERRORS.BOOK_NOT_FOUND });
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

// GET /api/admin/orders - Toutes les commandes (avec pagination et filtres)
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

// GET /api/admin/orders/:id - Une commande par ID
router.get('/orders/:id', admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username email')
            .populate('payment');

        if (!order) {
            return res.status(404).json({ message: ERRORS.ORDER_NOT_FOUND });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/admin/orders/:id - Modifier une commande (statut, livraison)
router.put('/orders/:id', admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: ERRORS.ORDER_NOT_FOUND });
        }

        const { status, isDelivered, shippingAddress } = req.body;

        if (status && !isValidOrderStatus(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const oldStatus = order.status || 'confirmed';

        if (status) {
            if (status === 'cancelled' && oldStatus !== 'cancelled') {
                await incrementStock(order.orderItems);
            }
            order.status = status;
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

        const populatedOrder = await Order.findById(updatedOrder._id)
            .populate('user', 'username email')
            .populate('payment');

        res.json(populatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/admin/orders/:id - Supprimer une commande
router.delete('/orders/:id', admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: ERRORS.ORDER_NOT_FOUND });
        }

        if (order.status !== 'cancelled') {
            await incrementStock(order.orderItems);
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

// GET /api/admin/payments - Tous les paiements
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

// GET /api/admin/payments/:id - Un paiement par ID
router.get('/payments/:id', admin, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('user', 'username email')
            .populate('order');

        if (!payment) {
            return res.status(404).json({ message: ERRORS.PAYMENT_NOT_FOUND });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/admin/payments/:id - Modifier un paiement (remboursement admin)
router.put('/payments/:id', admin, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: ERRORS.PAYMENT_NOT_FOUND });
        }

        const { status, refundedAmount, refundReason } = req.body;

        if (status) payment.status = status;
        if (refundedAmount !== undefined) payment.refundedAmount = refundedAmount;
        if (refundReason) payment.refundReason = refundReason;

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

// GET /api/admin/users - Tous les utilisateurs
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

// PUT /api/admin/users/:id/role - Modifier le role d'un utilisateur
router.put('/users/:id/role', admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: ERRORS.USER_NOT_FOUND });
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

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: ERRORS.USER_NOT_FOUND });
        }

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

        // Revenus totaux - SEULEMENT si il y a des commandes
        let totalRevenue = 0;
        if (totalOrders > 0) {
            const revenueResult = await Payment.aggregate([
                { $match: { status: { $in: ['completed', 'partially_refunded'] } } },
                { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$refundedAmount'] } } } }
            ]);
            totalRevenue = revenueResult[0]?.total || 0;
        }

        // Commandes recentes (7 derniers jours)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentOrders = await Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // Livres en rupture de stock
        const outOfStock = await Book.countDocuments({ stock: 0 });

        // Top 5 des livres les plus vendus - SEULEMENT si il y a des commandes
        let topBooks = [];
        if (totalOrders > 0) {
            topBooks = await Order.aggregate([
                { $unwind: '$orderItems' },
                { $group: { _id: '$orderItems.product', totalSold: { $sum: '$orderItems.qty' }, title: { $first: '$orderItems.title' } } },
                { $sort: { totalSold: -1 } },
                { $limit: 5 }
            ]);
        }

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
