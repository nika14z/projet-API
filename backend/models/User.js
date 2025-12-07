// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const escapeHtml = require('escape-html');
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
    type: String,
    required: true,
    // Use a built-in validator for minimum length (optional, but good practice)
    minlength: [12, 'Password must be at least 12 characters long'], 
    
    // Custom validator using a Regular Expression for complexity
    validate: {
      validator: function(value) {
        // Regex for:
        // - At least 12 characters (?=.{12,})
        // - At least one uppercase letter (?=.*[A-Z])
        // - At least one lowercase letter (?=.*[a-z])
        // - At least one number (?=.*[0-9])
        // - At least one special character (?=.*[^A-Za-z0-9])
        const complexityRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}$/;
        
        return complexityRegex.test(value);
      },
      message: 'Password must contain at least 12 characters, including one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  },
    role:     { type: String, default: 'user', enum: ['user', 'admin'] }
}, { timestamps: true });


// Hash password before saving
userSchema.pre('save', async function() {
    this.username = escapeHtml(this.username);
    this.email = escapeHtml(this.email);
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw new Error(err.message);
    }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.set('toJSON', {
    transform: function(doc, ret, options) {
        delete ret.password;
        // expose a stable `id` field for frontend compatibility
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);