// backend/graphql/index.js
// Configuration du serveur GraphQL avec Apollo Server Express

const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');

// Fonction pour extraire l'utilisateur du token JWT
const getUser = (token) => {
    if (!token) return null;

    try {
        // Retirer "Bearer " si present
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return { id: decoded.id, role: decoded.role };
    } catch (error) {
        return null;
    }
};

// Fonction pour creer et demarrer le serveur Apollo
async function createApolloServer(app) {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            // Extraire le token du header Authorization
            const token = req.headers.authorization || '';
            const user = getUser(token);
            return { user };
        },
        // Formater les erreurs pour plus de clarte
        formatError: (error) => {
            console.error('GraphQL Error:', error.message);
            return {
                message: error.message,
                path: error.path
            };
        }
    });

    // Demarrer le serveur Apollo
    await server.start();

    // Appliquer le middleware à Express
    server.applyMiddleware({ app, path: '/graphql' });

    return server;
}

module.exports = { createApolloServer };
