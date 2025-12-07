// frontend/src/pages/BookDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function BookDetails({ addToCart, user }) { // <-- Ajout de user
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const fetchBook = () => {
    axios.get(`http://localhost:5000/api/books/${id}`)
      .then(res => setBook(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (!rating || !comment) {
      setError('Veuillez laisser une note et un commentaire.');
      return;
    }
    axios.post(`http://localhost:5000/api/books/${id}/reviews`, { rating, comment }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(() => {
      fetchBook(); // Re-fetch book to show new review
      setRating(0);
      setComment('');
      setError('');
    })
    .catch(err => {
      setError(err.response?.data?.message || 'Erreur lors de la soumission.');
    });
  };

  if (!book) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#555' }}>← Retour au catalogue</Link>
      
      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        <img 
          src={book.image} 
          alt={book.title} 
          style={{ width: '300px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }} 
        />
        
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{book.title}</h1>
          <h3 style={{ color: '#777', marginBottom: '20px' }}>{book.author}</h3>
          
          <span style={{ background: '#eee', padding: '5px 10px', borderRadius: '5px' }}>
            {book.category}
          </span>

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

      {/* Section Avis */}
      <div style={{ marginTop: '50px' }}>
        <h2>Avis des lecteurs</h2>
        {book.reviews.length === 0 && <p>Aucun avis pour le moment.</p>}
        
        <ul style={{ listStyle: 'none', padding: '0' }}>
          {book.reviews.map(review => (
            <li key={review._id} style={{ borderBottom: '1px solid #eee', padding: '20px 0' }}>
              <strong>{review.name}</strong>
              <div>{'⭐'.repeat(review.rating)}</div>
              <p>{review.comment}</p>
            </li>
          ))}
        </ul>

        {/* Formulaire pour laisser un avis */}
        {user ? (
          <div style={{ marginTop: '40px' }}>
            <h3>Laissez votre avis</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={submitHandler}>
              <div style={{ marginBottom: '15px' }}>
                <label>Note</label>
                <select value={rating} onChange={e => setRating(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                  <option value="">Donnez une note...</option>
                  <option value="1">1 - Mauvais</option>
                  <option value="2">2 - Passable</option>
                  <option value="3">3 - Bon</option>
                  <option value="4">4 - Très bon</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Commentaire</label>
                <textarea 
                  rows="4" 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none' }}>
                Soumettre
              </button>
            </form>
          </div>
        ) : (
          <p style={{ marginTop: '20px' }}>
            <Link to="/login">Connectez-vous</Link> pour laisser un avis.
          </p>
        )}
      </div>
    </div>
  );
}

export default BookDetails;