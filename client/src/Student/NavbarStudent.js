import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './navbar.css';
import { BookOpen, Calendar, MessageSquare, AlertTriangle, LogOut, User } from 'lucide-react';

const NavbarStudent = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    // Supprimer le token et les informations utilisateur
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!user) return null;

  return (
    <nav className="student-navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/dashboard">
            <span className="logo-text">ClubConnect</span>
          </Link>
        </div>

        {/* Hamburger menu pour mobile */}
        <div className="navbar-mobile-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Navigation links */}
        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/join-club" className="nav-link">
            <BookOpen size={18} />
            <span>Rejoindre un Club</span>
          </Link>
          <Link to="/events" className="nav-link">
            <Calendar size={18} />
            <span>Événements</span>
          </Link>
          <Link to="/testimonials" className="nav-link">
            <MessageSquare size={18} />
            <span>Témoignages</span>
          </Link>
          <Link to="/complaints" className="nav-link">
            <AlertTriangle size={18} />
            <span>Réclamations</span>
          </Link>
        </div>

        {/* User profile and logout */}
        <div className="navbar-user">
          <div className="user-profile">
            <User size={18} />
            <span>{user.nom} {user.prenom}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavbarStudent;
