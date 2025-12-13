// backend/graphql/resolvers.js
// Resolvers GraphQL - fonctions qui executent les requetes

const Book = require('../models/Book');
const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');
const { sanitize } = require('../utils/sanitize');
const {
    generateToken,
    ERRORS,
    isOwnerOrAdmin,
    checkStockAvailability,
    decrementStock,
    incrementStock,
    canCancelOrder,
    canModifyOrder
} = require('../utils/helpers');

// ==================== HELPERS ====================

const checkAuth = (context) => {
    if (!context.user) {
        throw new Error(ERRORS.NOT_AUTHENTICATED);
    }
    return context.user;
};

const checkAdmin = (context) => {
    const user = checkAuth(context);
    if (user.role !== 'admin') {
        throw new Error(ERRORS.ADMIN_REQUIRED);
    }
    return user;
};

// ==================== RESOLVERS ====================

const resolvers = {
    // ==================== QUERIES ====================
    Query: {
        // ----- BOOKS -----
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

        book: async (_, { id }) => {
            try {
                const book = await Book.findById(id).populate('reviews.user', 'username');
                if (!book) {
                    throw new Error(ERRORS.BOOK_NOT_FOUND);
                }
                return book;
            } catch (error) {
                throw new Error('Erreur: ' + error.message);
            }
        },

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
        me: async (_, __, context) => {
            const user = checkAuth(context);
            return await User.findById(user.id);
        },

        users: async (_, __, context) => {
            checkAdmin(context);
            return await User.find().select('-password');
        },

        // ----- ORDERS -----
        myOrders: async (_, __, context) => {
            const user = checkAuth(context);
            return await Order.find({ user: user.id }).sort({ createdAt: -1 });
        },

        order: async (_, { id }, context) => {
            const user = checkAuth(context);
            const order = await Order.findById(id);

            if (!order) {
                throw new Error(ERRORS.ORDER_NOT_FOUND);
            }

            if (!isOwnerOrAdmin(order.user, user.id, user.role)) {
                throw new Error(ERRORS.ACCESS_DENIED);
            }

            return order;
        },

        allOrders: async (_, __, context) => {
            checkAdmin(context);
            return await Order.find().populate('user', 'username email').sort({ createdAt: -1 });
        },

        // ----- PAYMENTS -----
        myPayments: async (_, __, context) => {
            const user = checkAuth(context);
            return await Payment.find({ user: user.id }).populate('order').sort({ createdAt: -1 });
        },

        // ----- ADMIN -----
        adminStats: async (_, __, context) => {
            checkAdmin(context);

            const [totalBooks, totalUsers, totalOrders, outOfStock, recentOrders] = await Promise.all([
                Book.countDocuments(),
                User.countDocuments(),
                Order.countDocuments(),
                Book.countDocuments({ stock: 0 }),
                Order.countDocuments({
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                })
            ]);

            let totalRevenue = 0;
            if (totalOrders > 0) {
                const payments = await Payment.find({ status: 'completed' });
                totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
            }

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
        register: async (_, { input }) => {
            const { username, email, password } = input;

            if (!username || !email || !password) {
                throw new Error(ERRORS.MISSING_FIELDS);
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error(ERRORS.EMAIL_EXISTS);
            }

            const user = new User({ username, email, password });
            await user.save();

            const token = generateToken(user);
            return { token, user };
        },

        login: async (_, { email, password }) => {
            if (!email || !password) {
                throw new Error(ERRORS.MISSING_FIELDS);
            }

            const user = await User.findOne({ email });
            if (!user) {
                throw new Error(ERRORS.INVALID_CREDENTIALS);
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new Error(ERRORS.INVALID_CREDENTIALS);
            }

            const token = generateToken(user);
            return { token, user };
        },

        // ----- BOOKS -----
        createBook: async (_, { input }, context) => {
            checkAdmin(context);

            const cleanInput = {
                title: sanitize(input.title),
                author: sanitize(input.author),
                price: input.price,
                category: sanitize(input.category),
                description: input.description ? sanitize(input.description) : '',
                image: input.image ? sanitize(input.image) : '',
                stock: input.stock || 10
            };

            const book = new Book(cleanInput);
            return await book.save();
        },

        updateBook: async (_, { id, input }, context) => {
            checkAdmin(context);

            const cleanInput = {};
            if (input.title) cleanInput.title = sanitize(input.title);
            if (input.author) cleanInput.author = sanitize(input.author);
            if (input.price !== undefined) cleanInput.price = input.price;
            if (input.category) cleanInput.category = sanitize(input.category);
            if (input.description) cleanInput.description = sanitize(input.description);
            if (input.image) cleanInput.image = sanitize(input.image);
            if (input.stock !== undefined) cleanInput.stock = input.stock;

            const book = await Book.findByIdAndUpdate(id, cleanInput, { new: true });
            if (!book) {
                throw new Error(ERRORS.BOOK_NOT_FOUND);
            }
            return book;
        },

        deleteBook: async (_, { id }, context) => {
            checkAdmin(context);

            const book = await Book.findByIdAndDelete(id);
            if (!book) {
                throw new Error(ERRORS.BOOK_NOT_FOUND);
            }
            return true;
        },

        addReview: async (_, { bookId, input }, context) => {
            const user = checkAuth(context);

            const book = await Book.findById(bookId);
            if (!book) {
                throw new Error(ERRORS.BOOK_NOT_FOUND);
            }

            const alreadyReviewed = book.reviews.find(
                r => r.user.toString() === user.id
            );
            if (alreadyReviewed) {
                throw new Error('Vous avez deja commente ce livre');
            }

            const userData = await User.findById(user.id);

            const review = {
                user: user.id,
                name: sanitize(userData.username),
                rating: input.rating,
                comment: sanitize(input.comment)
            };

            book.reviews.push(review);
            book.numReviews = book.reviews.length;
            book.rating = book.reviews.reduce((acc, r) => r.rating + acc, 0) / book.reviews.length;

            await book.save();
            return await Book.findById(bookId).populate('reviews.user', 'username');
        },

        // ----- ORDERS -----
        createOrder: async (_, { input }, context) => {
            const user = checkAuth(context);

            const { orderItems, shippingAddress, paymentMethod } = input;

            if (!orderItems || orderItems.length === 0) {
                throw new Error('Pas d\'articles dans la commande');
            }

            const stockCheck = await checkStockAvailability(orderItems);
            if (!stockCheck.success) {
                throw new Error(stockCheck.error);
            }

            const totalPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);

            const order = new Order({
                user: user.id,
                orderItems,
                shippingAddress,
                paymentMethod: paymentMethod || 'card',
                totalPrice,
                status: 'pending'
            });

            await order.save();
            await decrementStock(orderItems);

            return order;
        },

        cancelOrder: async (_, { id }, context) => {
            const user = checkAuth(context);

            const order = await Order.findById(id);
            if (!order) {
                throw new Error(ERRORS.ORDER_NOT_FOUND);
            }

            if (!isOwnerOrAdmin(order.user, user.id, user.role)) {
                throw new Error(ERRORS.ACCESS_DENIED);
            }

            if (!canCancelOrder(order.status)) {
                throw new Error(ERRORS.ORDER_CANNOT_CANCEL);
            }

            await incrementStock(order.orderItems);

            order.status = 'cancelled';
            await order.save();

            return order;
        },

        updateOrderAddress: async (_, { id, shippingAddress }, context) => {
            const user = checkAuth(context);

            const order = await Order.findById(id);
            if (!order) {
                throw new Error(ERRORS.ORDER_NOT_FOUND);
            }

            if (!isOwnerOrAdmin(order.user, user.id, null)) {
                throw new Error(ERRORS.ACCESS_DENIED);
            }

            if (!canModifyOrder(order.status)) {
                throw new Error(ERRORS.ORDER_CANNOT_MODIFY);
            }

            order.shippingAddress = shippingAddress;
            await order.save();

            return order;
        },

        // ----- USER -----
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

        deleteAccount: async (_, __, context) => {
            const user = checkAuth(context);
            await User.findByIdAndDelete(user.id);
            return true;
        }
    },

    // ==================== TYPE RESOLVERS ====================
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
