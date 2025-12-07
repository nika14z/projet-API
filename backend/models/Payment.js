// backend/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'paypal', 'bank_transfer'],
        default: 'card'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true
    },
    cardLast4: {
        type: String
    },
    refundedAmount: {
        type: Number,
        default: 0
    },
    refundReason: {
        type: String
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

// Générer un ID de transaction unique avant la sauvegarde
paymentSchema.pre('save', function(next) {
    if (!this.transactionId) {
        this.transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    }
   
});

module.exports = mongoose.model('Payment', paymentSchema);
