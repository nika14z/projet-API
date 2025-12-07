// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Import des pages
import Home from './pages/Home';
import Cart from './pages/Cart';
import BookDetails from './pages/BookDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import MyOrders from './pages/MyOrders'; // Import de la page commandes

import './App.css';

function App() {
  // --- 1. GESTION DU PANIER (State + LocalStorage) ---
  // On charge le panier depuis la mémoire du navigateur au démarrage
  const savedCart = JSON.parse(localStorage.getItem('biblio-cart')) || [];
  const [cart, setCart] = useState(savedCart);
  
  // --- 2. GESTION UTILISATEUR ---
  const [user, setUser] = useState(null);

  // --- 3. EFFETS (Sauvegarde et Chargement) ---
  useEffect(() => {
    // À chaque modif du panier, on sauvegarde
    localStorage.setItem('biblio-cart', JSON.stringify(cart));
    
    // On vérifie si un utilisateur est connecté (token présent)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [cart]); // Se déclenche quand 'cart' change ou au démarrage

  // --- 4. FONCTIONS DU PANIER ---
  const addToCart = (book) => {
    const exist = cart.find((x) => x._id === book._id);
    if (exist) {
      // Si le livre est déjà là, on augmente la quantité (+1)
      setCart(cart.map((x) => x._id === book._id ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      // Sinon on l'ajoute
      setCart([...cart, { ...book, qty: 1 }]);
    }
  };

  const removeFromCart = (bookId) => {
    setCart(cart.filter((x) => x._id !== bookId));
  };

  // Calcul du nombre total d'articles pour le badge rouge du panier
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  // --- 5. FONCTION DE DÉCONNEXION ---
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = "/"; // Redirection vers l'accueil
  };

  // --- 6. AFFICHAGE ---
  return (
    <Router>
      <div className="App">
        {/* BARRE DE NAVIGATION */}
        <nav style={{ padding: '20px', background: '#333', color: 'white', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
             {/* Logo / Lien Accueil */}
             <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>📚 Biblio Poche</Link>
             
             {/* MENU UTILISATEUR (Conditionnel) */}
             {user ? (
               <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                 <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Bonjour, {user.username}</span>
                 
                 {/* Lien vers l'historique des commandes */}
                 <Link to="/myorders" style={{ color: 'white', textDecoration: 'underline', fontSize: '0.9rem' }}>Mes commandes</Link>
                 
                 {/* Bouton Déconnexion */}
                 <button onClick={logout} style={{background:'none', border:'none', color:'#ff6b6b', cursor:'pointer', fontSize: '0.9rem', textDecoration: 'underline'}}>Déconnexion</button>
               </div>
             ) : (
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                 <Link to="/login" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Se connecter</Link>
                 <Link to="/register" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>S'inscrire</Link>
               </div>
             )}
          </div>

          {/* Lien Panier avec compteur */}
          <Link to="/cart" style={{ color: 'white', textDecoration: 'none', background: '#007bff', padding: '10px 20px', borderRadius: '20px' }}>
            🛒 <span style={{ fontWeight: 'bold' }}>{totalItems}</span>
          </Link>
        </nav>

        {/* DÉFINITION DES ROUTES (PAGES) */}
        <Routes>
          <Route path="/" element={<Home addToCart={addToCart} />} />
          <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} />} />
          <Route path="/book/:id" element={<BookDetails addToCart={addToCart} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/myorders" element={<MyOrders />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;