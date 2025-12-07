// frontend/src/pages/Cart.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import MapLocator from '../components/MapLocator';

function Cart({ cart, removeFromCart }) {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')) || null;
  const token = localStorage.getItem('token') || null;

  const totalPrice = (cart.reduce((acc, item) => acc + (item.price || 0) * (item.qty || 0), 0)).toFixed(2);

  const getRecommendations = async () => {
    try {
      const categories = cart.map(b => b.category).filter(Boolean);
      const res = await axios.post('http://localhost:5000/api/ai/recommend', { categoriesInCart: categories });
      setRecommendations(res.data || []);
    } catch (err) {
      console.error('Erreur recommandations', err);
    }
  };

  const checkoutHandler = async () => {
    if (!user || !token) {
      alert('Veuillez vous connecter pour passer commande !');
      navigate('/login');
      return;
    }

    if (!cart || cart.length === 0) {
      alert('Votre panier est vide.');
      return;
    }

    try {
      const finalShippingAddress = selectedStore ? {
        address: selectedStore.address,
        city: `Point Retrait - ${selectedStore.name}`,
        postalCode: '99999',
        country: 'France'
      } : {
        address: '123 Rue de la Tech', city: 'Paris', postalCode: '75001', country: 'France'
      };

      const orderData = {
        orderItems: cart.map(item => ({
          product: item._id || item.id,
          title: item.title,
          image: item.image,
          price: item.price,
          qty: item.qty
        })),
        shippingAddress: finalShippingAddress,
        paymentMethod: 'Carte Bancaire',
        totalPrice: parseFloat(totalPrice)
      };

      await axios.post('http://localhost:5000/api/orders/orders', orderData, { headers: { Authorization: `Bearer ${token}` } });

      alert(`Commande validée !\nLivraison à : ${finalShippingAddress.city}`);
      localStorage.removeItem('biblio-cart');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la commande : ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Votre Panier</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>Votre panier est vide.</p>
          <MapLocator onSelectStore={setSelectedStore} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {cart.map(item => (
                <li key={item._id || item.id} style={{ display: 'flex', gap: '15px', padding: '12px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                  <img src={item.image} alt={item.title} style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1 }}>
                    <Link to={`/book/${item._id || item.id}`} style={{ textDecoration: 'none', color: '#007bff', fontWeight: '600' }}>{item.title}</Link>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{item.author}</div>
                    <div style={{ marginTop: '6px', fontSize: '0.95rem' }}>{item.qty} x {item.price} €</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <button onClick={() => removeFromCart(item._id || item.id)} style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>Supprimer</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h3>Récapitulatif</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}><span>Sous-total</span><strong>{totalPrice} €</strong></div>
            <div style={{ marginBottom: '10px' }}>
              <MapLocator onSelectStore={setSelectedStore} />
            </div>

            <button onClick={checkoutHandler} style={{ width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>Passer la commande</button>

            <hr style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: '10px' }}>
              <button onClick={getRecommendations} style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Obtenir des recommandations</button>
            </div>

            {recommendations.length > 0 && (
              <div>
                <h4>Recommandations</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {recommendations.map(rec => (
                    <li key={rec._id} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                      <img src={rec.image} alt={rec.title} style={{ width: '40px', height: '60px', objectFit: 'cover' }} />
                      <div style={{ fontSize: '0.95rem' }}>{rec.title} — <strong>{rec.price}€</strong></div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default Cart;