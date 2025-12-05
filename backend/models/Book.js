// backend/models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true }, // Important pour l'IA
    description: String,
    image: String,
    stock: { type: Number, default: 10 }
});

module.exports = mongoose.model('Book', bookSchema);