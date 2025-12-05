// frontend/src/pages/BookDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function BookDetails({ addToCart }) {
  const { id } = useParams(); // On récupère l'ID dans l'URL
  const [book, setBook] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/books/${id}`)
      .then(res => setBook(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!book) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#555' }}>← Retour au catalogue</Link>
      
      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        {/* Image à gauche */}
        <img 
          src={book.image} 
          alt={book.title} 
          style={{ width: '300px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }} 
        />
        
        {/* Infos à droite */}
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{book.title}</h1>
          <h3 style={{ color: '#777', marginBottom: '20px' }}>{book.author}</h3>
          
          <span style={{ background: '#eee', padding: '5px 10px', borderRadius: '5px' }}>
            {book.category}
          </span>

          {/* C'EST ICI QU'ON AFFICHE LA DESCRIPTION */}
          <p style={{ marginTop: '30px', lineHeight: '1.6', fontSize: '1.1rem', textAlign: 'justify' }}>
            {book.description}
          </p>

          <h2 style={{ marginTop: '30px', color: '#2a9d8f' }}>{book.price} €</h2>
          
          <button 
            onClick={() => addToCart(book)}
            style={{ 
              marginTop: '20px', padding: '15px 30px', fontSize: '1.2rem', 
              background: '#007bff', color: 'white', border: 'none', 
              borderRadius: '5px', cursor: 'pointer' 
            }}
          >
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;