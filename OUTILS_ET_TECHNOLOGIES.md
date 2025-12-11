# Outils et Technologies - Biblio-Poche

Ce document explique chaque outil/librairie utilise dans le projet et son fonctionnement.

---

# PARTIE 1 : BACKEND (Node.js)

## 1.1 Express.js

**Qu'est-ce que c'est ?**
Framework web minimaliste pour Node.js qui permet de creer des API REST.

**Comment ca fonctionne ?**
```javascript
const express = require('express');
const app = express();

// Definir une route
app.get('/api/books', (req, res) => {
    res.json({ message: 'Liste des livres' });
});

// Demarrer le serveur
app.listen(5000, () => console.log('Serveur demarre'));
```

**Dans le projet (server.js) :**
```javascript
const express = require('express');
const app = express();

app.use(express.json());  // Parse le JSON des requetes
app.use('/api/books', bookRoutes);  // Monte les routes
```

**Role :** Gere toutes les requetes HTTP (GET, POST, PUT, DELETE).

---

## 1.2 MongoDB + Mongoose

**MongoDB** = Base de donnees NoSQL (stocke des documents JSON)
**Mongoose** = ODM (Object Document Mapper) pour interagir avec MongoDB

**Comment ca fonctionne ?**
```javascript
const mongoose = require('mongoose');

// Connexion a la base
mongoose.connect('mongodb://127.0.0.1:27017/biblio-poche');

// Definir un schema (structure des donnees)
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: String,
    price: Number
});

// Creer un modele
const Book = mongoose.model('Book', bookSchema);

// Utiliser le modele
const livre = new Book({ title: 'Dune', author: 'Herbert', price: 25 });
await livre.save();  // Sauvegarde en base

const livres = await Book.find();  // Recupere tous les livres
```

**Dans le projet :**
- `models/Book.js` : Schema des livres
- `models/User.js` : Schema des utilisateurs
- `models/Order.js` : Schema des commandes
- `models/Payment.js` : Schema des paiements

---

## 1.3 JSON Web Token (JWT)

**Qu'est-ce que c'est ?**
Systeme d'authentification par token. Apres connexion, l'utilisateur recoit un token qu'il envoie a chaque requete.

**Comment ca fonctionne ?**
```javascript
const jwt = require('jsonwebtoken');

// CREER un token (lors du login)
const token = jwt.sign(
    { id: user._id, role: user.role },  // Payload (donnees)
    'ma_cle_secrete',                    // Cle secrete
    { expiresIn: '7d' }                  // Expiration
);

// VERIFIER un token (a chaque requete)
const decoded = jwt.verify(token, 'ma_cle_secrete');
console.log(decoded.id);    // ID de l'utilisateur
console.log(decoded.role);  // Role (user/admin)
```

**Dans le projet :**
- `authRoutes.js` : Cree le token au login/register
- `middleware/auth.js` : Verifie le token sur les routes protegees

---

## 1.4 Bcrypt.js

**Qu'est-ce que c'est ?**
Librairie pour hasher (chiffrer) les mots de passe de maniere securisee.

**Comment ca fonctionne ?**
```javascript
const bcrypt = require('bcryptjs');

// HASHER un mot de passe (a l'inscription)
const salt = await bcrypt.genSalt(10);  // Genere un "sel" aleatoire
const hash = await bcrypt.hash('MonMotDePasse123', salt);
// hash = "$2a$10$xK8Dj3kL2mN5pQ7rS1tU3..."

// COMPARER (au login)
const isMatch = await bcrypt.compare('MonMotDePasse123', hash);
// isMatch = true si le mot de passe correspond
```

**Dans le projet (User.js) :**
```javascript
userSchema.pre('save', async function() {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
```

**Pourquoi c'est securise ?**
- Le mot de passe n'est JAMAIS stocke en clair
- Meme si la BDD est volee, les hash sont inexploitables
- Le "sel" rend chaque hash unique (meme mot de passe = hash different)

---

## 1.5 Helmet

**Qu'est-ce que c'est ?**
Middleware qui securise les en-tetes HTTP.

**Comment ca fonctionne ?**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

**Ce qu'il ajoute :**
| En-tete | Protection |
|---------|------------|
| X-Content-Type-Options | Empeche le sniffing MIME |
| X-Frame-Options | Protege contre le clickjacking |
| X-XSS-Protection | Active le filtre XSS du navigateur |
| Strict-Transport-Security | Force HTTPS |

---

## 1.6 Express Rate Limit

**Qu'est-ce que c'est ?**
Limite le nombre de requetes par IP pour eviter les attaques par force brute.

**Comment ca fonctionne ?**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // Fenetre de 15 minutes
    max: 10000,                 // Max 10000 requetes par fenetre
    message: 'Trop de requetes, reessayez plus tard'
});

app.use(limiter);
```

**Dans le projet (server.js) :**
- Limite : 10000 requetes par IP toutes les 15 minutes
- Protege contre les attaques DDoS et brute force

---

## 1.7 XSS (librairie)

**Qu'est-ce que c'est ?**
Librairie qui nettoie les entrees utilisateur pour eviter les attaques XSS.

**Comment ca fonctionne ?**
```javascript
const xss = require('xss');

const input = '<script>alert("hack")</script>';
const clean = xss(input);
// clean = '&lt;script&gt;alert("hack")&lt;/script&gt;'
```

**Dans le projet (bookRoutes.js) :**
```javascript
const cleanTitle = xss(req.body.title);
const cleanAuthor = xss(req.body.author);
```

---

## 1.8 CORS

**Qu'est-ce que c'est ?**
Cross-Origin Resource Sharing - Permet au frontend (port 3000) d'appeler le backend (port 5000).

**Comment ca fonctionne ?**
```javascript
const cors = require('cors');
app.use(cors());  // Autorise toutes les origines
```

**Sans CORS :** Le navigateur bloquerait les requetes du frontend vers le backend car ils sont sur des ports differents.

---

## 1.9 Swagger UI

**Qu'est-ce que c'est ?**
Outil de documentation interactive pour l'API.

**Comment ca fonctionne ?**
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

**Acces :** http://localhost:5000/api-docs

---

## 1.10 Dotenv

**Qu'est-ce que c'est ?**
Charge les variables d'environnement depuis un fichier `.env`.

**Comment ca fonctionne ?**
```javascript
require('dotenv').config();

console.log(process.env.PORT);        // 5000
console.log(process.env.JWT_SECRET);  // votre_phrase_secrete...
```

**Fichier .env :**
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/biblio-poche
JWT_SECRET=votre_phrase_secrete_super_securisee_2025
```

---

# PARTIE 2 : FRONTEND (React)

## 2.1 React

**Qu'est-ce que c'est ?**
Librairie JavaScript pour construire des interfaces utilisateur avec des composants.

**Comment ca fonctionne ?**
```javascript
import React, { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);  // State (etat)

    return (
        <div>
            <p>Compteur : {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Incrementer
            </button>
        </div>
    );
}
```

**Concepts cles :**
- **Composants** : Blocs reutilisables (Home, Cart, BookDetails...)
- **State (useState)** : Donnees qui changent et declenchent un re-rendu
- **Props** : Donnees passees d'un parent a un enfant
- **useEffect** : Execute du code au chargement ou quand une donnee change

---

## 2.2 React Router DOM

**Qu'est-ce que c'est ?**
Gere la navigation entre les pages sans recharger (SPA - Single Page Application).

**Comment ca fonctionne ?**
```javascript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
    return (
        <BrowserRouter>
            {/* Liens de navigation */}
            <Link to="/">Accueil</Link>
            <Link to="/cart">Panier</Link>

            {/* Definition des routes */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/book/:id" element={<BookDetails />} />
            </Routes>
        </BrowserRouter>
    );
}
```

**Dans le projet (App.js) :**
- `/` : Page d'accueil (Home)
- `/cart` : Panier
- `/book/:id` : Details d'un livre
- `/login`, `/register` : Authentification
- `/admin` : Dashboard admin

---

## 2.3 Axios

**Qu'est-ce que c'est ?**
Client HTTP pour faire des requetes vers l'API backend.

**Comment ca fonctionne ?**
```javascript
import axios from 'axios';

// GET - Recuperer des donnees
const response = await axios.get('http://localhost:5000/api/books');
console.log(response.data);  // Liste des livres

// POST - Envoyer des donnees
const response = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'test@test.com',
    password: 'MonMotDePasse123!'
});
console.log(response.data.token);  // Token JWT

// Avec header Authorization
const response = await axios.get('http://localhost:5000/api/orders/myorders', {
    headers: { Authorization: `Bearer ${token}` }
});
```

**Dans le projet :**
- Toutes les pages utilisent axios pour communiquer avec l'API
- Le token est envoye dans les headers pour les routes protegees

---

## 2.4 localStorage

**Qu'est-ce que c'est ?**
Stockage persistant dans le navigateur (survit au rafraichissement).

**Comment ca fonctionne ?**
```javascript
// SAUVEGARDER
localStorage.setItem('token', 'eyJhbGciOiJIUzI1...');
localStorage.setItem('user', JSON.stringify({ id: '123', name: 'John' }));
localStorage.setItem('biblio-cart', JSON.stringify([{ id: 1, qty: 2 }]));

// RECUPERER
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const cart = JSON.parse(localStorage.getItem('biblio-cart'));

// SUPPRIMER
localStorage.removeItem('token');
```

**Dans le projet :**
- `token` : JWT de l'utilisateur connecte
- `user` : Infos de l'utilisateur (id, username, role)
- `biblio-cart` : Contenu du panier

---

# PARTIE 3 : LA CARTE (Leaflet + React-Leaflet)

## 3.1 Qu'est-ce que Leaflet ?

**Leaflet** est une librairie JavaScript open-source pour afficher des cartes interactives.
**React-Leaflet** est l'adaptation de Leaflet pour React.

## 3.2 Comment ca fonctionne ?

### Architecture
```
+------------------+
|   OpenStreetMap  |  <-- Fournisseur de tuiles (images de la carte)
+------------------+
         |
         v
+------------------+
|     Leaflet      |  <-- Librairie qui assemble les tuiles
+------------------+
         |
         v
+------------------+
|  React-Leaflet   |  <-- Composants React pour Leaflet
+------------------+
         |
         v
+------------------+
|   MapLocator.js  |  <-- Notre composant
+------------------+
```

### Les tuiles (Tiles)
La carte est composee de petites images carrees appelees "tuiles" :
```
+---+---+---+
| 1 | 2 | 3 |
+---+---+---+
| 4 | 5 | 6 |
+---+---+---+
| 7 | 8 | 9 |
+---+---+---+
```

Quand tu zoomes ou deplace la carte, Leaflet telecharge les tuiles necessaires depuis OpenStreetMap.

## 3.3 Code explique (MapLocator.js)

```javascript
// IMPORTS
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';  // Styles CSS de Leaflet
import L from 'leaflet';

// Configuration des icones (bug connu de Leaflet avec Webpack)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],      // Taille de l'icone
    iconAnchor: [12, 41]     // Point d'ancrage (bas du marqueur)
});
L.Marker.prototype.options.icon = DefaultIcon;
```

### Liste des magasins (donnees statiques)
```javascript
const STORES = [
    {
        id: 1,
        name: "Biblio Paris Centre",
        lat: 48.8566,   // Latitude
        lng: 2.3522,    // Longitude
        address: "10 Rue de Rivoli, Paris"
    },
    { id: 2, name: "Biblio Lyon Part-Dieu", lat: 45.7640, lng: 4.8357, ... },
    { id: 3, name: "Biblio Marseille Vieux-Port", lat: 43.2965, lng: 5.3698, ... },
    { id: 4, name: "Biblio Bordeaux Lac", lat: 44.8378, lng: -0.5792, ... }
];
```

### Composant pour deplacer la vue
```javascript
function ChangeView({ center, zoom }) {
    const map = useMap();       // Hook pour acceder a l'instance Leaflet
    map.setView(center, zoom);  // Deplace la carte vers le centre avec le zoom
    return null;
}
```

### Composant principal
```javascript
function MapLocator({ onSelectStore }) {
    // STATE
    const [position, setPosition] = useState([46.603354, 1.888334]); // Centre France
    const [zoom, setZoom] = useState(5);
    const [userLocation, setUserLocation] = useState(null);

    // GEOLOCALISATION (API du navigateur)
    const locateUser = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);  // Centre sur l'utilisateur
                setUserLocation([latitude, longitude]);
                setZoom(12);  // Zoom plus proche
            },
            () => alert("Impossible de recuperer votre position.")
        );
    };

    return (
        <div>
            {/* Bouton de geolocalisation */}
            <button onClick={locateUser}>Me localiser</button>

            {/* CARTE */}
            <MapContainer center={position} zoom={zoom} style={{ height: '350px' }}>

                {/* Composant qui met a jour la vue */}
                <ChangeView center={position} zoom={zoom} />

                {/* TUILES - Images de la carte depuis OpenStreetMap */}
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/*
                    {s} = sous-domaine (a, b, c) pour repartir la charge
                    {z} = niveau de zoom
                    {x}, {y} = coordonnees de la tuile
                */}

                {/* MARQUEUR de l'utilisateur */}
                {userLocation && (
                    <Marker position={userLocation}>
                        <Popup>Vous etes ici !</Popup>
                    </Marker>
                )}

                {/* MARQUEURS des magasins */}
                {STORES.map(store => (
                    <Marker key={store.id} position={[store.lat, store.lng]}>
                        <Popup>
                            <b>{store.name}</b><br/>
                            {store.address}<br/>
                            <button onClick={() => onSelectStore(store)}>
                                Choisir ce point
                            </button>
                        </Popup>
                    </Marker>
                ))}

            </MapContainer>
        </div>
    );
}
```

## 3.4 Fonctionnement de la geolocalisation

```
UTILISATEUR clique sur "Me localiser"
              |
              v
+--------------------------------+
|  navigator.geolocation         |
|  .getCurrentPosition()         |
+--------------------------------+
              |
              v
+--------------------------------+
|  Navigateur demande permission |
|  "Autoriser la localisation?"  |
+--------------------------------+
              |
       +------+------+
       |             |
    ACCEPTE       REFUSE
       |             |
       v             v
+------------+  +------------------+
| GPS/WiFi   |  | alert("Erreur")  |
| detecte    |  +------------------+
| position   |
+------------+
       |
       v
+--------------------------------+
|  Callback avec coords          |
|  { latitude: 48.85, lng: 2.35 }|
+--------------------------------+
       |
       v
+--------------------------------+
|  setPosition([lat, lng])       |
|  setZoom(12)                   |
|  Carte se deplace              |
+--------------------------------+
```

## 3.5 Les composants React-Leaflet

| Composant | Role |
|-----------|------|
| `<MapContainer>` | Conteneur principal de la carte |
| `<TileLayer>` | Affiche les tuiles (images) de la carte |
| `<Marker>` | Ajoute un marqueur (point) sur la carte |
| `<Popup>` | Bulle d'info qui s'ouvre au clic sur un marqueur |
| `useMap()` | Hook pour manipuler la carte (zoom, deplacement) |

## 3.6 URL des tuiles OpenStreetMap

```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

Exemple concret :
https://a.tile.openstreetmap.org/12/2074/1410.png

{s} = "a" (sous-domaine)
{z} = 12 (niveau de zoom, 0-19)
{x} = 2074 (colonne de la tuile)
{y} = 1410 (ligne de la tuile)
```

## 3.7 Pourquoi OpenStreetMap ?

| Critere | OpenStreetMap | Google Maps |
|---------|---------------|-------------|
| Prix | Gratuit | Payant apres quota |
| Licence | Open source | Proprietaire |
| API Key | Non requise | Requise |
| Qualite | Tres bonne | Excellente |

---

# PARTIE 4 : RESUME DES TECHNOLOGIES

## Backend
| Outil | Role |
|-------|------|
| **Express** | Framework web, gestion des routes |
| **MongoDB** | Base de donnees NoSQL |
| **Mongoose** | ODM pour MongoDB |
| **JWT** | Authentification par token |
| **Bcrypt** | Hashage des mots de passe |
| **Helmet** | Securite des en-tetes HTTP |
| **Rate Limit** | Protection contre brute force |
| **XSS** | Protection contre injections XSS |
| **CORS** | Autorise les requetes cross-origin |
| **Swagger** | Documentation API |
| **Dotenv** | Variables d'environnement |

## Frontend
| Outil | Role |
|-------|------|
| **React** | Framework UI, composants |
| **React Router** | Navigation SPA |
| **Axios** | Requetes HTTP vers l'API |
| **Leaflet** | Carte interactive |
| **React-Leaflet** | Composants React pour Leaflet |
| **localStorage** | Stockage persistant (token, panier) |

## Architecture globale
```
+-------------+     HTTP/JSON      +-------------+     Mongoose     +----------+
|   FRONTEND  | <----------------> |   BACKEND   | <--------------> | MongoDB  |
|   (React)   |                    |  (Express)  |                  |          |
|  Port 3000  |                    |  Port 5000  |                  | Port 27017|
+-------------+                    +-------------+                  +----------+
      |                                   |
      v                                   v
+-------------+                    +-------------+
| localStorage|                    | JWT + Bcrypt|
| (token,cart)|                    | (securite)  |
+-------------+                    +-------------+
```
