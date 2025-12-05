// backend/seed.js
const mongoose = require('mongoose');
const Book = require('./models/Book');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/biblio-poche')
    .then(() => console.log('MongoDB connecté pour le seed'))
    .catch(err => console.log(err));

const books = [
    // --- Catégorie : Science-Fiction ---
    {
        title: "Dune",
        author: "Frank Herbert",
        price: 24.90,
        category: "Science-Fiction",
        description: "Dans un futur lointain, Paul Atreides doit survivre sur Arrakis, une planète désertique géante, seul lieu de production de l'Épice, la substance la plus précieuse de l'univers qui permet le voyage interstellaire et prolonge la vie.",
        image: "https://m.media-amazon.com/images/I/81ym3QUd3KL._AC_UF1000,1000_QL80_.jpg",
        stock: 15
    },
    {
        title: "Fondation",
        author: "Isaac Asimov",
        price: 18.50,
        category: "Science-Fiction",
        description: "Le psychohistorien Hari Seldon prévoit la chute inévitable de l'Empire Galactique. Pour réduire la période de chaos de 30 000 à 1 000 ans, il rassemble les plus grands savants sur une planète isolée : Terminus.",
        image: "https://m.media-amazon.com/images/I/91ZYBjR+gYL._AC_UF1000,1000_QL80_.jpg",
        stock: 10
    },
    {
        title: "Neuromancien",
        author: "William Gibson",
        price: 16.00,
        category: "Science-Fiction",
        description: "Case est un hacker de console, un cowboy du cyberespace. Grillé par ses anciens employeurs, il se voit offrir une dernière chance : pirater une intelligence artificielle orbitale en échange de la restauration de son système nerveux.",
        image: "https://m.media-amazon.com/images/I/71FYTWOVVkL._AC_UF1000,1000_QL80_.jpg",
        stock: 5
    },

    // --- Catégorie : Policier ---
    {
        title: "Le Chien des Baskerville",
        author: "Arthur Conan Doyle",
        price: 12.00,
        category: "Policier",
        description: "Une malédiction pèse sur les Baskerville : un chien fantomatique gigantesque tuerait les héritiers du domaine. Sherlock Holmes envoie Watson dans le Devonshire pour protéger le dernier descendant et résoudre ce mystère gothique.",
        image: "https://m.media-amazon.com/images/I/81js4ajZ7AL.jpg",
        stock: 8
    },
    {
        title: "Ils étaient dix",
        author: "Agatha Christie",
        price: 8.90,
        category: "Policier",
        description: "Dix invités, une île déserte, un tueur invisible. Bien vite, ils sont assassinés un par un, suivant les couplets d'une inquiétante comptine enfantine affichée dans leurs chambres.",
        image: "https://m.media-amazon.com/images/I/718kfu30DGL.jpg",
        stock: 12
    },
    {
        title: "Le Silence des Agneaux",
        author: "Thomas Harris",
        price: 14.50,
        category: "Policier",
        description: "Clarice Starling, jeune stagiaire au FBI, doit interroger le Dr Hannibal Lecter, psychiatre brillant et cannibale incarcéré, pour comprendre la psychologie d'un nouveau tueur en série surnommé Buffalo Bill.",
        image: "https://m.media-amazon.com/images/I/51xoA+SVEDL._AC_UF894,1000_QL80_.jpg",
        stock: 6
    },

    // --- Catégorie : Roman ---
    {
        title: "Le Petit Prince",
        author: "Antoine de Saint-Exupéry",
        price: 9.90,
        category: "Roman",
        description: "Un aviateur tombe en panne dans le désert du Sahara et rencontre un petit garçon blond venu d'un astéroïde. Un conte poétique et philosophique sur l'enfance, l'amitié et l'absurdité du monde des grandes personnes.",
        image: "https://m.media-amazon.com/images/I/71IF1ngy57L.jpg",
        stock: 25
    },
    {
        title: "Normal People",
        author: "Sally Rooney",
        price: 24.99,
        category: "Roman",
        description: "Connell et Marianne grandissent dans la même ville d'Irlande. Le livre retrace leur relation complexe, faite de ruptures et de retrouvailles, explorant les classes sociales, l'intimité et la difficulté de communiquer.",
        image: "https://m.media-amazon.com/images/I/81X4R7QhFkL._AC_UF1000,1000_QL80_.jpg",
        stock: 8
    },
    {
        title: "L'Étranger",
        author: "Albert Camus",
        price: 7.50,
        category: "Roman",
        description: "Meursault refuse de mentir et de jouer le jeu de la société. Après avoir commis un meurtre sur une plage d'Alger, il est jugé moins pour son crime que pour son apparente insensibilité, notamment lors de l'enterrement de sa mère.",
        image: "https://m.media-amazon.com/images/I/81w-+lwQ6ML._UF1000,1000_QL80_.jpg",
        stock: 20
    },

    // --- Catégorie : Manga ---
    {
        title: "One Piece Tome 1",
        author: "Eiichiro Oda",
        price: 6.90,
        category: "Manga",
        description: "Luffy, un garçon dont le corps est élastique après avoir mangé un fruit du démon, part à l'aventure pour trouver le trésor légendaire 'One Piece' et devenir le Roi des Pirates.",
        image: "https://m.media-amazon.com/images/I/916T7GNQA9L._UF1000,1000_QL80_.jpg",
        stock: 50
    },
    {
        title: "Naruto Tome 1",
        author: "Masashi Kishimoto",
        price: 6.90,
        category: "Manga",
        description: "Naruto est un jeune ninja rejeté par les villageois car il porte en lui un démon renard. Son rêve : devenir Hokage, le chef du village, pour enfin être reconnu de tous.",
        image: "https://m.media-amazon.com/images/I/912xRMMra4L._AC_UF1000,1000_QL80_.jpg",
        stock: 30
    },
    {
        title: "Dragon Ball Tome 1",
        author: "Akira Toriyama",
        price: 6.90,
        category: "Manga",
        description: "Son Goku, un petit garçon doté d'une force extraordinaire et d'une queue de singe, rencontre Bulma. Ensemble, ils partent à la recherche des sept boules de cristal qui permettent d'exaucer n'importe quel vœu.",
        image: "https://m.media-amazon.com/images/I/81TkSJw2vqL.jpg",
        stock: 40
    },

    // --- Catégorie : Fantasy ---
    {
        title: "Harry Potter à l'école des sorciers",
        author: "J.K. Rowling",
        price: 19.90,
        category: "Fantasy",
        description: "Orphelin vivant chez son oncle et sa tante qui le détestent, Harry découvre le jour de ses 11 ans qu'il est un sorcier. Il intègre Poudlard, l'école de sorcellerie, et découvre le mystère de la mort de ses parents.",
        image: "https://m.media-amazon.com/images/I/81jVPDq3HKL._AC_UF1000,1000_QL80_.jpg",
        stock: 100
    },
    {
        title: "Le Seigneur des Anneaux : La Fraternité de l'Anneau",
        author: "J.R.R. Tolkien",
        price: 25.00,
        category: "Fantasy",
        description: "Le jeune Hobbit Frodon Sacquet hérite d'un anneau magique. Il découvre qu'il s'agit de l'Anneau Unique du Seigneur des Ténèbres Sauron. Il doit entreprendre un voyage périlleux pour le détruire.",
        image: "https://m.media-amazon.com/images/I/9105GaINAeL._UF1000,1000_QL80_.jpg",
        stock: 12
    },
    {
        title: "Le Sorceleur (The Witcher)",
        author: "Andrzej Sapkowski",
        price: 15.90,
        category: "Fantasy",
        description: "Geralt de Riv est un mutant, un tueur de monstres professionnel qui vend ses services. Dans un monde corrompu où les hommes sont souvent pires que les bêtes, il tente de suivre son propre code moral.",
        image: "https://m.media-amazon.com/images/I/81LOPccMo4L._AC_UF1000,1000_QL80_.jpg",
        stock: 18
    }
];

const seedDB = async () => {
    try {
        await Book.deleteMany({});
        await Book.insertMany(books);
        console.log("Données importées avec succès !");
    } catch (err) {
        console.log("Erreur lors de l'import : ", err);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();