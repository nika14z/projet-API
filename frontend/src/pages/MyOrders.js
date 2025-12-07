// frontend/src/pages/MyOrders.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user ? user._id : null;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      // On récupère les commandes de l'utilisateur en envoyant le token
      axios.get('http://localhost:5000/api/orders/myorders', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setOrders(res.data))
        .catch(err => console.error(err));
    }
  }, [userId]);

  if (!user) {
    return <div style={{padding:'20px'}}>Veuillez vous connecter pour voir vos commandes.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📜 Mes Commandes</h1>

      {orders.length === 0 ? (
        <p>Vous n'avez pas encore passé de commande.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => (
            <div key={order._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              
              {/* En-tête de la commande */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                   <span style={{ fontWeight: 'bold', color: '#555' }}>Commande #{order._id.substring(0, 10)}...</span><br/>
                   <small style={{ color: '#999' }}>Passée le {new Date(order.createdAt).toLocaleDateString()}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{order.totalPrice} €</span><br/>
                   <span style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Payé ✅</span>
                </div>
              </div>

              {/* Liste des articles */}
              <div>
                {order.orderItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                     <img src={item.image} alt={item.title} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                     <div>
                        <Link to={`/book/${item.product}`} style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
                          {item.title}
                        </Link>
                        <div style={{ fontSize: '0.9rem', color: '#555' }}>
                          {item.qty} x {item.price} €
                        </div>
                     </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                📍 Livré à : {order.shippingAddress.address}, {order.shippingAddress.city}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;