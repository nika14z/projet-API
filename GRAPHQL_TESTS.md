# Tests GraphQL avec Postman

## Demarrer le serveur

```bash
cd backend
node server.js
```

Tu devrais voir :
```
MongoDB connecte
Serveur demarre sur le port 5000
REST API: http://localhost:5000/api
GraphQL:  http://localhost:5000/graphql
Swagger:  http://localhost:5000/api-docs
```

---

## Comment tester avec Postman

### Configuration de base

1. **Methode** : POST (toujours POST pour GraphQL)
2. **URL** : `http://localhost:5000/graphql`
3. **Headers** : `Content-Type: application/json`
4. **Body** : raw > JSON

---

## TESTS SANS AUTHENTIFICATION

### Test 1 : Recuperer tous les livres

```
POST http://localhost:5000/graphql
Content-Type: application/json

{
    "query": "{ books { id title author price category stock } }"
}
```

**Ou en format plus lisible (Body > GraphQL dans Postman) :**
```graphql
{
    books {
        id
        title
        author
        price
        category
        stock
    }
}
```

---

### Test 2 : Recuperer seulement titre et prix

```json
{
    "query": "{ books { title price } }"
}
```

**Reponse attendue :**
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

---

### Test 3 : Filtrer par categorie

```json
{
    "query": "{ books(category: \"Science-Fiction\") { title author price } }"
}
```

---

### Test 4 : Recuperer un livre par ID

```json
{
    "query": "{ book(id: \"ID_DU_LIVRE\") { title author price description reviews { rating comment } } }"
}
```

Remplace `ID_DU_LIVRE` par un vrai ID MongoDB.

---

### Test 5 : Rechercher des livres

```json
{
    "query": "{ searchBooks(query: \"Dune\") { title author } }"
}
```

---

## TESTS D'AUTHENTIFICATION

### Test 6 : Inscription (register)

```json
{
    "query": "mutation { register(input: { username: \"testgraphql\", email: \"graphql@test.com\", password: \"MonMotDePasse123!\" }) { token user { id username email role } } }"
}
```

**Reponse attendue :**
```json
{
    "data": {
        "register": {
            "token": "eyJhbGciOiJIUzI1NiIs...",
            "user": {
                "id": "...",
                "username": "testgraphql",
                "email": "graphql@test.com",
                "role": "user"
            }
        }
    }
}
```

---

### Test 7 : Connexion (login)

```json
{
    "query": "mutation { login(email: \"graphql@test.com\", password: \"MonMotDePasse123!\") { token user { id username role } } }"
}
```

**GARDE LE TOKEN RECU** pour les tests suivants.

---

## TESTS AVEC AUTHENTIFICATION

Pour les requetes authentifiees, ajoute le header :
```
Authorization: Bearer <TON_TOKEN>
```

### Test 8 : Mon profil (me)

```
POST http://localhost:5000/graphql
Headers:
    Content-Type: application/json
    Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Body:
{
    "query": "{ me { id username email role } }"
}
```

---

### Test 9 : Mes commandes

```json
{
    "query": "{ myOrders { id totalPrice status orderItems { title qty price } shippingAddress { city } } }"
}
```

---

### Test 10 : Ajouter un avis sur un livre

```json
{
    "query": "mutation { addReview(bookId: \"ID_DU_LIVRE\", input: { rating: 5, comment: \"Excellent livre!\" }) { title rating numReviews reviews { rating comment } } }"
}
```

---

### Test 11 : Creer une commande

```json
{
    "query": "mutation { createOrder(input: { orderItems: [{ product: \"ID_DU_LIVRE\", title: \"Dune\", qty: 1, price: 25, image: \"url\" }], shippingAddress: { address: \"123 Rue Test\", city: \"Paris\", postalCode: \"75001\", country: \"France\" } }) { id totalPrice status } }"
}
```

---

## TESTS ADMIN (necessite un compte admin)

### Test 12 : Statistiques admin

```json
{
    "query": "{ adminStats { totalBooks totalUsers totalOrders totalRevenue outOfStock } }"
}
```

---

### Test 13 : Creer un livre (admin)

```json
{
    "query": "mutation { createBook(input: { title: \"Nouveau Livre GraphQL\", author: \"Auteur Test\", price: 29.99, category: \"Test\", description: \"Un livre cree via GraphQL\", stock: 50 }) { id title author price } }"
}
```

---

### Test 14 : Modifier un livre (admin)

```json
{
    "query": "mutation { updateBook(id: \"ID_DU_LIVRE\", input: { price: 19.99, stock: 100 }) { id title price stock } }"
}
```

---

### Test 15 : Supprimer un livre (admin)

```json
{
    "query": "mutation { deleteBook(id: \"ID_DU_LIVRE\") }"
}
```

**Reponse attendue :**
```json
{
    "data": {
        "deleteBook": true
    }
}
```

---

## COMPARAISON REST vs GraphQL

### Meme requete en REST et GraphQL

**REST (2 requetes) :**
```
GET /api/books/123          -> Livre complet
GET /api/books/123/reviews  -> Avis separement
```

**GraphQL (1 requete) :**
```graphql
{
    book(id: "123") {
        title
        price
        reviews {
            rating
            comment
            user { username }
        }
    }
}
```

---

## ERREURS COURANTES

### Erreur : "Non authentifie"
```json
{
    "errors": [{ "message": "Non authentifie. Veuillez vous connecter." }]
}
```
**Solution :** Ajoute le header `Authorization: Bearer <token>`

### Erreur : "Acces refuse. Droits administrateur requis."
```json
{
    "errors": [{ "message": "Acces refuse. Droits administrateur requis." }]
}
```
**Solution :** Utilise un token d'admin

### Erreur de syntaxe GraphQL
```json
{
    "errors": [{ "message": "Syntax Error: ..." }]
}
```
**Solution :** Verifie les guillemets et la syntaxe de ta requete

---

## STRUCTURE DES FICHIERS GRAPHQL

```
backend/
└── graphql/
    ├── index.js      # Configuration Apollo Server
    ├── schema.js     # Types, Queries, Mutations
    └── resolvers.js  # Fonctions qui executent les requetes
```

---

## RESUME

| Action | REST | GraphQL |
|--------|------|---------|
| Tous les livres | GET /api/books | `{ books { ... } }` |
| Un livre | GET /api/books/:id | `{ book(id: "...") { ... } }` |
| Login | POST /api/auth/login | `mutation { login(...) { ... } }` |
| Creer livre | POST /api/books | `mutation { createBook(...) { ... } }` |
| Modifier | PUT /api/books/:id | `mutation { updateBook(...) { ... } }` |
| Supprimer | DELETE /api/books/:id | `mutation { deleteBook(...) }` |

**Avantage GraphQL :** Tu choisis exactement les champs que tu veux recevoir !
