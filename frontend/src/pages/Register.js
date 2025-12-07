// frontend/src/pages/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
/**
 * Vérifie la complexité d'un mot de passe selon plusieurs critères.
 * @param {string} password Le mot de passe à vérifier.
 * @returns {object} Un objet contenant `isValid` (booléen) et `errors` (tableau de chaînes).
 */
function verifyPasswordComplexity(password) {
    const minLength = 12;
    const requiredCriteriaCount = 3;
    const errors = [];

    // Critère 1: Longueur minimale (12 caractères)
    const hasMinLength = password.length >= minLength;
    if (!hasMinLength) {
        errors.push(`- Au moins ${minLength} caractères.`);
    }

    // Critère 2: Lettre majuscule
    const hasUpperCase = /[A-Z]/.test(password);
    if (!hasUpperCase) {
        errors.push("- Au moins une lettre majuscule.");
    }

    // Critère 3: Lettre minuscule
    const hasLowerCase = /[a-z]/.test(password);
    if (!hasLowerCase) {
        errors.push("- Au moins une lettre minuscule.");
    }

    // Critère 4: Chiffre numérique
    const hasNumber = /[0-9]/.test(password);
    if (!hasNumber) {
        errors.push("- Au moins un chiffre (0-9).");
    }

    // Critère 5: Caractère spécial
    const hasSpecialChar = /[!@#$%^&*()_+[\]{};':"\\|,.<>/?-]/.test(password);
    if (!hasSpecialChar) {
        errors.push("- Au moins un caractère spécial.");
    }

    // Calcul : Le mot de passe doit respecter la longueur minimale ET au moins 3 autres critères.
    const criteria = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar];
    const metCriteria = criteria.filter(c => c).length;

    const isValid = hasMinLength && metCriteria >= requiredCriteriaCount;

    return {
        isValid: isValid,
        errors: isValid ? [] : errors.filter(e => !e.startsWith('- Au moins 12 caractères.') || !hasMinLength),
        metCriteria: metCriteria,
        requiredCriteria: requiredCriteriaCount
    };
}
function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const complexityResult = verifyPasswordComplexity(password);
    if (!complexityResult.isValid) {
      let errorMessage = "Le mot de passe doit respecter les critères suivants (au moins 3 requis) : \n";
      errorMessage += complexityResult.errors.join('\n');
      alert(errorMessage);
      return;
    }
    if (!username || !email || !password) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirm) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
      // Sauvegarde token et user
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      alert('Inscription réussie ! Vous êtes connecté.');
      window.location.href = '/';
    } catch (err) {
      alert('Erreur inscription : ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '14px' }}>Créer un compte</h2>
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Nom d'utilisateur</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Confirmer le mot de passe</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>S'inscrire</button>
      </form>
    </div>
  );
}

export default Register;
