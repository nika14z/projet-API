// frontend/src/pages/Payments.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        axios.get('http://localhost:5000/api/payments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/payments/stats/summary', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPayments(paymentsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefund = async (paymentId) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('Voulez-vous vraiment demander un remboursement ?')) return;

    try {
      await axios.post(`http://localhost:5000/api/payments/${paymentId}/refund`,
        { reason: refundReason || 'Remboursement demande par le client' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Remboursement effectue avec succes');
      setRefundingId(null);
      setRefundReason('');
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du remboursement');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { bg: '#fff3cd', color: '#856404', text: 'En attente' },
      completed: { bg: '#d4edda', color: '#155724', text: 'Complete' },
      failed: { bg: '#f8d7da', color: '#721c24', text: 'Echoue' },
      refunded: { bg: '#e2e3e5', color: '#383d41', text: 'Rembourse' },
      partially_refunded: { bg: '#fff3cd', color: '#856404', text: 'Partiellement rembourse' }
    };
    return styles[status] || styles.pending;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      card: 'Carte bancaire',
      paypal: 'PayPal',
      bank_transfer: 'Virement bancaire'
    };
    return labels[method] || method;
  };

  if (!user) {
    return <div style={{ padding: '20px' }}>Veuillez vous connecter pour voir vos paiements.</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>;
  }

  const styles = {
    container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
    summaryCard: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px',
      marginBottom: '30px'
    },
    summaryItem: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    summaryValue: { fontSize: '1.8rem', fontWeight: 'bold', color: '#007bff' },
    summaryLabel: { fontSize: '0.9rem', color: '#666', marginTop: '5px' },
    paymentCard: {
      background: 'white',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '15px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      border: '1px solid #eee'
    },
    paymentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottom: '1px solid #eee',
      paddingBottom: '15px',
      marginBottom: '15px'
    },
    transactionId: { fontFamily: 'monospace', fontSize: '0.85rem', color: '#666' },
    amount: { fontSize: '1.5rem', fontWeight: 'bold', color: '#333' },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '500'
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #f5f5f5'
    },
    detailLabel: { color: '#666' },
    detailValue: { fontWeight: '500' },
    refundBtn: {
      padding: '8px 16px',
      background: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '15px'
    },
    refundForm: {
      marginTop: '15px',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '8px'
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      marginBottom: '10px',
      boxSizing: 'border-box'
    },
    btnGroup: { display: 'flex', gap: '10px' }
  };

  return (
    <div style={styles.container}>
      <h1>Historique des Paiements</h1>

      {/* Resume */}
      {summary && (
        <div style={styles.summaryCard}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryValue}>{summary.totalPayments}</div>
            <div style={styles.summaryLabel}>Total transactions</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={{ ...styles.summaryValue, color: '#28a745' }}>{summary.totalSpent.toFixed(2)} EUR</div>
            <div style={styles.summaryLabel}>Total depense</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={{ ...styles.summaryValue, color: '#28a745' }}>{summary.completedPayments}</div>
            <div style={styles.summaryLabel}>Paiements reussis</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={{ ...styles.summaryValue, color: '#dc3545' }}>{summary.totalRefunded.toFixed(2)} EUR</div>
            <div style={styles.summaryLabel}>Total rembourse</div>
          </div>
        </div>
      )}

      {/* Liste des paiements */}
      {payments.length === 0 ? (
        <p>Aucun paiement effectue.</p>
      ) : (
        payments.map(payment => {
          const statusStyle = getStatusStyle(payment.status);
          return (
            <div key={payment._id} style={styles.paymentCard}>
              <div style={styles.paymentHeader}>
                <div>
                  <div style={styles.transactionId}>{payment.transactionId}</div>
                  <div style={styles.amount}>{payment.amount.toFixed(2)} EUR</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    ...styles.statusBadge,
                    background: statusStyle.bg,
                    color: statusStyle.color
                  }}>
                    {statusStyle.text}
                  </span>
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#999' }}>
                    {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Methode de paiement</span>
                <span style={styles.detailValue}>{getPaymentMethodLabel(payment.paymentMethod)}</span>
              </div>

              {payment.cardLast4 && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Carte</span>
                  <span style={styles.detailValue}>**** **** **** {payment.cardLast4}</span>
                </div>
              )}

              {payment.order && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Commande</span>
                  <span style={styles.detailValue}>#{payment.order._id?.substring(0, 10)}...</span>
                </div>
              )}

              {payment.refundedAmount > 0 && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Montant rembourse</span>
                  <span style={{ ...styles.detailValue, color: '#dc3545' }}>-{payment.refundedAmount.toFixed(2)} EUR</span>
                </div>
              )}

              {payment.refundReason && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Raison du remboursement</span>
                  <span style={styles.detailValue}>{payment.refundReason}</span>
                </div>
              )}

              {/* Bouton de remboursement */}
              {payment.status === 'completed' && (
                <>
                  {refundingId === payment._id ? (
                    <div style={styles.refundForm}>
                      <input
                        type="text"
                        placeholder="Raison du remboursement (optionnel)"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        style={styles.input}
                      />
                      <div style={styles.btnGroup}>
                        <button
                          onClick={() => handleRefund(payment._id)}
                          style={{ ...styles.refundBtn, background: '#28a745' }}
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => { setRefundingId(null); setRefundReason(''); }}
                          style={{ ...styles.refundBtn, background: '#6c757d' }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRefundingId(payment._id)}
                      style={styles.refundBtn}
                    >
                      Demander un remboursement
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Payments;
