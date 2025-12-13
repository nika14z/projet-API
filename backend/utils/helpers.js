// backend/utils/helpers.js
// Module utilitaire centralise

const jwt = require('jsonwebtoken');
const Book = require('../models/Book');

const ERRORS = {
    // Authentification
    TOKEN_MISSING: 'Non autorise, token manquant',
    TOKEN_INVALID: 'Token invalide',
    ACCESS_DENIED: 'Acces refuse',
    ADMIN_REQUIRED: 'Acces refuse. Droits administrateur requis.',
    NOT_AUTHENTICATED: 'Non authentifie. Veuillez vous connecter.',

    // Ressources
    BOOK_NOT_FOUND: 'Livre introuvable',
    ORDER_NOT_FOUND: 'Commande introuvable',
    USER_NOT_FOUND: 'Utilisateur introuvable',
    PAYMENT_NOT_FOUND: 'Paiement introuvable',

    // Validation
    MISSING_FIELDS: 'Champs manquants',
    INVALID_CREDENTIALS: 'Identifiants invalides',
    EMAIL_EXISTS: 'Email deja utilise',
    STOCK_INSUFFICIENT: 'Stock insuffisant',

    // Commandes
    ORDER_CANNOT_MODIFY: 'Cette commande ne peut plus etre modifiee',
    ORDER_CANNOT_CANCEL: 'Cette commande ne peut plus etre annulee',
    ORDER_ALREADY_CANCELLED: 'Cette commande est deja annulee',
    ORDER_ALREADY_PAID: 'Cette commande a deja ete payee',

    // Paiements
    PAYMENT_ALREADY_REFUNDED: 'Ce paiement a deja ete rembourse',
    REFUND_EXCEEDS_AMOUNT: 'Le montant du remboursement depasse le montant paye'
};

function generateToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
    );
}

function extractAndVerifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return { id: decoded.id, role: decoded.role };
    } catch (error) {
        return null;
    }
}

function isOwnerOrAdmin(resourceUserId, currentUserId, userRole = null) {
    const isOwner = resourceUserId.toString() === currentUserId.toString();
    const isAdmin = userRole === 'admin';
    return isOwner || isAdmin;
}

function isOwner(resourceUserId, currentUserId) {
    return resourceUserId.toString() === currentUserId.toString();
}

async function checkStockAvailability(orderItems) {
    for (const item of orderItems) {
        const book = await Book.findById(item.product);
        if (!book) {
            return {
                success: false,
                error: `Livre non trouve: ${item.product}`,
                book: null
            };
        }
        if (book.stock < item.qty) {
            return {
                success: false,
                error: `Stock insuffisant pour: ${book.title}`,
                book: book
            };
        }
    }
    return { success: true, error: null, book: null };
}

async function decrementStock(orderItems) {
    for (const item of orderItems) {
        await Book.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.qty }
        });
    }
}

async function incrementStock(orderItems) {
    for (const item of orderItems) {
        await Book.findByIdAndUpdate(item.product, {
            $inc: { stock: item.qty }
        });
    }
}

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'];

function canModifyOrder(status) {
    const nonModifiableStatuses = ['shipped', 'delivered', 'cancelled'];
    return !nonModifiableStatuses.includes(status);
}

function canCancelOrder(status) {
    const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled'];
    return !nonCancellableStatuses.includes(status);
}

function isValidOrderStatus(status) {
    return ORDER_STATUSES.includes(status);
}

module.exports = {
    ERRORS,
    ORDER_STATUSES,
    PAYMENT_STATUSES,
    generateToken,
    extractAndVerifyToken,
    isOwnerOrAdmin,
    isOwner,
    checkStockAvailability,
    decrementStock,
    incrementStock,
    canModifyOrder,
    canCancelOrder,
    isValidOrderStatus
};
