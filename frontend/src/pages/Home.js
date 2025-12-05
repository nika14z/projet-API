// frontend/src/pages/Home.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
// 1. IMPORT IMPORTANT ICI :
import { Link } from 'react-router-dom'; 

function Home({ addToCart }) {
  const [books, setBooks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  // Liste des catégories
  const categories = ['Tous', 'Science-Fiction', 'Policier', 'Roman', 'Manga', 'Fantasy'];

  const fetchBooks = (category) => {
    const url = category === 'Tous' 
      ? 'http://localhost:5000/api/books' 
      : `http://localhost:5000/api/books?category=${category}`;

    axios.get(url)
      .then(res => {
        setBooks(res.data);
        setSelectedCategory(category);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchBooks('Tous');
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Catalogue Biblio Poche</h1>

      {/* Barre de navigation des catégories */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => fetchBooks(cat)}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              backgroundColor: selectedCategory === cat ? '#333' : '#f0f0f0',
              color: selectedCategory === cat ? 'white' : 'black',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Liste des livres */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {books.length > 0 ? (
          books.map(book => (
            <div key={book._id} style={{ border: '1px solid #ddd', padding: '15px', width: '200px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              
              {book.image && <img src={book.image} alt={book.title} style={{ width: '100%', height: '300px', objectFit: 'cover', marginBottom: '10px' }} />}
              
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0' }}>{book.title}</h3>
              
              {/* --- 2. C'EST ICI QU'ON A RAJOUTÉ LE LIEN --- */}
              <Link to={`/book/${book._id}`} style={{ display: 'block', marginBottom: '10px', color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
                Voir le résumé & détails
              </Link>
              {/* ------------------------------------------- */}

              <p style={{ color: '#555', fontSize: '0.9rem' }}>{book.author}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{book.price} €</span>
                <span style={{ fontSize: '0.8rem', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>{book.category}</span>
              </div>
              
              <button 
                onClick={() => addToCart(book)}
                style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Ajouter au panier
              </button>
            </div>
          ))
        ) : (
          <p>Aucun livre trouvé dans cette catégorie.</p>
        )}
      </div>
    </div>
  );
}

export default Home;