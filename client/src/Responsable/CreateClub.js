import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './createClub.css'

const CreateClub = () => {
  const navigate = useNavigate();
  const [clubData, setClubData] = useState({
    clubName: '',
    description: '',
    activeMembers: [{ email: '', role: '' }],
    creationDate: new Date().toISOString().split('T')[0],
    etablissement: '' // Ajout du champ établissement
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [validationDoc, setValidationDoc] = useState(null);
  const [validationDocName, setValidationDocName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Liste des établissements disponibles
  const etablissements = [
    "Ariana", "Beja", "Ben Arous", "Bizerte", "Gabes", "Gafsa", "Jendouba",
    "Kairouan", "Kasserine", "Kebili", "Le Kef", "Mahdia", "Manouba",
    "Medenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana",
    "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClubData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Le logo ne doit pas dépasser 2MB');
        return;
      }
      
      if (!file.type.match('image.*')) {
        setError('Veuillez sélectionner une image valide');
        return;
      }
      
      setLogo(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Le document ne doit pas dépasser 10MB');
        return;
      }
      setValidationDoc(file);
      setValidationDocName(file.name);
      setError('');
    }
  };

  const handleMemberChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMembers = [...clubData.activeMembers];
    updatedMembers[index] = { ...updatedMembers[index], [name]: value };
    setClubData(prevData => ({
      ...prevData,
      activeMembers: updatedMembers
    }));
  };

  const addMember = () => {
    setClubData(prevData => ({
      ...prevData,
      activeMembers: [...prevData.activeMembers, { email: '', role: '' }]
    }));
  };

  const removeMember = (index) => {
    if (clubData.activeMembers.length > 1) {
      const updatedMembers = [...clubData.activeMembers];
      updatedMembers.splice(index, 1);
      setClubData(prevData => ({
        ...prevData,
        activeMembers: updatedMembers
      }));
    }
  };

  const validateForm = () => {
    if (!clubData.clubName.trim()) {
      setError('Le nom du club est obligatoire');
      return false;
    }
    
    if (!logo) {
      setError('Veuillez ajouter un logo pour le club');
      return false;
    }
    
    if (!validationDoc) {
      setError('Veuillez ajouter un document de validation');
      return false;
    }

    if (!clubData.etablissement) {
      setError('Veuillez sélectionner un établissement');
      return false;
    }
    
    // Vérification des emails des membres
    for (const member of clubData.activeMembers) {
      if (!member.email.trim()) {
        setError('Tous les emails des membres doivent être renseignés');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        setError(`L'email "${member.email}" n'est pas valide`);
        return false;
      }
      
      if (!member.role.trim()) {
        setError('Tous les rôles des membres doivent être renseignés');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('clubName', clubData.clubName);
      formData.append('description', clubData.description);
      formData.append('creationDate', clubData.creationDate);
      formData.append('etablissement', clubData.etablissement);
      formData.append('logo', logo);
      formData.append('validationDoc', validationDoc);
      formData.append('activeMembers', JSON.stringify(clubData.activeMembers));
      
      // Modification pour supprimer l'en-tête d'authentification
      const response = await axios.post('http://localhost:5000/api/clubs/create-public', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Club créé avec succès!');
      setTimeout(() => {
        navigate('/clubs');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la création du club:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création du club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-club-container">
      <h2 className="create-club-title">Ajouter un nouveau club</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form className="create-club-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="form-group">
          <label htmlFor="clubName">Nom du club *</label>
          <input
            type="text"
            id="clubName"
            name="clubName"
            value={clubData.clubName}
            onChange={handleChange}
            placeholder="Entrez le nom du club"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description du club</label>
          <textarea
            id="description"
            name="description"
            value={clubData.description}
            onChange={handleChange}
            placeholder="Décrivez le club et ses activités"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="etablissement">Établissement *</label>
          <select
            id="etablissement"
            name="etablissement"
            value={clubData.etablissement}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez un établissement</option>
            {etablissements.map((etab) => (
              <option key={etab} value={etab}>
                {etab}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group logo-upload">
          <label>Logo du club *</label>
          <div className="logo-preview-container">
            {logoPreview ? (
              <div className="logo-preview">
                <img src={logoPreview} alt="Aperçu du logo" />
              </div>
            ) : (
              <div className="logo-placeholder">
                <i className="fas fa-image"></i>
                <span>Aucun logo sélectionné</span>
              </div>
            )}
            <div className="logo-upload-btn">
              <button 
                type="button" 
                className="upload-btn"
                onClick={() => fileInputRef.current.click()}
              >
                {logoPreview ? 'Changer le logo' : 'Ajouter un logo'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <p className="file-info">JPG, PNG ou SVG (max 2MB)</p>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label>Document de validation *</label>
          <div className="doc-upload">
            <button 
              type="button" 
              className="upload-btn"
              onClick={() => docInputRef.current.click()}
            >
              {validationDoc ? 'Changer le document' : 'Ajouter un document'}
            </button>
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocChange}
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
            />
            {validationDocName && (
              <div className="selected-doc">
                <i className="fas fa-file-pdf"></i>
                <span>{validationDocName}</span>
              </div>
            )}
            <p className="file-info">PDF, DOC ou DOCX (max 10MB)</p>
          </div>
        </div>
        
        <div className="form-group members-section">
          <label>Membres actifs *</label>
          {clubData.activeMembers.map((member, index) => (
            <div key={index} className="member-row">
              <div className="member-inputs">
                <input
                  type="email"
                  name="email"
                  value={member.email}
                  onChange={(e) => handleMemberChange(index, e)}
                  placeholder="Email du membre"
                  required
                />
                <input
                  type="text"
                  name="role"
                  value={member.role}
                  onChange={(e) => handleMemberChange(index, e)}
                  placeholder="Rôle dans le club"
                  required
                />
              </div>
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeMember(index)}
                disabled={clubData.activeMembers.length === 1}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
          <button type="button" className="add-member-btn" onClick={addMember}>
            <i className="fas fa-plus"></i> Ajouter un membre
          </button>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/clubs')}>
            Annuler
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer le club'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClub;