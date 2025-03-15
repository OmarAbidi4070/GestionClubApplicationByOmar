import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserManagement.css';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Récupérer tous les utilisateurs
  const fetchUsers = async () => {
    try {
      // Récupérer le token depuis le localStorage
      const token = localStorage.getItem('token');
      
      // Vérifier si le token existe
      if (!token) {
        throw new Error('Aucun token trouvé. Veuillez vous reconnecter.');
      }

      // Configuration de la requête avec le token
      const config = {
        headers: { 
          'x-auth-token': token 
        }
      };

      const response = await axios.get('http://localhost:5000/api/users', config);
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      // Gestion des erreurs différenciée
      if (err.response && err.response.status === 401) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        // Optionnel : déconnexion automatique
        localStorage.removeItem('token');
        // Redirection vers la page de connexion
        window.location.href = '/login';
      } else {
        setError(err.message || 'Une erreur est survenue lors de la récupération des utilisateurs.');
      }
      setLoading(false);
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Aucun token trouvé. Veuillez vous reconnecter.');
      }

      const config = {
        headers: { 
          'x-auth-token': token 
        }
      };

      await axios.delete(`http://localhost:5000/api/users/${userId}`, config);
      setUsers(users.filter((user) => user._id !== userId));
      // Retirer de la sélection si nécessaire
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Votre session a expiré. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('Erreur lors de la suppression de l\'utilisateur.');
      }
    }
  };

  // Supprimer les utilisateurs sélectionnés
  const deleteSelectedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Aucun token trouvé. Veuillez vous reconnecter.');
      }

      const config = {
        headers: { 
          'x-auth-token': token 
        }
      };

      await Promise.all(
        selectedUsers.map(userId => 
          axios.delete(`http://localhost:5000/api/users/${userId}`, config)
        )
      );
      // Filtrer les utilisateurs restants
      setUsers(users.filter(user => !selectedUsers.includes(user._id)));
      // Réinitialiser la sélection
      setSelectedUsers([]);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Votre session a expiré. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('Erreur lors de la suppression des utilisateurs sélectionnés.');
      }
    }
  };

  // Basculer la sélection d'un utilisateur
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Sélectionner/désélectionner tous les utilisateurs
  const toggleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === users.length 
        ? [] 
        : users.map(user => user._id)
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return (
    <div className="loading-container">
      <RefreshCw className="loading-icon" />
      <p>Chargement des utilisateurs...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <AlertTriangle className="error-icon" />
      <p>{error}</p>
    </div>
  );

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1>Gestion des utilisateurs</h1>
        {selectedUsers.length > 0 && (
          <button 
            className="delete-selected-btn" 
            onClick={deleteSelectedUsers}
          >
            <Trash2 size={16} /> Supprimer {selectedUsers.length} sélectionnés
          </button>
        )}
      </div>
      
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={selectedUsers.length === users.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user._id} 
                className={selectedUsers.includes(user._id) ? 'selected-row' : ''}
              >
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                  />
                </td>
                <td>{user.nom}</td>
                <td>{user.prenom}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.poste.toLowerCase()}`}>
                    {user.poste}
                  </span>
                </td>
                <td>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteUser(user._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;