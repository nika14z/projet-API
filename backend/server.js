// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); 
const helmet = require('helmet'); // On garde Helmet (protection Headers)
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. SÉCURITÉ EN-TÊTES ---
app.use(helmet()); 

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 100 requests per window
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// --- 2. CONFIGURATION ---
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Note : On a retiré mongoSanitize qui faisait planter le serveur.
// Nous allons protéger le login manuellement dans les routes.

// --- 3. CONNEXION MONGODB ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biblio-poche')
  .then(() => console.log('MongoDB connecté (Mode Sécurisé Manuel)'))
  .catch(err => console.log(err));

// --- 4. ROUTES ---
const bookRoutes = require('./routes/bookRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/api/books', bookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders',orderRoutes);

// --- 5. DOCUMENTATION ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
    res.send('API Biblio Poche en ligne 🛡️');
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});