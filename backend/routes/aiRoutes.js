// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Associations de categories (enrichies)
const categoryAssociations = {
    'Science-Fiction': ['Fantasy', 'Thriller', 'Aventure'],
    'Fantasy': ['Science-Fiction', 'Aventure', 'Manga'],
    'Policier': ['Thriller', 'Roman', 'Suspense'],
    'Roman': ['Policier', 'Romance', 'Drame'],
    'Manga': ['Fantasy', 'Science-Fiction', 'Comics'],
    'Thriller': ['Policier', 'Suspense', 'Horreur'],
    'Romance': ['Roman', 'Drame', 'Comedie'],
    'Histoire': ['Biographie', 'Documentaire', 'Roman'],
    'Biographie': ['Histoire', 'Documentaire', 'Developpement Personnel'],
    'Developpement Personnel': ['Business', 'Biographie', 'Psychologie'],
    'Informatique': ['Science', 'Business', 'Developpement Personnel'],
    'Jeunesse': ['Fantasy', 'Aventure', 'Comics']
};

// Poids pour le scoring
const WEIGHTS = {
    CATEGORY_MATCH: 10,
    ASSOCIATED_CATEGORY: 7,
    HIGH_RATING: 5,
    POPULAR: 3,
    PRICE_SIMILARITY: 2,
    SAME_AUTHOR: 8,
    PREVIOUSLY_BOUGHT_CATEGORY: 6
};

// Fonction pour calculer le score d'un livre
const calculateBookScore = (book, context) => {
    let score = 0;

    // Match de categorie directe
    if (context.favoriteCategories.includes(book.category)) {
        score += WEIGHTS.CATEGORY_MATCH;
    }

    // Categorie associee
    if (context.associatedCategories.includes(book.category)) {
        score += WEIGHTS.ASSOCIATED_CATEGORY;
    }

    // Livre bien note
    if (book.rating >= 4) {
        score += WEIGHTS.HIGH_RATING;
    } else if (book.rating >= 3) {
        score += WEIGHTS.HIGH_RATING * 0.5;
    }

    // Livre populaire (beaucoup d'avis)
    if (book.numReviews >= 10) {
        score += WEIGHTS.POPULAR;
    } else if (book.numReviews >= 5) {
        score += WEIGHTS.POPULAR * 0.5;
    }

    // Prix similaire a la moyenne du panier
    if (context.avgPrice > 0) {
        const priceDiff = Math.abs(book.price - context.avgPrice);
        if (priceDiff <= 5) {
            score += WEIGHTS.PRICE_SIMILARITY;
        }
    }

    // Meme auteur que les livres du panier
    if (context.authors.includes(book.author)) {
        score += WEIGHTS.SAME_AUTHOR;
    }

    // Categorie precedemment achetee
    if (context.previouslyBoughtCategories.includes(book.category)) {
        score += WEIGHTS.PREVIOUSLY_BOUGHT_CATEGORY;
    }

    // Ajouter un peu de randomisation pour varier les resultats
    score += Math.random() * 2;

    return score;
};

// Route principale de recommandation (amelioree)
router.post('/recommend', async (req, res) => {
    const { categoriesInCart, bookIdsInCart = [], userId } = req.body;

    try {
        let context = {
            favoriteCategories: [],
            associatedCategories: [],
            avgPrice: 0,
            authors: [],
            previouslyBoughtCategories: [],
            excludeBookIds: bookIdsInCart
        };

        // 1. Si le panier est vide, proposer les best-sellers
        if (!categoriesInCart || categoriesInCart.length === 0) {
            const bestSellers = await Book.find({ stock: { $gt: 0 } })
                .sort({ numReviews: -1, rating: -1 })
                .limit(5);
            return res.json(bestSellers.slice(0, 3));
        }

        // 2. Analyser les categories du panier
        const categoryCounts = {};
        for (const cat of categoriesInCart) {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }

        // Trier par frequence
        const sortedCategories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        context.favoriteCategories = sortedCategories.slice(0, 3);

        // 3. Trouver les categories associees
        for (const cat of context.favoriteCategories) {
            const associated = categoryAssociations[cat] || [];
            context.associatedCategories.push(...associated);
        }
        // Supprimer les doublons
        context.associatedCategories = [...new Set(context.associatedCategories)];

        // 4. Recuperer les infos des livres du panier pour le contexte
        if (bookIdsInCart.length > 0) {
            const cartBooks = await Book.find({ _id: { $in: bookIdsInCart } });
            context.avgPrice = cartBooks.reduce((sum, b) => sum + b.price, 0) / cartBooks.length;
            context.authors = cartBooks.map(b => b.author);
        }

        // 5. Recuperer l'historique d'achat de l'utilisateur
        if (userId) {
            const previousOrders = await Order.find({ user: userId, status: { $ne: 'cancelled' } })
                .sort({ createdAt: -1 })
                .limit(10);

            for (const order of previousOrders) {
                for (const item of order.orderItems) {
                    const book = await Book.findById(item.product);
                    if (book) {
                        context.previouslyBoughtCategories.push(book.category);
                    }
                }
            }
            context.previouslyBoughtCategories = [...new Set(context.previouslyBoughtCategories)];
        }

        // 6. Recuperer les livres candidats
        const allCategories = [...context.favoriteCategories, ...context.associatedCategories];
        let candidates = await Book.find({
            category: { $in: allCategories },
            _id: { $nin: bookIdsInCart },
            stock: { $gt: 0 }
        });

        // Si pas assez de candidats, elargir la recherche
        if (candidates.length < 5) {
            const additionalBooks = await Book.find({
                _id: { $nin: [...bookIdsInCart, ...candidates.map(b => b._id)] },
                stock: { $gt: 0 }
            }).sort({ rating: -1, numReviews: -1 }).limit(10);
            candidates = [...candidates, ...additionalBooks];
        }

        // 7. Scorer et trier les candidats
        const scoredBooks = candidates.map(book => ({
            book,
            score: calculateBookScore(book, context)
        }));

        scoredBooks.sort((a, b) => b.score - a.score);

        // 8. Retourner les meilleures recommandations
        const recommendations = scoredBooks.slice(0, 5).map(sb => sb.book);

        console.log(`IA: Categories favorites: ${context.favoriteCategories.join(', ')}`);
        console.log(`IA: ${recommendations.length} recommandations generees`);

        res.json(recommendations);

    } catch (err) {
        console.error("Erreur IA:", err);
        res.status(500).json({ message: "Erreur du moteur de recommandation" });
    }
});

// Route pour les recommandations personnalisees (basees sur l'historique)
router.get('/personalized', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Recuperer l'historique d'achat
        const orders = await Order.find({ user: userId, status: { $ne: 'cancelled' } })
            .sort({ createdAt: -1 })
            .limit(20);

        if (orders.length === 0) {
            // Pas d'historique, retourner les best-sellers
            const bestSellers = await Book.find({ stock: { $gt: 0 } })
                .sort({ rating: -1, numReviews: -1 })
                .limit(5);
            return res.json({
                type: 'best-sellers',
                message: 'Nos meilleures ventes',
                books: bestSellers
            });
        }

        // Analyser les preferences
        const categoryScores = {};
        const authorScores = {};
        const purchasedBookIds = [];

        for (const order of orders) {
            for (const item of order.orderItems) {
                purchasedBookIds.push(item.product.toString());
                const book = await Book.findById(item.product);
                if (book) {
                    categoryScores[book.category] = (categoryScores[book.category] || 0) + item.qty;
                    authorScores[book.author] = (authorScores[book.author] || 0) + item.qty;
                }
            }
        }

        // Trouver les categories et auteurs preferes
        const topCategories = Object.entries(categoryScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(e => e[0]);

        const topAuthors = Object.entries(authorScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(e => e[0]);

        // Chercher des livres similaires non achetes
        const recommendations = await Book.find({
            $or: [
                { category: { $in: topCategories } },
                { author: { $in: topAuthors } }
            ],
            _id: { $nin: purchasedBookIds },
            stock: { $gt: 0 }
        }).sort({ rating: -1, numReviews: -1 }).limit(10);

        res.json({
            type: 'personalized',
            message: 'Recommande pour vous',
            preferences: {
                categories: topCategories,
                authors: topAuthors
            },
            books: recommendations
        });

    } catch (err) {
        console.error("Erreur recommandations personnalisees:", err);
        res.status(500).json({ message: "Erreur du moteur de recommandation" });
    }
});

// Route pour "Les clients ont aussi achete"
router.get('/also-bought/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({ message: 'Livre introuvable' });
        }

        // Trouver les commandes contenant ce livre
        const ordersWithBook = await Order.find({
            'orderItems.product': bookId,
            status: { $ne: 'cancelled' }
        }).limit(50);

        // Compter les autres livres achetes ensemble
        const coOccurrences = {};
        for (const order of ordersWithBook) {
            for (const item of order.orderItems) {
                const itemId = item.product.toString();
                if (itemId !== bookId) {
                    coOccurrences[itemId] = (coOccurrences[itemId] || 0) + 1;
                }
            }
        }

        // Trier par frequence de co-achat
        const sortedIds = Object.entries(coOccurrences)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(e => e[0]);

        let recommendations = [];
        if (sortedIds.length > 0) {
            recommendations = await Book.find({
                _id: { $in: sortedIds },
                stock: { $gt: 0 }
            });
        }

        // Si pas assez de co-achats, completer avec des livres similaires
        if (recommendations.length < 3) {
            const similar = await Book.find({
                category: book.category,
                _id: { $ne: bookId, $nin: recommendations.map(r => r._id) },
                stock: { $gt: 0 }
            }).sort({ rating: -1 }).limit(5 - recommendations.length);
            recommendations = [...recommendations, ...similar];
        }

        res.json({
            message: 'Les clients ont aussi achete',
            books: recommendations
        });

    } catch (err) {
        console.error("Erreur also-bought:", err);
        res.status(500).json({ message: "Erreur du moteur de recommandation" });
    }
});

// Route pour les livres tendance
router.get('/trending', async (req, res) => {
    try {
        // Livres les plus commandes ces 30 derniers jours
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentOrders = await Order.find({
            createdAt: { $gte: thirtyDaysAgo },
            status: { $ne: 'cancelled' }
        });

        const bookSales = {};
        for (const order of recentOrders) {
            for (const item of order.orderItems) {
                const bookId = item.product.toString();
                bookSales[bookId] = (bookSales[bookId] || 0) + item.qty;
            }
        }

        // Trier par ventes
        const trendingIds = Object.entries(bookSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(e => e[0]);

        let trending = [];
        if (trendingIds.length > 0) {
            trending = await Book.find({
                _id: { $in: trendingIds },
                stock: { $gt: 0 }
            });
            // Trier dans l'ordre des ventes
            trending.sort((a, b) => {
                return trendingIds.indexOf(a._id.toString()) - trendingIds.indexOf(b._id.toString());
            });
        }

        // Si pas assez de donnees, completer avec les meilleures notes
        if (trending.length < 5) {
            const topRated = await Book.find({
                _id: { $nin: trending.map(t => t._id) },
                stock: { $gt: 0 }
            }).sort({ rating: -1, numReviews: -1 }).limit(5 - trending.length);
            trending = [...trending, ...topRated];
        }

        res.json({
            message: 'Tendances du moment',
            books: trending
        });

    } catch (err) {
        console.error("Erreur trending:", err);
        res.status(500).json({ message: "Erreur du moteur de recommandation" });
    }
});

module.exports = router;
