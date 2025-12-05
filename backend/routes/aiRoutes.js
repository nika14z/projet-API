// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Règles d'association (Si A alors B)
const categoryAssociations = {
    'Science-Fiction': 'Fantasy',
    'Fantasy': 'Science-Fiction',
    'Policier': 'Roman',
    'Roman': 'Policier',
    'Manga': 'Fantasy'
};

router.post('/recommend', async (req, res) => {
    const { categoriesInCart } = req.body;

    try {
        // 1. Si le panier est vide, on propose des Best-Sellers (les moins chers ici)
        if (!categoriesInCart || categoriesInCart.length === 0) {
            const cheapBooks = await Book.find().sort({ price: 1 }).limit(3);
            return res.json(cheapBooks);
        }

        // 2. Analyse de fréquence pour trouver la catégorie dominante
        const counts = {};
        let favoriteCategory = categoriesInCart[0];
        let maxCount = 0;

        for (const cat of categoriesInCart) {
            counts[cat] = (counts[cat] || 0) + 1;
            if (counts[cat] > maxCount) {
                maxCount = counts[cat];
                favoriteCategory = cat;
            }
        }

        // 3. Déterminer la catégorie associée
        // AMÉLIORATION : Si pas d'association trouvée, on garde la catégorie favorite comme "secondaire"
        const associatedCategory = categoryAssociations[favoriteCategory] || favoriteCategory;

        console.log(`IA: Panier contient ${favoriteCategory}, recommandation -> ${associatedCategory}`);

        // 4. Requête : On cherche des livres de la catégorie favorite OU associée
        let recommendations = await Book.find({
            category: { $in: [favoriteCategory, associatedCategory] }
        });

        // 5. Mélanger les résultats
        recommendations = recommendations.sort(() => 0.5 - Math.random());

        // 6. Renvoyer les 3 premiers
        res.json(recommendations.slice(0, 3));

    } catch (err) {
        console.error("Erreur IA:", err);
        res.status(500).json({ message: "Erreur du moteur de recommandation" });
    }
});

module.exports = router;