// backend/graphql/resolvers.js
// Resolvers GraphQL - fonctions qui executent les requetes

const Book = require('../models/Book');
const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const xss = require('xss');

// ==================== HELPERS ====================

// Fonction pour verifier l'authentification
const checkAuth = (context) => {
    if (!context.user) {
        throw new Error('Non authentifie. Veuillez vous connecter.');
    }
    return context.user;
};

// Fonction pour verifier si admin
const checkAdmin = (context) => {
    const user = checkAuth(context);
    if (user.role !== 'admin') {
        throw new Error('Acces refuse. Droits administrateur requis.');
    }
    return user;
};

// ==================== RESOLVERS ====================

const resolvers = {
    // ==================== QUERIES ====================
    Query: {
        // ----- BOOKS -----

        // Recuperer tous les livres
        books: async (_, { category }) => {
            try {
                let filter = {};
                if (category && category !== 'Tous') {
                    filter.category = category;
                }
                return await Book.find(filter);
            } catch (error) {
                throw new Error('Erreur lors de la recuperation des livres: ' + error.message);
            }
        },

        // Recuperer un livre par ID
        book: async (_, { id }) => {
            try {
                const book = await Book.findById(id).populate('reviews.user', 'username');
                if (!book) {
                    throw new Error('Livre non trouve');
                }
                return book;
            } catch (error) {
                throw new Error('Erreur: ' + error.message);
            }
        },

        // Rechercher des livres
        searchBooks: async (_, { query }) => {
            try {
                return await Book.find({
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { author: { $regex: query, $options: 'i' } }
                    ]
                });
            } catch (error) {
                throw new Error('Erreur de recherche: ' + error.message);
            }
        },

        // ----- USERS -----

        // Utilisateur connecte
        me: async (_, __, context) => {
            const user = checkAuth(context);
            return await User.findById(user.id);
        },

        // Tous les utilisateurs (admin)
        users: async (_, __, context) => {
            checkAdmin(context);
            return await User.find().select('-password');
        },

        // ----- ORDERS -----

        // Mes commandes
        myOrders: async (_, __, context) => {
            const user = checkAuth(context);
            return await Order.find({ user: user.id }).sort({ createdAt: -1 });
        },

        // Une commande par ID
        order: async (_, { id }, context) => {
            const user = checkAuth(context);
            const order = await Order.findById(id);

            if (!order) {
                throw new Error('Commande non trouvee');
            }

            // Verifier que c'est la commande de l'utilisateur ou admin
            if (order.user.toString() !== user.id && user.role !== 'admin') {
                throw new Error('Acces refuse');
            }

            return order;
        },

        // Toutes les commandes (admin)
        allOrders: async (_, __, context) => {
            checkAdmin(context);
            return await Order.find().populate('user', 'username email').sort({ createdAt: -1 });
        },

        // ----- PAYMENTS -----

        // Mes paiements
        myPayments: async (_, __, context) => {
            const user = checkAuth(context);
            return await Payment.find({ user: user.id }).populate('order').sort({ createdAt: -1 });
        },

        // ----- ADMIN -----

        // Statistiques
        adminStats: async (_, __, context) => {
            checkAdmin(context);

            const [totalBooks, totalUsers, totalOrders, payments, outOfStock, recentOrders] = await Promise.all([
                Book.countDocuments(),
                User.countDocuments(),
                Order.countDocuments(),
                Payment.find({ status: 'completed' }),
                Book.countDocuments({ stock: 0 }),
                Order.countDocuments({
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                })
            ]);

            const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

            return {
                totalBooks,
                totalUsers,
                totalOrders,
                totalRevenue,
                recentOrders,
                outOfStock
            };
        }
    },

    // ==================== MUTATIONS ====================
    Mutation: {
        // ----- AUTH -----

        // Inscription
        register: async (_, { input }) => {
            const { username, email, password } = input;

            // Verification des champs
            if (!username || !email || !password) {
                throw new Error('Tous les champs sont requis');
            }

            // Verifier si l'email existe deja
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error('Cet email est deja utilise');
            }

            // Creer l'utilisateur
            const user = new User({ username, email, password });
            await user.save();

            // Generer le token
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '7d' }
            );

            return { token, user };
        },

        // Connexion
        login: async (_, { email, password }) => {
            // Verifier les champs
            if (!email || !password) {
                throw new Error('Email et mot de passe requis');
            }

            // Trouver l'utilisateur
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('Identifiants invalides');
            }

            // Verifier le mot de passe
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new Error('Identifiants invalides');
            }

            // Generer le token
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '7d' }
            );

            return { token, user };
        },

        // ----- BOOKS -----

        // Creer un livre (admin)
        createBook: async (_, { input }, context) => {
            checkAdmin(context);

            // Nettoyer les entrees (protection XSS)
            const cleanInput = {
                title: xss(input.title),
                author: xss(input.author),
                price: input.price,
                category: xss(input.category),
                description: input.description ? xss(input.description) : '',
                image: input.image ? xss(input.image) : '',
                stock: input.stock || 10
            };

            const book = new Book(cleanInput);
            return await book.save();
        },

        // Modifier un livre (admin)
        updateBook: async (_, { id, input }, context) => {
            checkAdmin(context);

            // Nettoyer les entrees
            const cleanInput = {};
            if (input.title) cleanInput.title = xss(input.title);
            if (input.author) cleanInput.author = xss(input.author);
            if (input.price !== undefined) cleanInput.price = input.price;
            if (input.category) cleanInput.category = xss(input.category);
            if (input.description) cleanInput.description = xss(input.description);
            if (input.image) cleanInput.image = xss(input.image);
            if (input.stock !== undefined) cleanInput.stock = input.stock;

            const book = await Book.findByIdAndUpdate(id, cleanInput, { new: true });
            if (!book) {
                throw new Error('Livre non trouve');
            }
            return book;
        },

        // Supprimer un livre (admin)
        deleteBook: async (_, { id }, context) => {
            checkAdmin(context);

            const book = await Book.findByIdAndDelete(id);
            if (!book) {
                throw new Error('Livre non trouve');
            }
            return true;
        },

        // Ajouter un avis
        addReview: async (_, { bookId, input }, context) => {
            const user = checkAuth(context);

            const book = await Book.findById(bookId);
            if (!book) {
                throw new Error('Livre non trouve');
            }

            // Verifier si l'utilisateur a deja commente
            const alreadyReviewed = book.reviews.find(
                r => r.user.toString() === user.id
            );
            if (alreadyReviewed) {
                throw new Error('Vous avez deja commente ce livre');
            }

            const userData = await User.findById(user.id);

            const review = {
                user: user.id,
                name: userData.username,
                rating: input.rating,
                comment: xss(input.comment)
            };

            book.reviews.push(review);
            book.numReviews = book.reviews.length;
            book.rating = book.reviews.reduce((acc, r) => r.rating + acc, 0) / book.reviews.length;

            await book.save();
            return await Book.findById(bookId).populate('reviews.user', 'username');
        },

        // ----- ORDERS -----

        // Creer une commande
        createOrder: async (_, { input }, context) => {
            const user = checkAuth(context);

            const { orderItems, shippingAddress, paymentMethod } = input;

            if (!orderItems || orderItems.length === 0) {
                throw new Error('Pas d\'articles dans la commande');
            }

            // Verifier les stocks
            for (const item of orderItems) {
                const book = await Book.findById(item.product);
                if (!book) {
                    throw new Error(`Livre non trouve: ${item.product}`);
                }
                if (book.stock < item.qty) {
                    throw new Error(`Stock insuffisant pour: ${book.title}`);
                }
            }

            // Calculer le total
            const totalPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);

            // Creer la commande
            const order = new Order({
                user: user.id,
                orderItems,
                shippingAddress,
                paymentMethod: paymentMethod || 'card',
                totalPrice,
                status: 'pending'
            });

            await order.save();

            // Mettre a jour les stocks
            for (const item of orderItems) {
                await Book.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.qty }
                });
            }

            return order;
        },

        // Annuler une commande
        cancelOrder: async (_, { id }, context) => {
            const user = checkAuth(context);

            const order = await Order.findById(id);
            if (!order) {
                throw new Error('Commande non trouvee');
            }

            if (order.user.toString() !== user.id && user.role !== 'admin') {
                throw new Error('Acces refuse');
            }

            if (['shipped', 'delivered'].includes(order.status)) {
                throw new Error('Impossible d\'annuler une commande expediee ou livree');
            }

            // Remettre les articles en stock
            for (const item of order.orderItems) {
                await Book.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.qty }
                });
            }

            order.status = 'cancelled';
            await order.save();

            return order;
        },

        // Modifier l'adresse
        updateOrderAddress: async (_, { id, shippingAddress }, context) => {
            const user = checkAuth(context);

            const order = await Order.findById(id);
            if (!order) {
                throw new Error('Commande non trouvee');
            }

            if (order.user.toString() !== user.id) {
                throw new Error('Acces refuse');
            }

            if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
                throw new Error('Impossible de modifier cette commande');
            }

            order.shippingAddress = shippingAddress;
            await order.save();

            return order;
        },

        // ----- USER -----

        // Modifier profil
        updateProfile: async (_, { username, email, password }, context) => {
            const user = checkAuth(context);

            const updateData = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }

            const updatedUser = await User.findByIdAndUpdate(user.id, updateData, { new: true });
            return updatedUser;
        },

        // Supprimer compte
        deleteAccount: async (_, __, context) => {
            const user = checkAuth(context);
            await User.findByIdAndDelete(user.id);
            return true;
        }
    },

    // ==================== TYPE RESOLVERS ====================
    // (pour resoudre les relations entre types)

    Book: {
        id: (book) => book._id.toString(),
        reviews: (book) => book.reviews || []
    },

    User: {
        id: (user) => user._id.toString()
    },

    Order: {
        id: (order) => order._id.toString(),
        user: async (order) => {
            if (typeof order.user === 'object') return order.user;
            return await User.findById(order.user);
        }
    },

    Payment: {
        id: (payment) => payment._id.toString(),
        user: async (payment) => {
            if (typeof payment.user === 'object') return payment.user;
            return await User.findById(payment.user);
        },
        order: async (payment) => {
            if (typeof payment.order === 'object') return payment.order;
            return await Order.findById(payment.order);
        }
    },

    Review: {
        id: (review) => review._id.toString(),
        user: async (review) => {
            if (typeof review.user === 'object') return review.user;
            return await User.findById(review.user);
        }
    }
};

module.exports = resolvers;
