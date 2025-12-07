// frontend/src/pages/Admin.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '', author: '', price: '', category: '', description: '', image: '', stock: 10
  });

  const apiConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Verifier si admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Charger les donnees selon l'onglet
  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'books') fetchBooks();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/stats', apiConfig);
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/books?limit=100', apiConfig);
      setBooks(res.data.books);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/orders?limit=100', apiConfig);
      setOrders(res.data.orders);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/payments?limit=100', apiConfig);
      setPayments(res.data.payments);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users?limit=100', apiConfig);
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  // CRUD Livres
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await axios.put(`http://localhost:5000/api/admin/books/${editingBook._id}`, bookForm, apiConfig);
      } else {
        await axios.post('http://localhost:5000/api/admin/books', bookForm, apiConfig);
      }
      setShowBookModal(false);
      setEditingBook(null);
      setBookForm({ title: '', author: '', price: '', category: '', description: '', image: '', stock: 10 });
      fetchBooks();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      price: book.price,
      category: book.category,
      description: book.description || '',
      image: book.image || '',
      stock: book.stock
    });
    setShowBookModal(true);
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Supprimer ce livre ?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/books/${id}`, apiConfig);
      fetchBooks();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  // Modifier statut commande
  const handleOrderStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/orders/${id}`, { status }, apiConfig);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/orders/${id}`, apiConfig);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  // Modifier role utilisateur
  const handleUserRole = async (id, role) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${id}/role`, { role }, apiConfig);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  // Rembourser paiement
  const handleRefundPayment = async (id) => {
    if (!window.confirm('Rembourser ce paiement ?')) return;
    try {
      await axios.put(`http://localhost:5000/api/admin/payments/${id}`, { status: 'refunded' }, apiConfig);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  if (!user || user.role !== 'admin') {
    return <div style={styles.container}>Acces refuse</div>;
  }

  return (
    <div style={styles.container}>
      <h1>Administration</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['dashboard', 'books', 'orders', 'payments', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
          >
            {tab === 'dashboard' ? 'Tableau de bord' :
             tab === 'books' ? 'Livres' :
             tab === 'orders' ? 'Commandes' :
             tab === 'payments' ? 'Paiements' : 'Utilisateurs'}
          </button>
        ))}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Dashboard */}
      {activeTab === 'dashboard' && stats && (
        <div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.summary.totalBooks}</div>
              <div style={styles.statLabel}>Livres</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.summary.totalOrders}</div>
              <div style={styles.statLabel}>Commandes</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.summary.totalUsers}</div>
              <div style={styles.statLabel}>Utilisateurs</div>
            </div>
            <div style={{ ...styles.statCard, background: '#d4edda' }}>
              <div style={styles.statValue}>{stats.summary.totalRevenue.toFixed(2)} EUR</div>
              <div style={styles.statLabel}>Revenus</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.summary.recentOrders}</div>
              <div style={styles.statLabel}>Commandes (7j)</div>
            </div>
            <div style={{ ...styles.statCard, background: stats.summary.outOfStock > 0 ? '#f8d7da' : '#fff' }}>
              <div style={styles.statValue}>{stats.summary.outOfStock}</div>
              <div style={styles.statLabel}>Rupture stock</div>
            </div>
          </div>

          <h3>Top 5 des ventes</h3>
          <ul>
            {stats.topBooks.map((b, i) => (
              <li key={i}>{b.title} - {b.totalSold} vendus</li>
            ))}
          </ul>
        </div>
      )}

      {/* Livres */}
      {activeTab === 'books' && (
        <div>
          <button onClick={() => { setEditingBook(null); setBookForm({ title: '', author: '', price: '', category: '', description: '', image: '', stock: 10 }); setShowBookModal(true); }} style={styles.addBtn}>
            + Ajouter un livre
          </button>

          {loading ? <p>Chargement...</p> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Auteur</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book._id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.price} EUR</td>
                    <td style={{ color: book.stock === 0 ? 'red' : 'inherit' }}>{book.stock}</td>
                    <td>
                      <button onClick={() => handleEditBook(book)} style={styles.editBtn}>Modifier</button>
                      <button onClick={() => handleDeleteBook(book._id)} style={styles.deleteBtn}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Commandes */}
      {activeTab === 'orders' && (
        <div>
          {loading ? <p>Chargement...</p> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td>{order._id.substring(0, 8)}...</td>
                    <td>{order.user?.username || 'N/A'}</td>
                    <td>{order.totalPrice} EUR</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleOrderStatus(order._id, e.target.value)}
                        style={styles.select}
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmee</option>
                        <option value="shipped">Expediee</option>
                        <option value="delivered">Livree</option>
                        <option value="cancelled">Annulee</option>
                      </select>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDeleteOrder(order._id)} style={styles.deleteBtn}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Paiements */}
      {activeTab === 'payments' && (
        <div>
          {loading ? <p>Chargement...</p> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{payment.transactionId}</td>
                    <td>{payment.user?.username || 'N/A'}</td>
                    <td>{payment.amount} EUR</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: payment.status === 'completed' ? '#d4edda' :
                                   payment.status === 'refunded' ? '#f8d7da' : '#fff3cd',
                        fontSize: '0.8rem'
                      }}>
                        {payment.status}
                      </span>
                    </td>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>
                      {payment.status === 'completed' && (
                        <button onClick={() => handleRefundPayment(payment._id)} style={styles.deleteBtn}>
                          Rembourser
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Utilisateurs */}
      {activeTab === 'users' && (
        <div>
          {loading ? <p>Chargement...</p> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Date inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id || u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleUserRole(u._id || u.id, e.target.value)}
                        style={styles.select}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button onClick={async () => {
                          if (!window.confirm('Supprimer cet utilisateur ?')) return;
                          try {
                            await axios.delete(`http://localhost:5000/api/admin/users/${u._id || u.id}`, apiConfig);
                            fetchUsers();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Erreur');
                          }
                        }} style={styles.deleteBtn}>Supprimer</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Livre */}
      {showBookModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>{editingBook ? 'Modifier le livre' : 'Ajouter un livre'}</h2>
            <form onSubmit={handleBookSubmit}>
              <input
                type="text"
                placeholder="Titre"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Auteur"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                style={styles.input}
                required
              />
              <input
                type="number"
                placeholder="Prix"
                value={bookForm.price}
                onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Categorie"
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="URL Image"
                value={bookForm.image}
                onChange={(e) => setBookForm({ ...bookForm, image: e.target.value })}
                style={styles.input}
              />
              <textarea
                placeholder="Description"
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                style={{ ...styles.input, height: '80px' }}
              />
              <input
                type="number"
                placeholder="Stock"
                value={bookForm.stock}
                onChange={(e) => setBookForm({ ...bookForm, stock: e.target.value })}
                style={styles.input}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" style={styles.addBtn}>
                  {editingBook ? 'Mettre a jour' : 'Ajouter'}
                </button>
                <button type="button" onClick={() => setShowBookModal(false)} style={styles.cancelBtn}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  tabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' },
  tab: { padding: '10px 20px', border: 'none', background: '#f0f0f0', cursor: 'pointer', borderRadius: '5px 5px 0 0' },
  activeTab: { background: '#007bff', color: 'white' },
  error: { color: 'red', background: '#ffe0e0', padding: '10px', borderRadius: '5px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' },
  statCard: { background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#007bff' },
  statLabel: { color: '#666', marginTop: '5px' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  addBtn: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px' },
  editBtn: { padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' },
  deleteBtn: { padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  select: { padding: '5px', borderRadius: '3px', border: '1px solid #ddd' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '10px', width: '400px', maxHeight: '90vh', overflowY: 'auto' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }
};

// Table styles
const tableStyles = document.createElement('style');
tableStyles.textContent = `
  table th, table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
  table th { background: #f8f9fa; font-weight: 600; }
  table tr:hover { background: #f8f9fa; }
`;
document.head.appendChild(tableStyles);

export default Admin;
