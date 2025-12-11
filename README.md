# Biblio Poche - API de Librairie en Ligne

## Table des Matieres

1. [Presentation du Projet](#presentation-du-projet)
2. [Architecture](#architecture)
3. [Technologies Utilisees](#technologies-utilisees)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Lancement](#lancement)
7. [API REST](#api-rest)
8. [API GraphQL](#api-graphql)
9. [Authentification](#authentification)
10. [Securite](#securite)
11. [Tests de Vulnerabilites](#tests-de-vulnerabilites)
12. [Documentation API](#documentation-api)
13. [Structure du Projet](#structure-du-projet)
14. [Modeles de Donnees](#modeles-de-donnees)
15. [Fonctionnalites](#fonctionnalites)

---

## Presentation du Projet

**Biblio Poche** est une API complete pour une librairie en ligne. Elle permet de :

- Gerer un catalogue de livres avec categories et avis
- Authentifier les utilisateurs (inscription, connexion, JWT)
- Gerer les commandes et le panier
- Traiter les paiements (simulation)
- Administrer la plateforme (dashboard admin)
- Obtenir des recommandations personnalisees (moteur IA)

L'API expose deux interfaces :
- **REST** : Pour les operations CRUD classiques
- **GraphQL** : Pour les requetes flexibles et complexes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│              (Frontend React / Mobile / Tiers)                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   REST API   │  │   GraphQL    │  │      Swagger UI      │   │
│  │  /api/*      │  │  /graphql    │  │     /api-docs        │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘   │
│         │                 │                                      │
│  ┌──────┴─────────────────┴──────┐                              │
│  │        MIDDLEWARES            │                              │
│  │  • Auth (JWT)                 │                              │
│  │  • Rate Limiting              │                              │
│  │  • Helmet (Security Headers)  │                              │
│  │  • CORS                       │                              │
│  │  • XSS Protection             │                              │
│  └──────────────┬────────────────┘                              │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MONGODB                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Users   │ │  Books   │ │  Orders  │ │ Payments │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technologies Utilisees

### Backend
| Technologie | Version | Description |
|-------------|---------|-------------|
| Node.js | v18+ | Runtime JavaScript |
| Express.js | 4.x | Framework web |
| MongoDB | 6+ | Base de donnees NoSQL |
| Mongoose | 9.x | ODM pour MongoDB |

### API
| Technologie | Description |
|-------------|-------------|
| REST | API CRUD classique |
| GraphQL | API flexible avec Apollo Server |
| Swagger/OpenAPI | Documentation interactive |

### Securite
| Technologie | Description |
|-------------|-------------|
| JWT | Authentification par tokens |
| bcryptjs | Hashage des mots de passe |
| Helmet | Headers HTTP securises |
| express-rate-limit | Protection contre le brute force |
| xss | Sanitization des entrees |

### Outils
| Outil | Description |
|-------|-------------|
| Postman | Tests d'API |
| Swagger UI | Documentation interactive |
| GraphQL Playground | Interface GraphQL |

---

## Installation

### Prerequis

- Node.js v18 ou superieur
- MongoDB (local ou Atlas)
- npm ou yarn

### Etapes

1. **Cloner le projet**
```bash
git clone https://github.com/votre-repo/biblio-poche.git
cd biblio-poche
```

2. **Installer les dependances backend**
```bash
cd backend
npm install
```

3. **Installer les dependances frontend** (optionnel)
```bash
cd ../frontend
npm install
```

4. **Installer les outils de test de securite** (optionnel)
```bash
cd ../security_tests
pip install -r requirements.txt
```

---

## Configuration

### Variables d'Environnement

Creer un fichier `.env` dans le dossier `backend/` :

```env
# Serveur
PORT=5000
NODE_ENV=development

# Base de donnees
MONGO_URI=mongodb://127.0.0.1:27017/biblio-poche

# Authentification
JWT_SECRET=votre_secret_jwt_tres_long_et_complexe

# Administration
ADMIN_SECRET_KEY=BIBLIO_ADMIN_SECRET_2024
```

### Description des Variables

| Variable | Description | Defaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | 5000 |
| `NODE_ENV` | Environnement (development/production) | development |
| `MONGO_URI` | URI de connexion MongoDB | mongodb://127.0.0.1:27017/biblio-poche |
| `JWT_SECRET` | Cle secrete pour signer les JWT | secret |
| `ADMIN_SECRET_KEY` | Cle pour creer le premier admin | BIBLIO_ADMIN_SECRET_2024 |

---

## Lancement

### Demarrer MongoDB (si local)
```bash
mongod
```

### Demarrer le serveur backend
```bash
cd backend
node server.js
```

### URLs Disponibles

| Service | URL |
|---------|-----|
| API REST | http://localhost:5000/api |
| GraphQL | http://localhost:5000/graphql |
| Documentation Swagger | http://localhost:5000/api-docs |

---

## API REST

### Endpoints par Categorie

#### Authentification (`/api/auth`)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/register` | Inscription | Non |
| POST | `/login` | Connexion | Non |

#### Livres (`/api/books`)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Liste des livres | Non |
| GET | `/:id` | Details d'un livre | Non |
| POST | `/` | Ajouter un livre | Non |
| POST | `/:id/reviews` | Ajouter un avis | Oui |

#### Commandes (`/api/orders`)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/orders` | Creer une commande | Oui |
| GET | `/myorders` | Mes commandes | Oui |
| GET | `/:id` | Details d'une commande | Oui |
| PUT | `/:id` | Modifier l'adresse | Oui |
| PUT | `/:id/cancel` | Annuler | Oui |

#### Paiements (`/api/payments`)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/` | Creer un paiement | Oui |
| GET | `/` | Mes paiements | Oui |
| GET | `/:id` | Details d'un paiement | Oui |
| GET | `/stats/summary` | Resume statistique | Oui |
| POST | `/:id/refund` | Demander remboursement | Oui |

#### Profil (`/api/users`)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| PUT | `/profile` | Modifier profil | Oui |
| DELETE | `/profile` | Supprimer compte | Oui |

#### Recommandations IA (`/api/ai`)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/recommend` | Recommandations panier | Non |
| GET | `/personalized` | Recommandations personnalisees | Oui |
| GET | `/also-bought/:bookId` | Clients ont aussi achete | Non |
| GET | `/trending` | Livres tendance | Non |

#### Administration (`/api/admin`)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/setup-admin` | Premier admin (cle secrete) | Non |
| POST | `/create-admin` | Nouvel admin | Admin |
| GET | `/stats` | Statistiques dashboard | Admin |
| GET | `/books` | Liste livres (pagine) | Admin |
| POST | `/books` | Ajouter livre | Admin |
| PUT | `/books/:id` | Modifier livre | Admin |
| DELETE | `/books/:id` | Supprimer livre | Admin |
| GET | `/orders` | Toutes les commandes | Admin |
| PUT | `/orders/:id` | Modifier commande | Admin |
| GET | `/users` | Liste utilisateurs | Admin |
| PUT | `/users/:id/role` | Modifier role | Admin |
| DELETE | `/users/:id` | Supprimer utilisateur | Admin |

---

## API GraphQL

### Endpoint
```
POST http://localhost:5000/graphql
```

### Queries Disponibles

```graphql
type Query {
    # Livres
    books(category: String): [Book]
    book(id: ID!): Book
    searchBooks(query: String!): [Book]

    # Utilisateurs
    me: User
    users: [User]  # Admin only

    # Commandes
    myOrders: [Order]
    order(id: ID!): Order
    allOrders: [Order]  # Admin only

    # Paiements
    myPayments: [Payment]

    # Admin
    adminStats: AdminStats
}
```

### Mutations Disponibles

```graphql
type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload
    login(email: String!, password: String!): AuthPayload

    # Livres
    createBook(input: BookInput!): Book
    updateBook(id: ID!, input: BookUpdateInput!): Book
    deleteBook(id: ID!): Boolean
    addReview(bookId: ID!, input: ReviewInput!): Book

    # Commandes
    createOrder(input: OrderInput!): Order
    cancelOrder(id: ID!): Order
    updateOrderAddress(id: ID!, shippingAddress: ShippingAddressInput!): Order

    # Profil
    updateProfile(username: String, email: String, password: String): User
    deleteAccount: Boolean
}
```

### Exemple de Requete

```graphql
query {
    book(id: "507f1f77bcf86cd799439011") {
        title
        author
        price
        reviews {
            user {
                username
            }
            rating
            comment
        }
    }
}
```

---

## Authentification

### Flux d'Authentification

```
1. Inscription/Connexion
   POST /api/auth/register ou /api/auth/login
   Body: { email, password, [username] }

2. Reception du Token
   Response: { token: "eyJhbGc...", user: {...} }

3. Utilisation du Token
   Header: Authorization: Bearer eyJhbGc...
```

### Structure du JWT

```json
{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "id": "user_id",
        "role": "user|admin",
        "iat": 1234567890,
        "exp": 1234567890
    },
    "signature": "..."
}
```

### Duree de Validite
- Token valide **7 jours** apres creation

---

## Securite

### Mesures Implementees

#### 1. Protection contre les Injections

| Type | Protection | Implementation |
|------|------------|----------------|
| NoSQL Injection | Validation des types | Mongoose schemas |
| XSS | Sanitization | Bibliotheque `xss` |
| Injection de commandes | Pas d'eval/exec | Code securise |

#### 2. Authentification & Autorisation

| Mesure | Description |
|--------|-------------|
| JWT | Tokens signes avec secret |
| Bcrypt | Hashage mots de passe (10 rounds) |
| Role-based | Verification admin dans routes |

#### 3. Protection HTTP

| Header | Protection |
|--------|------------|
| Helmet | Headers securises (X-Frame-Options, etc.) |
| CORS | Controle des origines |
| Rate Limiting | 1000 req/15min par IP |

#### 4. Validation des Donnees

```javascript
// Exemple de validation dans les routes
if (!email || !password) {
    return res.status(400).json({ message: 'Champs manquants' });
}

// Sanitization XSS
const cleanTitle = xss(req.body.title);
```

---

## Tests de Vulnerabilites

### Script de Test

Un script Python est fourni pour tester les vulnerabilites :

```bash
cd security_tests
pip install -r requirements.txt
python test_vulnerabilities.py
```

### Vulnerabilites Testees

#### 1. JWT (JSON Web Token)
- Algorithm None Attack
- Payload Manipulation
- Invalid Signature
- Format Validation

#### 2. NoSQL Injection
- Login Bypass ($ne, $gt)
- Regex Injection
- $where JavaScript Injection
- Query Parameter Injection

#### 3. XSS (Cross-Site Scripting)
- Script Tags
- Event Handlers (onerror, onload)
- SVG Injection
- Encoded Payloads
- Unicode Escape

### Resultat Attendu

```
╔══════════════════════════════════════════════════════════════╗
║         BIBLIO POCHE - TESTS DE SECURITE API                 ║
╚══════════════════════════════════════════════════════════════╝

[TEST] JWT Algorithm None Attack
[SECURISE] Algorithm None Attack bloquee

[TEST] NoSQL Injection - Login Bypass ($ne)
[SECURISE] Injection $ne bloquee

[TEST] XSS Stored - Creation de livre
[SECURISE] Payload sanitize correctement

══════════════════ RAPPORT FINAL ══════════════════
Tests executes:  15
Securises:       15
Vulnerables:     0
Taux de securite: 100%
```

---

## Documentation API

### Swagger UI

Accessible a : `http://localhost:5000/api-docs`

Interface interactive pour :
- Explorer tous les endpoints
- Tester les requetes directement
- Voir les schemas de donnees
- Authentification integree

### Collection Postman

Fichiers disponibles dans `/postman/` :
- `Biblio_Poche_API.postman_collection.json`
- `Biblio_Poche_Environment.postman_environment.json`

**Import dans Postman :**
1. File > Import
2. Selectionner les deux fichiers
3. Executer "Login" pour obtenir un token

### Documentation Markdown

Fichier `API_DOCUMENTATION.md` contenant :
- Liste complete des endpoints
- Exemples de requetes cURL
- Exemples GraphQL
- Codes d'erreur

---

## Structure du Projet

```
biblio-poche/
│
├── backend/
│   ├── server.js              # Point d'entree
│   ├── package.json           # Dependances
│   ├── .env                   # Variables d'environnement
│   ├── swagger.json           # Documentation OpenAPI
│   │
│   ├── models/                # Schemas Mongoose
│   │   ├── Book.js
│   │   ├── User.js
│   │   ├── Order.js
│   │   └── Payment.js
│   │
│   ├── routes/                # Routes REST
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── userRoutes.js
│   │   ├── adminRoutes.js
│   │   └── aiRoutes.js
│   │
│   ├── middleware/            # Middlewares
│   │   ├── auth.js            # Verification JWT
│   │   └── admin.js           # Verification role admin
│   │
│   └── graphql/               # Configuration GraphQL
│       ├── index.js           # Apollo Server
│       ├── schema.js          # Type definitions
│       └── resolvers.js       # Resolvers
│
├── frontend/                  # Application React (optionnel)
│   └── ...
│
├── postman/                   # Collection Postman
│   ├── Biblio_Poche_API.postman_collection.json
│   └── Biblio_Poche_Environment.postman_environment.json
│
├── security_tests/            # Tests de securite
│   ├── test_vulnerabilities.py
│   └── requirements.txt
│
├── API_DOCUMENTATION.md       # Documentation API
└── README.md                  # Ce fichier
```

---

## Modeles de Donnees

### User (Utilisateur)

```javascript
{
    username: String,      // Unique, requis
    email: String,         // Unique, requis
    password: String,      // Hashe avec bcrypt
    role: String,          // 'user' | 'admin'
    createdAt: Date
}
```

### Book (Livre)

```javascript
{
    title: String,         // Requis
    author: String,        // Requis
    price: Number,         // Requis
    category: String,      // Requis
    description: String,
    image: String,
    stock: Number,         // Default: 10
    rating: Number,        // Moyenne des avis
    numReviews: Number,
    reviews: [{
        user: ObjectId,
        name: String,
        rating: Number,
        comment: String,
        createdAt: Date
    }],
    createdAt: Date
}
```

### Order (Commande)

```javascript
{
    user: ObjectId,        // Reference User
    orderItems: [{
        product: ObjectId,
        title: String,
        qty: Number,
        image: String,
        price: Number
    }],
    shippingAddress: {
        address: String,
        city: String,
        postalCode: String,
        country: String
    },
    paymentMethod: String,
    totalPrice: Number,
    isPaid: Boolean,
    paidAt: Date,
    status: String,        // pending|confirmed|shipped|delivered|cancelled
    createdAt: Date
}
```

### Payment (Paiement)

```javascript
{
    user: ObjectId,
    order: ObjectId,
    amount: Number,
    paymentMethod: String,
    status: String,        // pending|completed|failed|refunded
    transactionId: String,
    cardLast4: String,
    refundedAmount: Number,
    refundReason: String,
    createdAt: Date
}
```

---

## Fonctionnalites

### Pour les Utilisateurs

- **Catalogue** : Parcourir les livres par categorie
- **Recherche** : Trouver des livres par titre/auteur
- **Avis** : Laisser des notes et commentaires
- **Panier** : Ajouter des livres et commander
- **Commandes** : Suivre l'historique des achats
- **Paiements** : Payer et demander des remboursements
- **Profil** : Gerer ses informations

### Pour les Administrateurs

- **Dashboard** : Statistiques globales (revenus, commandes, etc.)
- **Gestion livres** : CRUD complet sur le catalogue
- **Gestion commandes** : Modifier statuts, annuler
- **Gestion utilisateurs** : Voir, modifier roles, supprimer
- **Gestion paiements** : Suivre et rembourser

### Moteur de Recommandation IA

- **Recommandations panier** : Basees sur les categories selectionnees
- **Personnalisation** : Basees sur l'historique d'achat
- **"Aussi achete"** : Livres frequemment achetes ensemble
- **Tendances** : Livres populaires du moment

---

## Contribution

1. Fork le projet
2. Creer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajout nouvelle fonctionnalite'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Creer une Pull Request

---

## Licence

MIT License - Voir le fichier `LICENSE` pour plus de details.

---

## Contact

- **Projet** : Biblio Poche
- **Email** : contact@biblio-poche.com
- **Documentation** : http://localhost:5000/api-docs
