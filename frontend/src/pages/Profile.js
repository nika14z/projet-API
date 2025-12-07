// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Profile() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    form: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUsername(userData.username);
      setEmail(userData.email);
    }
  }, []);

  const validatePassword = (password) => {
    const complexityRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}$/;
    return complexityRegex.test(password);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setErrors(prev => ({ ...prev, form: 'Vous devez être connecté pour faire cela.' }));
      return;
    }

    try {
      await axios.delete('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Votre compte a été supprimé.');
      window.location.href = '/';
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setErrors(prev => ({ ...prev, form: `Erreur lors de la suppression : ${errorMsg}` }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ username: '', email: '', password: '', form: '' });
    setSuccessMessage('');

    if (password && !validatePassword(password)) {
      setErrors(prev => ({ ...prev, password: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' }));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setErrors(prev => ({ ...prev, form: 'Vous devez être connecté pour faire cela.' }));
      return;
    }

    try {
      const updatedData = { username, email };
      if (password) {
        updatedData.password = password;
      }

      const res = await axios.put('http://localhost:5000/api/users/profile', updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('user', JSON.stringify(res.data));
      alert('Profil mis à jour avec succès !');
      window.location.reload();

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes("nom d'utilisateur")) {
        setErrors(prev => ({ ...prev, username: errorMsg }));
      } else if (errorMsg.includes("email")) {
        setErrors(prev => ({ ...prev, email: errorMsg }));
      } else {
        setErrors(prev => ({ ...prev, form: `Erreur lors de la mise à jour : ${errorMsg}` }));
      }
    }
  };

  // --- Styles ---
  const styles = {
    // (Styles from previous step remain the same)
    container: { maxWidth: '500px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' },
    title: { textAlign: 'center', marginBottom: '30px', color: '#333' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' },
    input: { width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box', transition: 'border-color 0.2s' },
    button: { width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', transition: 'background-color 0.2s' },
    deleteButton: { width: '100%', padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', marginTop: '15px', transition: 'background-color 0.2s' },
    errorText: { color: '#D8000C', fontSize: '0.85rem', marginTop: '5px' },
    formMessage: { marginTop: '20px', padding: '10px', borderRadius: '5px', textAlign: 'center' }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Profil Utilisateur</h1>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Nom d'utilisateur</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{...styles.input, borderColor: errors.username ? '#D8000C' : '#ddd'}}
          />
          {errors.username && <p style={styles.errorText}>{errors.username}</p>}
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{...styles.input, borderColor: errors.email ? '#D8000C' : '#ddd'}}
          />
          {errors.email && <p style={styles.errorText}>{errors.email}</p>}
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Nouveau mot de passe</label>
          <input
            type="password"
            placeholder="Laisser vide pour ne pas changer"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{...styles.input, borderColor: errors.password ? '#D8000C' : '#ddd'}}
          />
            {errors.password && <p style={styles.errorText}>{errors.password}</p>}
        </div>
        <button type="submit" style={styles.button}>
          Mettre à jour
        </button>
      </form>
      <button onClick={handleDelete} style={styles.deleteButton}>
        Supprimer mon compte
      </button>
      {errors.form && (
        <p style={{ ...styles.formMessage, color: '#D8000C', backgroundColor: '#FFD2D2' }}>
          {errors.form}
        </p>
      )}
      {successMessage && (
        <p style={{ ...styles.formMessage, color: '#4F8A10', backgroundColor: '#DFF2BF' }}>
          {successMessage}
        </p>
      )}
    </div>
  );
}

export default Profile;
