// backend/routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sanitize } = require('../utils/sanitize');
const { ERRORS } = require('../utils/helpers');

// GET /api/books - Recuperer tous les livres
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;

        let filter = {};
        if (category && category !== 'Tous') {
            filter = { category: category };
        }

        const books = await Book.find(filter);
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/books/:id - Recuperer un seul livre
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('reviews.user', 'username');
        if (!book) {
            return res.status(404).json({ message: ERRORS.BOOK_NOT_FOUND });
        }
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/books - Ajouter un livre (securise contre XSS)
router.post('/', async (req, res) => {
    const book = new Book({
        title: sanitize(req.body.title),
        author: sanitize(req.body.author),
        price: req.body.price,
        category: sanitize(req.body.category),
        description: sanitize(req.body.description),
        image: sanitize(req.body.image)
    });

    try {
        const newBook = await book.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/books/:id/reviews - Ajouter un avis
router.post('/:id/reviews', auth, async (req, res) => {
    const { rating, comment } = req.body;

    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: ERRORS.BOOK_NOT_FOUND });
        }

        const alreadyReviewed = book.reviews.find(
            (r) => r.user.toString() === req.user.id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Vous avez deja commente ce livre' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: ERRORS.USER_NOT_FOUND });
        }

        const review = {
            name: sanitize(user.username) || 'Utilisateur',
            rating: Number(rating),
            comment: sanitize(comment),
            user: req.user.id,
        };

        book.reviews.push(review);
        book.numReviews = book.reviews.length;
        book.rating = book.reviews.reduce((acc, item) => item.rating + acc, 0) / book.reviews.length;

        await book.save();

        const populatedBook = await Book.findById(req.params.id).populate('reviews.user', 'username');
        res.status(201).json(populatedBook);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;
