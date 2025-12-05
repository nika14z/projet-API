// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); 
const helmet = require('helmet'); // On garde Helmet (protection Headers)
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. SÉCURITÉ EN-TÊTES ---
app.use(helmet()); 

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

app.use('/api/books', bookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

// --- 5. DOCUMENTATION ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
    res.send('API Biblio Poche en ligne 🛡️');
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});