# Documentation API - Biblio Poche

## Introduction

Biblio Poche expose deux types d'API :
- **API REST** : Pour les opérations CRUD classiques
- **API GraphQL** : Pour les requêtes flexibles et complexes

---

## Accès aux API

| Type | URL | Documentation interactive |
|------|-----|---------------------------|
| REST | `http://localhost:5000/api` | `http://localhost:5000/api-docs` (Swagger UI) |
| GraphQL | `http://localhost:5000/graphql` | GraphQL Playground intégré |

---

## Authentification

### Obtenir un token JWT

```bash
# Inscription
POST /api/auth/register
{
  "username": "jean_dupont",
  "email": "jean@example.com",
  "password": "motdepasse123"
}

# Connexion
POST /api/auth/login
{
  "email": "jean@example.com",
  "password": "motdepasse123"
}
```

### Utiliser le token

Ajoutez le header `Authorization` à toutes les requêtes protégées :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## API REST - Endpoints

### Auth (Authentification)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/auth/register` | Inscription | Non |
| POST | `/api/auth/login` | Connexion | Non |

### Books (Livres)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/books` | Liste des livres (filtre: `?category=Fantasy`) | Non |
| GET | `/api/books/:id` | Détails d'un livre | Non |
| POST | `/api/books` | Ajouter un livre | Non |
| POST | `/api/books/:id/reviews` | Ajouter un avis | Oui |

### Orders (Commandes)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/orders/orders` | Créer une commande | Oui |
| GET | `/api/orders/myorders` | Mes commandes | Oui |
| GET | `/api/orders/:id` | Détails d'une commande | Oui |
| PUT | `/api/orders/:id` | Modifier l'adresse | Oui |
| PUT | `/api/orders/:id/cancel` | Annuler une commande | Oui |

### Payments (Paiements)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/payments` | Créer un paiement | Oui |
| GET | `/api/payments` | Mes paiements | Oui |
| GET | `/api/payments/:id` | Détails d'un paiement | Oui |
| GET | `/api/payments/stats/summary` | Résumé des paiements | Oui |
| GET | `/api/payments/transaction/:transactionId` | Paiement par transaction | Oui |
| POST | `/api/payments/:id/refund` | Demander un remboursement | Oui |

### Users (Profil)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| PUT | `/api/users/profile` | Modifier mon profil | Oui |
| DELETE | `/api/users/profile` | Supprimer mon compte | Oui |

### AI (Recommandations)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/ai/recommend` | Recommandations basées sur le panier | Non |
| GET | `/api/ai/personalized` | Recommandations personnalisées | Oui |
| GET | `/api/ai/also-bought/:bookId` | Clients ont aussi acheté | Non |
| GET | `/api/ai/trending` | Livres tendance | Non |

### Admin (Administration)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/admin/setup-admin` | Créer le 1er admin (clé secrète) | Non |
| POST | `/api/admin/create-admin` | Créer un admin | Admin |
| GET | `/api/admin/books` | Liste des livres (paginé) | Admin |
| POST | `/api/admin/books` | Ajouter un livre | Admin |
| PUT | `/api/admin/books/:id` | Modifier un livre | Admin |
| DELETE | `/api/admin/books/:id` | Supprimer un livre | Admin |
| GET | `/api/admin/orders` | Toutes les commandes | Admin |
| GET | `/api/admin/orders/:id` | Détails commande | Admin |
| PUT | `/api/admin/orders/:id` | Modifier commande | Admin |
| DELETE | `/api/admin/orders/:id` | Supprimer commande | Admin |
| GET | `/api/admin/payments` | Tous les paiements | Admin |
| GET | `/api/admin/payments/:id` | Détails paiement | Admin |
| PUT | `/api/admin/payments/:id` | Modifier paiement | Admin |
| GET | `/api/admin/users` | Liste utilisateurs | Admin |
| PUT | `/api/admin/users/:id/role` | Modifier rôle | Admin |
| DELETE | `/api/admin/users/:id` | Supprimer utilisateur | Admin |
| GET | `/api/admin/stats` | Statistiques dashboard | Admin |

---

## API GraphQL

### Endpoint

```
POST http://localhost:5000/graphql
```

### Authentification GraphQL

Ajoutez le header HTTP :
```
Authorization: Bearer <votre_token_jwt>
```

### Queries (Lecture)

#### Récupérer tous les livres

```graphql
query {
  books(category: "Fantasy") {
    id
    title
    author
    price
    rating
    numReviews
  }
}
```

#### Récupérer un livre avec ses avis

```graphql
query {
  book(id: "507f1f77bcf86cd799439011") {
    id
    title
    author
    price
    description
    reviews {
      user {
        username
      }
      rating
      comment
      createdAt
    }
  }
}
```

#### Rechercher des livres

```graphql
query {
  searchBooks(query: "Tolkien") {
    id
    title
    author
  }
}
```

#### Profil utilisateur connecté

```graphql
query {
  me {
    id
    username
    email
    role
  }
}
```

#### Mes commandes

```graphql
query {
  myOrders {
    id
    totalPrice
    status
    orderItems {
      title
      qty
      price
    }
    shippingAddress {
      address
      city
      postalCode
      country
    }
  }
}
```

#### Mes paiements

```graphql
query {
  myPayments {
    id
    amount
    status
    paymentMethod
    createdAt
  }
}
```

#### Statistiques Admin

```graphql
query {
  adminStats {
    totalBooks
    totalUsers
    totalOrders
    totalRevenue
    recentOrders
    outOfStock
  }
}
```

### Mutations (Écriture)

#### Inscription

```graphql
mutation {
  register(input: {
    username: "nouveau_user"
    email: "user@example.com"
    password: "motdepasse123"
  }) {
    token
    user {
      id
      username
      email
    }
  }
}
```

#### Connexion

```graphql
mutation {
  login(email: "user@example.com", password: "motdepasse123") {
    token
    user {
      id
      username
      role
    }
  }
}
```

#### Créer un livre (Admin)

```graphql
mutation {
  createBook(input: {
    title: "Dune"
    author: "Frank Herbert"
    price: 19.99
    category: "Science-Fiction"
    description: "Un classique de la SF"
    stock: 50
  }) {
    id
    title
  }
}
```

#### Modifier un livre (Admin)

```graphql
mutation {
  updateBook(id: "507f1f77bcf86cd799439011", input: {
    price: 24.99
    stock: 100
  }) {
    id
    title
    price
    stock
  }
}
```

#### Supprimer un livre (Admin)

```graphql
mutation {
  deleteBook(id: "507f1f77bcf86cd799439011")
}
```

#### Ajouter un avis

```graphql
mutation {
  addReview(bookId: "507f1f77bcf86cd799439011", input: {
    rating: 5
    comment: "Excellent livre, je recommande !"
  }) {
    id
    rating
    numReviews
  }
}
```

#### Créer une commande

```graphql
mutation {
  createOrder(input: {
    orderItems: [
      {
        product: "507f1f77bcf86cd799439011"
        title: "Le Seigneur des Anneaux"
        qty: 2
        price: 24.99
        image: "https://example.com/image.jpg"
      }
    ]
    shippingAddress: {
      address: "123 Rue de Paris"
      city: "Paris"
      postalCode: "75001"
      country: "France"
    }
    paymentMethod: "card"
  }) {
    id
    totalPrice
    status
  }
}
```

#### Annuler une commande

```graphql
mutation {
  cancelOrder(id: "507f1f77bcf86cd799439011") {
    id
    status
  }
}
```

#### Modifier son profil

```graphql
mutation {
  updateProfile(
    username: "nouveau_pseudo"
    email: "nouvel_email@example.com"
  ) {
    id
    username
    email
  }
}
```

#### Supprimer son compte

```graphql
mutation {
  deleteAccount
}
```

---

## Exemples d'utilisation avec cURL

### REST - Liste des livres

```bash
curl http://localhost:5000/api/books
```

### REST - Connexion

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jean@example.com", "password": "motdepasse123"}'
```

### REST - Créer une commande (avec token)

```bash
curl -X POST http://localhost:5000/api/orders/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "orderItems": [{"product": "...", "title": "...", "qty": 1, "price": 19.99}],
    "shippingAddress": {"address": "123 Rue", "city": "Paris", "postalCode": "75001", "country": "France"},
    "totalPrice": 19.99
  }'
```

### GraphQL - Requête

```bash
curl -X POST http://localhost:5000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"query": "{ books { id title price } }"}'
```

---

## Codes d'erreur HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Requête invalide (données manquantes/invalides) |
| 401 | Non authentifié (token manquant/invalide) |
| 403 | Accès interdit (droits insuffisants) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Modèles de données

### Book (Livre)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Le Seigneur des Anneaux",
  "author": "J.R.R. Tolkien",
  "price": 24.99,
  "category": "Fantasy",
  "description": "Une épopée fantastique...",
  "image": "https://example.com/image.jpg",
  "stock": 50,
  "rating": 4.5,
  "numReviews": 120,
  "reviews": [],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### User (Utilisateur)

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "username": "jean_dupont",
  "email": "jean@example.com",
  "role": "user",
  "createdAt": "2024-01-10T08:00:00.000Z"
}
```

### Order (Commande)

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "user": "507f1f77bcf86cd799439012",
  "orderItems": [
    {
      "product": "507f1f77bcf86cd799439011",
      "title": "Le Seigneur des Anneaux",
      "qty": 2,
      "price": 24.99,
      "image": "..."
    }
  ],
  "shippingAddress": {
    "address": "123 Rue de Paris",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France"
  },
  "paymentMethod": "card",
  "totalPrice": 49.98,
  "isPaid": true,
  "paidAt": "2024-01-15T11:00:00.000Z",
  "status": "confirmed",
  "createdAt": "2024-01-15T10:45:00.000Z"
}
```

### Payment (Paiement)

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "user": "507f1f77bcf86cd799439012",
  "order": "507f1f77bcf86cd799439013",
  "amount": 49.98,
  "paymentMethod": "card",
  "status": "completed",
  "transactionId": "TXN_123456789",
  "cardLast4": "4242",
  "refundedAmount": 0,
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

---

## Rate Limiting

L'API est protégée par un rate limiter :
- **1000 requêtes** par fenêtre de **15 minutes** par IP

Headers de réponse :
- `RateLimit-Limit`: Nombre max de requêtes
- `RateLimit-Remaining`: Requêtes restantes
- `RateLimit-Reset`: Timestamp de reset

---

## Sécurité

### Protections implémentées

1. **JWT** : Tokens signés avec expiration de 7 jours
2. **XSS** : Nettoyage des entrées utilisateur avec `xss`
3. **Rate Limiting** : Protection contre les attaques par force brute
4. **Helmet** : Headers HTTP sécurisés
5. **CORS** : Contrôle des origines autorisées
6. **Validation** : Vérification des données côté serveur

### Bonnes pratiques

- Ne jamais exposer le JWT dans les URLs
- Stocker le token de manière sécurisée (httpOnly cookie recommandé)
- Utiliser HTTPS en production
- Ne pas logger les tokens ou mots de passe

---

## Support

Pour toute question ou problème :
- Consultez la documentation Swagger : `/api-docs`
- Utilisez le GraphQL Playground : `/graphql`
