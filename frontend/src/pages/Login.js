// frontend/src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Permet de changer de page

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Empêche la page de se recharger
    try {
      // On envoie les infos au backend
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      // Si c'est bon, on sauvegarde le token et l'utilisateur
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      alert('Connexion réussie !');
      // On redirige vers l'accueil et on recharge pour mettre à jour le menu
      window.location.href = "/"; 
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Identifiants incorrects"));
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Se connecter</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email :</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} 
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mot de passe :</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} 
          />
        </div>
        <button 
          type="submit" 
          style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem' }}
        >
          Connexion
        </button>
      </form>
      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <small>Pas encore de compte ? <Link to="/register">Créez-en un</Link></small>
      </div>
    </div>
  );
}

export default Login;