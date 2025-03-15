import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      alert(response.data.message);
      
      // Redirect based on user role
      if (response.data.user.poste === 'administrateur') {
        navigate('/admin/dashboard'); // Redirection pour les administrateurs
      } else if (response.data.user.poste === 'responsable') {
        navigate('/create-club'); // Redirection pour les responsables
      } else {
        navigate('/dashboard'); // Redirection par défaut pour les autres rôles
      }
    } catch (error) {
      alert(error.response ? error.response.data.message : 'Une erreur s\'est produite.');
    }
  };

  return (
    <div className="auth-page">
      <div className="login-container">
        <div className="login-header">
          <div className="avatar-container">
            <img src="/assets/avatar.png" alt="Avatar" className="avatar" />
            <div className="avatar-overlay">
              <i className="fas fa-user"></i>
            </div>
          </div>
          <h2>Connexion</h2>
          <p>Bienvenue ! Veuillez vous connecter.</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <div className="input-icon">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                name="email"
                placeholder="Votre email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <div className="input-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                name="password"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" /> Se souvenir de moi
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Mot de passe oublié?
            </Link>
          </div>
          <button type="submit" className="login-btn">
            <i className="fas fa-sign-in-alt"></i> Se connecter
          </button>
        </form>
        <div className="auth-footer">
          <p>Pas encore de compte? <Link to="/inscription">S'inscrire</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;