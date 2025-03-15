import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './inscription.css';

const Inscription = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '', 
    cin: '',
    email: '',
    password: '',
    poste: '',
    etablissement: '' 
  });
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      alert(response.data.message);
    } catch (error) {
      alert(error.response ? error.response.data.message : 'Une erreur s\'est produite.');
    }
  };

  return (
    <div className="auth-page">
      <div className="inscription-container">
        <div className="inscription-header">
          <div className="header-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2>Création de compte</h2>
          <p>Rejoignez-nous en quelques clics</p>
        </div>
        <form onSubmit={handleSubmit} className="inscription-form">
          <div className="form-row">
            <div className="form-group">
              <div className="input-icon">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  name="nom"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <div className="input-icon">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  name="prenom"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="form-group">
  <div className="input-icon">
    <i className="fas fa-calendar"></i>
    <input
      type="date"
      name="dateNaissance"
      value={formData.dateNaissance}
      onChange={handleChange}
      required
    />
  </div>
</div>
          <div className="form-group">
            <div className="input-icon">
              <i className="fas fa-id-card"></i>
              <input
                type="text"
                name="cin"
                placeholder="CIN"
                value={formData.cin}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <div className="input-icon">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                name="email"
                placeholder="Email"
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
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <div className="input-icon">
              <i className="fas fa-briefcase"></i>
              <select
                name="poste"
                value={formData.poste}
                onChange={handleChange}
                required
                className="select-poste"
              >
                <option value="">Sélectionnez un poste</option>
                <option value="administrateur">Administrateur</option>
                <option value="etudiant">Étudiant</option>
                <option value="responsable">Responsable</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <div className="input-icon">
              <i className="fas fa-building"></i>
              <select
                name="etablissement"
                value={formData.etablissement}
                onChange={handleChange}
                required
                className="select-etablissement"
              >
                <option value="">Sélectionnez un établissement</option>
                <option value="Ariana">Ariana</option>
                <option value="Beja">Béja</option>
                <option value="Ben Arous">Ben Arous</option>
                <option value="Bizerte">Bizerte</option>
                <option value="Gabes">Gabès</option>
                <option value="Gafsa">Gafsa</option>
                <option value="Jendouba">Jendouba</option>
                <option value="Kairouan">Kairouan</option>
                <option value="Kasserine">Kasserine</option>
                <option value="Kebili">Kébili</option>
                <option value="Le Kef">Le Kef</option>
                <option value="Mahdia">Mahdia</option>
                <option value="Manouba">Manouba</option>
                <option value="Medenine">Médenine</option>
                <option value="Monastir">Monastir</option>
                <option value="Nabeul">Nabeul</option>
                <option value="Sfax">Sfax</option>
                <option value="Sidi Bouzid">Sidi Bouzid</option>
                <option value="Siliana">Siliana</option>
                <option value="Sousse">Sousse</option>
                <option value="Tataouine">Tataouine</option>
                <option value="Tozeur">Tozeur</option>
                <option value="Tunis">Tunis</option>
                <option value="Zaghouan">Zaghouan</option>
              </select>
            </div>
          </div>

          <button type="submit" className="create-account-btn">
            <i className="fas fa-user-plus"></i> Créer mon compte
          </button>
        </form>
        <div className="auth-footer">
          <p>Déjà inscrit? <Link to="/login">Se connecter</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Inscription;