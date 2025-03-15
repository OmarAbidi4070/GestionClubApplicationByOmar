import React from 'react';
import { Link } from 'react-router-dom';
import './navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/assets/logo.png" alt="Logo" className="nav-logo" />
          <span className="company-name">Université de Jendouba</span>
        </Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">
            <i className="fas fa-sign-in-alt"></i> Connexion
          </Link>
          <Link to="/Inscription" className="nav-link signup-btn">
            <i className="fas fa-user-plus"></i> Inscription
          </Link>
       
        </div>
      </div>
    </nav>
  );
};

export default Navbar;