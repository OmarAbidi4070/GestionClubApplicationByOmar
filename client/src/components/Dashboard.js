import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            'x-auth-token': token
          }
        });
        
        setUser(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  if (loading) {
    return <div className="container mt-5">Chargement...</div>;
  }
  
  if (!user) {
    return <div className="container mt-5">Veuillez vous connecter pour accéder au tableau de bord.</div>;
  }
  
  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h2>Tableau de bord</h2>
        </div>
        <div className="card-body">
          <h4>Bienvenue, {user.prenom} {user.nom}!</h4>
          <p>Email: {user.email}</p>
          <p>Poste: {user.poste}</p>
          <p>Établissement: {user.etablissement}</p>
          
          {user.poste === 'responsable' && (
            <div className="mt-3">
              <Link to="/create-club" className="btn btn-primary">
                Créer un club
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;