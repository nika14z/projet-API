// frontend/src/pages/MyOrders.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editAddress, setEditAddress] = useState({ address: '', city: '', postalCode: '', country: '' });
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user ? user._id : null;

  const fetchOrders = () => {
    const token = localStorage.getItem('token');
    if (user && token) {
      axios.get('http://localhost:5000/api/orders/myorders', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setOrders(res.data))
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Commande annulée avec succès');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  const handleEditClick = (order) => {
    setEditingOrder(order._id);
    setEditAddress(order.shippingAddress);
  };

  const handleEditCancel = () => {
    setEditingOrder(null);
    setEditAddress({ address: '', city: '', postalCode: '', country: '' });
  };

  const handleEditSave = async (orderId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}`, { shippingAddress: editAddress }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Adresse mise à jour avec succès');
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: 'En attente', bg: '#fff3cd', color: '#856404' },
      confirmed: { text: 'Confirmée', bg: '#d4edda', color: '#155724' },
      shipped: { text: 'Expédiée', bg: '#cce5ff', color: '#004085' },
      delivered: { text: 'Livrée', bg: '#d4edda', color: '#155724' },
      cancelled: { text: 'Annulée', bg: '#f8d7da', color: '#721c24' }
    };
    return labels[status] || labels.confirmed;
  };

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
          {orders.map(order => {
            const status = getStatusLabel(order.status);
            const canModify = order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled';

            return (
            <div key={order._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>

              {/* En-tête de la commande */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                   <span style={{ fontWeight: 'bold', color: '#555' }}>Commande #{order._id.substring(0, 10)}...</span><br/>
                   <small style={{ color: '#999' }}>Passée le {new Date(order.createdAt).toLocaleDateString()}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{order.totalPrice} €</span><br/>
                   <span style={{ background: status.bg, color: status.color, padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{status.text}</span>
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

              {/* Adresse de livraison */}
              {editingOrder === order._id ? (
                <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Modifier l'adresse</h4>
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={editAddress.address}
                    onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder="Ville"
                    value={editAddress.city}
                    onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder="Code postal"
                    value={editAddress.postalCode}
                    onChange={(e) => setEditAddress({ ...editAddress, postalCode: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder="Pays"
                    value={editAddress.country}
                    onChange={(e) => setEditAddress({ ...editAddress, country: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleEditSave(order._id)} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Sauvegarder
                    </button>
                    <button onClick={handleEditCancel} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                  📍 Livré à : {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                </div>
              )}

              {/* Boutons d'action */}
              {canModify && editingOrder !== order._id && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleEditClick(order)}
                    style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Modifier l'adresse
                  </button>
                  <button
                    onClick={() => handleCancel(order._id)}
                    style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Annuler la commande
                  </button>
                </div>
              )}

            </div>
          );})}
        </div>
      )}
    </div>
  );
}

export default MyOrders;