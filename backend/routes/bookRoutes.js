// backend/routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const xss = require('xss'); // <--- 1. IMPORT DE LA SÉCURITÉ

// 1. GET - Récupérer tous les livres (avec filtre optionnel)
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

// 2. GET /:id - Récupérer un seul livre
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (book == null) {
            return res.status(404).json({ message: 'Livre introuvable' });
        }
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. POST - Ajouter un livre (SÉCURISÉ CONTRE XSS)
router.post('/', async (req, res) => {
    
    // --- 2. NETTOYAGE (Sanitization) ---
    // On utilise la fonction xss() sur tous les champs texte.
    // Elle va transformer "<script>" en "&lt;script&gt;" (texte inoffensif).
    
    const cleanTitle = xss(req.body.title);
    const cleanAuthor = xss(req.body.author);
    const cleanCategory = xss(req.body.category);
    const cleanDescription = xss(req.body.description);
    const cleanImage = xss(req.body.image);

    const book = new Book({
        title: cleanTitle,
        author: cleanAuthor,
        price: req.body.price, // Le prix est un chiffre, pas besoin de le nettoyer
        category: cleanCategory,
        description: cleanDescription,
        image: cleanImage
    });

    try {
        const newBook = await book.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;