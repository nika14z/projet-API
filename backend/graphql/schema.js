// backend/graphql/schema.js
// Definition du schema GraphQL (types, queries, mutations)

const typeDefs = `#graphql

    # ==================== TYPES ====================

    # Type Book (Livre)
    type Book {
        id: ID!
        title: String!
        author: String!
        price: Float!
        category: String!
        description: String
        image: String
        stock: Int!
        rating: Float
        numReviews: Int
        reviews: [Review]
        createdAt: String
    }

    # Type Review (Avis)
    type Review {
        id: ID!
        user: User
        name: String
        rating: Int!
        comment: String!
        createdAt: String
    }

    # Type User (Utilisateur)
    type User {
        id: ID!
        username: String!
        email: String!
        role: String!
        createdAt: String
    }

    # Type Order (Commande)
    type Order {
        id: ID!
        user: User
        orderItems: [OrderItem]
        shippingAddress: ShippingAddress
        paymentMethod: String
        totalPrice: Float!
        isPaid: Boolean
        paidAt: String
        status: String!
        createdAt: String
    }

    # Type OrderItem (Article de commande)
    type OrderItem {
        product: ID
        title: String
        qty: Int
        image: String
        price: Float
    }

    # Type ShippingAddress (Adresse de livraison)
    type ShippingAddress {
        address: String
        city: String
        postalCode: String
        country: String
    }

    # Type Payment (Paiement)
    type Payment {
        id: ID!
        user: User
        order: Order
        amount: Float!
        paymentMethod: String
        status: String!
        transactionId: String
        cardLast4: String
        createdAt: String
    }

    # Type AuthPayload (Reponse d'authentification)
    type AuthPayload {
        token: String!
        user: User!
    }

    # Type pour les statistiques admin
    type AdminStats {
        totalBooks: Int
        totalUsers: Int
        totalOrders: Int
        totalRevenue: Float
        recentOrders: Int
        outOfStock: Int
    }

    # ==================== INPUTS ====================
    # (pour les mutations - donnees en entree)

    input BookInput {
        title: String!
        author: String!
        price: Float!
        category: String!
        description: String
        image: String
        stock: Int
    }

    input BookUpdateInput {
        title: String
        author: String
        price: Float
        category: String
        description: String
        image: String
        stock: Int
    }

    input RegisterInput {
        username: String!
        email: String!
        password: String!
    }

    input ReviewInput {
        rating: Int!
        comment: String!
    }

    input OrderItemInput {
        product: ID!
        title: String!
        qty: Int!
        image: String
        price: Float!
    }

    input ShippingAddressInput {
        address: String!
        city: String!
        postalCode: String!
        country: String!
    }

    input OrderInput {
        orderItems: [OrderItemInput!]!
        shippingAddress: ShippingAddressInput!
        paymentMethod: String
    }

    # ==================== QUERIES ====================
    # (pour lire des donnees - equivalent de GET)

    type Query {
        # ----- BOOKS -----
        # Recuperer tous les livres (avec filtre optionnel par categorie)
        books(category: String): [Book]

        # Recuperer un livre par son ID
        book(id: ID!): Book

        # Rechercher des livres par titre ou auteur
        searchBooks(query: String!): [Book]

        # ----- USERS -----
        # Recuperer l'utilisateur connecte (necessite authentification)
        me: User

        # Recuperer tous les utilisateurs (admin seulement)
        users: [User]

        # ----- ORDERS -----
        # Recuperer mes commandes (utilisateur connecte)
        myOrders: [Order]

        # Recuperer une commande par ID
        order(id: ID!): Order

        # Toutes les commandes (admin seulement)
        allOrders: [Order]

        # ----- PAYMENTS -----
        # Mes paiements
        myPayments: [Payment]

        # ----- ADMIN -----
        # Statistiques (admin seulement)
        adminStats: AdminStats
    }

    # ==================== MUTATIONS ====================
    # (pour modifier des donnees - equivalent de POST/PUT/DELETE)

    type Mutation {
        # ----- AUTH -----
        # Inscription
        register(input: RegisterInput!): AuthPayload

        # Connexion
        login(email: String!, password: String!): AuthPayload

        # ----- BOOKS -----
        # Creer un livre (admin)
        createBook(input: BookInput!): Book

        # Modifier un livre (admin)
        updateBook(id: ID!, input: BookUpdateInput!): Book

        # Supprimer un livre (admin)
        deleteBook(id: ID!): Boolean

        # Ajouter un avis sur un livre (utilisateur connecte)
        addReview(bookId: ID!, input: ReviewInput!): Book

        # ----- ORDERS -----
        # Creer une commande
        createOrder(input: OrderInput!): Order

        # Annuler une commande
        cancelOrder(id: ID!): Order

        # Modifier l'adresse de livraison
        updateOrderAddress(id: ID!, shippingAddress: ShippingAddressInput!): Order

        # ----- USER -----
        # Modifier son profil
        updateProfile(username: String, email: String, password: String): User

        # Supprimer son compte
        deleteAccount: Boolean
    }
`;

module.exports = typeDefs;
