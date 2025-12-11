# GraphQL - Explication et Implementation

## 1. Qu'est-ce que GraphQL ?

GraphQL est un **langage de requete pour API** developpe par Facebook en 2015.
Il permet au client de demander **exactement les donnees dont il a besoin**.

---

## 2. Difference entre REST et GraphQL

### Avec REST (ce qu'on a actuellement)

```
GET /api/books          -> Retourne TOUS les champs de TOUS les livres
GET /api/books/123      -> Retourne TOUS les champs d'UN livre
GET /api/users/456      -> Requete SEPAREE pour l'utilisateur
```

**Problemes :**
- **Over-fetching** : On recoit plus de donnees que necessaire
- **Under-fetching** : On doit faire plusieurs requetes pour avoir toutes les donnees
- **Endpoints multiples** : Une URL par ressource

### Avec GraphQL

```graphql
# UNE seule requete pour avoir exactement ce qu'on veut
query {
    book(id: "123") {
        title           # Seulement le titre
        price           # et le prix
        author          # et l'auteur
    }
}
```

**Avantages :**
- **Un seul endpoint** : `/graphql`
- **Donnees precisees** : Le client choisit les champs
- **Une seule requete** : Peut combiner plusieurs ressources

---

## 3. Concepts cles de GraphQL

### 3.1 Schema

Definit la structure des donnees disponibles :

```graphql
type Book {
    id: ID!
    title: String!
    author: String!
    price: Float!
    category: String
    stock: Int
}

type User {
    id: ID!
    username: String!
    email: String!
    role: String!
}
```

### 3.2 Query (Lecture)

Pour LIRE des donnees (equivalent de GET) :

```graphql
type Query {
    books: [Book]           # Liste de tous les livres
    book(id: ID!): Book     # Un livre par ID
    users: [User]           # Liste des utilisateurs
    me: User                # Utilisateur connecte
}
```

### 3.3 Mutation (Ecriture)

Pour MODIFIER des donnees (equivalent de POST/PUT/DELETE) :

```graphql
type Mutation {
    createBook(input: BookInput!): Book
    updateBook(id: ID!, input: BookInput!): Book
    deleteBook(id: ID!): Boolean
    login(email: String!, password: String!): AuthPayload
    register(input: RegisterInput!): AuthPayload
}
```

### 3.4 Resolvers

Fonctions qui executent les requetes :

```javascript
const resolvers = {
    Query: {
        books: () => Book.find(),
        book: (_, { id }) => Book.findById(id)
    },
    Mutation: {
        createBook: (_, { input }) => Book.create(input)
    }
};
```

---

## 4. Comparaison REST vs GraphQL

| Critere | REST | GraphQL |
|---------|------|---------|
| Endpoints | Multiples (/books, /users) | Un seul (/graphql) |
| Donnees | Fixes par endpoint | Choisies par le client |
| Requetes | Plusieurs pour donnees liees | Une seule |
| Versioning | /api/v1, /api/v2 | Pas necessaire |
| Documentation | Swagger/OpenAPI | Auto-generee (introspection) |
| Cache | Facile (HTTP cache) | Plus complexe |
| Apprentissage | Simple | Plus complexe |

---

## 5. Exemples de requetes GraphQL

### Recuperer tous les livres (seulement titre et prix)

```graphql
query {
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
query {
    book(id: "abc123") {
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

### Creer un livre (Mutation)

```graphql
mutation {
    createBook(input: {
        title: "Nouveau Livre"
        author: "Auteur"
        price: 19.99
        category: "Roman"
    }) {
        id
        title
    }
}
```

### Login (Mutation)

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

---

## 6. Outils pour tester GraphQL

### GraphQL Playground / Apollo Studio

Interface web integree pour tester les requetes.
Accessible sur : `http://localhost:5000/graphql`

### Postman

1. Nouvelle requete POST
2. URL : `http://localhost:5000/graphql`
3. Body > GraphQL
4. Ecrire la requete

---

## 7. Architecture avec GraphQL

```
+-------------+                      +------------------+
|   FRONTEND  |                      |     BACKEND      |
|   (React)   |                      |    (Express)     |
+-------------+                      +------------------+
      |                                      |
      |    POST /graphql                     |
      |    {                                 |
      |      query: "{ books { title } }"    |
      |    }                                 |
      | ----------------------------------> |
      |                                      |
      |                              +-------v--------+
      |                              | GraphQL Server |
      |                              | (Apollo)       |
      |                              +-------+--------+
      |                                      |
      |                              +-------v--------+
      |                              |   Resolvers    |
      |                              +-------+--------+
      |                                      |
      |                              +-------v--------+
      |                              |   MongoDB      |
      |                              +----------------+
      |                                      |
      | <---------------------------------- |
      |    {                                 |
      |      "data": {                       |
      |        "books": [...]                |
      |      }                               |
      |    }                                 |
      |                                      |
```
