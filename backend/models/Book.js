// backend/models/Book.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: 'Utilisateur' },
    rating: { type: Number, required: true },
    comment: { type: String, required: true }
}, {
    timestamps: true
});

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true }, // Important pour l'IA
    description: String,
    image: String,
    stock: { type: Number, default: 10 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema]
});

module.exports = mongoose.model('Book', bookSchema);