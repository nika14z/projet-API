// frontend/src/pages/Checkout.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Checkout({ cart, clearCart }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const token = localStorage.getItem('token') || null;

  // Etapes: 1 = Adresse, 2 = Paiement, 3 = Confirmation
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Adresse de livraison
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: 'France'
  });

  // Informations de carte
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  // Erreurs de validation
  const [cardErrors, setCardErrors] = useState({});

  const totalPrice = (cart.reduce((acc, item) => acc + (item.price || 0) * (item.qty || 0), 0)).toFixed(2);

  // Validation du numero de carte (format basique)
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  // Validation de la date d'expiration
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateCard = () => {
    const errors = {};
    const cardNum = cardInfo.cardNumber.replace(/\s/g, '');

    if (!cardNum || cardNum.length < 16) {
      errors.cardNumber = 'Numero de carte invalide (16 chiffres)';
    }
    if (!cardInfo.cardName.trim()) {
      errors.cardName = 'Nom du titulaire requis';
    }
    if (!cardInfo.expiryDate || cardInfo.expiryDate.length < 5) {
      errors.expiryDate = 'Date d\'expiration invalide (MM/YY)';
    }
    if (!cardInfo.cvv || cardInfo.cvv.length < 3) {
      errors.cvv = 'CVV invalide (3 chiffres)';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAddress = () => {
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
      setError('Veuillez remplir tous les champs de l\'adresse');
      return false;
    }
    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateAddress()) {
      setStep(2);
    }
  };

  const handlePayment = async () => {
    if (!validateCard()) return;

    setLoading(true);
    setError('');

    try {
      // 1. Creer la commande
      const orderData = {
        orderItems: cart.map(item => ({
          product: item._id || item.id,
          title: item.title,
          image: item.image,
          price: item.price,
          qty: item.qty
        })),
        shippingAddress,
        paymentMethod: 'card',
        totalPrice: parseFloat(totalPrice)
      };

      const orderRes = await axios.post('http://localhost:5000/api/orders/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orderId = orderRes.data._id;

      // 2. Simuler le paiement
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation delai

      // 3. Creer le paiement
      const paymentData = {
        orderId,
        paymentMethod: 'card',
        cardLast4: cardInfo.cardNumber.replace(/\s/g, '').slice(-4)
      };

      await axios.post('http://localhost:5000/api/payments', paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 4. Succes - passer a l'etape de confirmation
      setStep(3);

      // Vider le panier
      localStorage.removeItem('biblio-cart');
      if (clearCart) clearCart();

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Connexion requise</h2>
          <p>Veuillez vous connecter pour finaliser votre commande.</p>
          <button onClick={() => navigate('/login')} style={styles.primaryBtn}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Panier vide</h2>
          <p>Votre panier est vide. Ajoutez des livres avant de passer commande.</p>
          <button onClick={() => navigate('/')} style={styles.primaryBtn}>
            Voir les livres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressStep, ...(step >= 1 ? styles.activeStep : {}) }}>
          <div style={styles.stepNumber}>1</div>
          <span>Adresse</span>
        </div>
        <div style={styles.progressLine}></div>
        <div style={{ ...styles.progressStep, ...(step >= 2 ? styles.activeStep : {}) }}>
          <div style={styles.stepNumber}>2</div>
          <span>Paiement</span>
        </div>
        <div style={styles.progressLine}></div>
        <div style={{ ...styles.progressStep, ...(step >= 3 ? styles.activeStep : {}) }}>
          <div style={styles.stepNumber}>3</div>
          <span>Confirmation</span>
        </div>
      </div>

      <div style={styles.content}>
        {/* Etape 1: Adresse */}
        {step === 1 && (
          <div style={styles.card}>
            <h2>Adresse de livraison</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Adresse</label>
              <input
                type="text"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                placeholder="123 Rue de la Librairie"
                style={styles.input}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ville</label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  placeholder="Paris"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Code postal</label>
                <input
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  placeholder="75001"
                  style={styles.input}
                  maxLength={5}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Pays</label>
              <input
                type="text"
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                style={styles.input}
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button onClick={handleNextStep} style={styles.primaryBtn}>
              Continuer vers le paiement
            </button>
          </div>
        )}

        {/* Etape 2: Paiement */}
        {step === 2 && (
          <div style={styles.card}>
            <h2>Informations de paiement</h2>

            <div style={styles.cardPreview}>
              <div style={styles.cardChip}></div>
              <div style={styles.cardNumber}>
                {cardInfo.cardNumber || '**** **** **** ****'}
              </div>
              <div style={styles.cardBottom}>
                <div>
                  <div style={styles.cardLabel}>Titulaire</div>
                  <div>{cardInfo.cardName || 'VOTRE NOM'}</div>
                </div>
                <div>
                  <div style={styles.cardLabel}>Expire</div>
                  <div>{cardInfo.expiryDate || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Numero de carte</label>
              <input
                type="text"
                value={cardInfo.cardNumber}
                onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: formatCardNumber(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                style={{ ...styles.input, ...(cardErrors.cardNumber ? styles.inputError : {}) }}
                maxLength={19}
              />
              {cardErrors.cardNumber && <span style={styles.errorText}>{cardErrors.cardNumber}</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du titulaire</label>
              <input
                type="text"
                value={cardInfo.cardName}
                onChange={(e) => setCardInfo({ ...cardInfo, cardName: e.target.value.toUpperCase() })}
                placeholder="JEAN DUPONT"
                style={{ ...styles.input, ...(cardErrors.cardName ? styles.inputError : {}) }}
              />
              {cardErrors.cardName && <span style={styles.errorText}>{cardErrors.cardName}</span>}
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date d'expiration</label>
                <input
                  type="text"
                  value={cardInfo.expiryDate}
                  onChange={(e) => setCardInfo({ ...cardInfo, expiryDate: formatExpiryDate(e.target.value) })}
                  placeholder="MM/YY"
                  style={{ ...styles.input, ...(cardErrors.expiryDate ? styles.inputError : {}) }}
                  maxLength={5}
                />
                {cardErrors.expiryDate && <span style={styles.errorText}>{cardErrors.expiryDate}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>CVV</label>
                <input
                  type="password"
                  value={cardInfo.cvv}
                  onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value.replace(/\D/g, '') })}
                  placeholder="123"
                  style={{ ...styles.input, ...(cardErrors.cvv ? styles.inputError : {}) }}
                  maxLength={4}
                />
                {cardErrors.cvv && <span style={styles.errorText}>{cardErrors.cvv}</span>}
              </div>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.buttonGroup}>
              <button onClick={() => setStep(1)} style={styles.secondaryBtn}>
                Retour
              </button>
              <button onClick={handlePayment} style={styles.primaryBtn} disabled={loading}>
                {loading ? 'Traitement en cours...' : `Payer ${totalPrice} EUR`}
              </button>
            </div>

            <p style={styles.secureNote}>
              Paiement securise - Vos donnees sont protegees
            </p>
          </div>
        )}

        {/* Etape 3: Confirmation */}
        {step === 3 && (
          <div style={styles.card}>
            <div style={styles.successIcon}>&#10003;</div>
            <h2 style={styles.successTitle}>Paiement reussi !</h2>
            <p style={styles.successText}>
              Votre commande a ete confirmee et sera expediee prochainement.
            </p>
            <p style={styles.successText}>
              Un email de confirmation vous a ete envoye.
            </p>

            <div style={styles.orderSummary}>
              <h3>Resume de la commande</h3>
              <div style={styles.summaryRow}>
                <span>Total paye</span>
                <strong>{totalPrice} EUR</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Livraison</span>
                <span>{shippingAddress.address}, {shippingAddress.city}</span>
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button onClick={() => navigate('/myorders')} style={styles.secondaryBtn}>
                Voir mes commandes
              </button>
              <button onClick={() => navigate('/')} style={styles.primaryBtn}>
                Continuer mes achats
              </button>
            </div>
          </div>
        )}

        {/* Resume du panier (visible etapes 1 et 2) */}
        {step < 3 && (
          <div style={styles.sidebar}>
            <h3>Votre commande</h3>
            <div style={styles.cartItems}>
              {cart.map(item => (
                <div key={item._id || item.id} style={styles.cartItem}>
                  <img src={item.image} alt={item.title} style={styles.cartItemImage} />
                  <div style={styles.cartItemInfo}>
                    <div style={styles.cartItemTitle}>{item.title}</div>
                    <div style={styles.cartItemQty}>{item.qty} x {item.price} EUR</div>
                  </div>
                </div>
              ))}
            </div>
            <hr />
            <div style={styles.totalRow}>
              <span>Total</span>
              <strong style={styles.totalPrice}>{totalPrice} EUR</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '30px',
    gap: '10px'
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    color: '#999'
  },
  activeStep: {
    color: '#007bff'
  },
  stepNumber: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  progressLine: {
    width: '50px',
    height: '2px',
    background: '#e0e0e0'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '30px'
  },
  card: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  formGroup: {
    marginBottom: '20px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  inputError: {
    borderColor: '#dc3545'
  },
  errorText: {
    color: '#dc3545',
    fontSize: '0.85rem',
    marginTop: '5px',
    display: 'block'
  },
  error: {
    color: '#dc3545',
    background: '#f8d7da',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  primaryBtn: {
    width: '100%',
    padding: '14px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  secondaryBtn: {
    padding: '14px 24px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px'
  },
  cardPreview: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '25px',
    minHeight: '180px',
    position: 'relative'
  },
  cardChip: {
    width: '40px',
    height: '30px',
    background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  cardNumber: {
    fontSize: '1.4rem',
    letterSpacing: '2px',
    marginBottom: '20px',
    fontFamily: 'monospace'
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  cardLabel: {
    fontSize: '0.7rem',
    opacity: '0.8',
    marginBottom: '4px'
  },
  secureNote: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.85rem',
    marginTop: '15px'
  },
  sidebar: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    height: 'fit-content'
  },
  cartItems: {
    marginBottom: '15px'
  },
  cartItem: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px'
  },
  cartItemImage: {
    width: '50px',
    height: '70px',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  cartItemInfo: {
    flex: 1
  },
  cartItemTitle: {
    fontWeight: '600',
    fontSize: '0.9rem',
    marginBottom: '4px'
  },
  cartItemQty: {
    color: '#666',
    fontSize: '0.85rem'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px'
  },
  totalPrice: {
    fontSize: '1.3rem',
    color: '#007bff'
  },
  successIcon: {
    width: '80px',
    height: '80px',
    background: '#28a745',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    margin: '0 auto 20px'
  },
  successTitle: {
    textAlign: 'center',
    color: '#28a745'
  },
  successText: {
    textAlign: 'center',
    color: '#666'
  },
  orderSummary: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  }
};

export default Checkout;
