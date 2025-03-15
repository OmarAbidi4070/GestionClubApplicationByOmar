"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "./join-club.css"
import { X } from "lucide-react"

const JoinClub = () => {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    age: "",
    specialite: "",
    idScolaire: "",
    skills: "",
    acceptRules: false,
  })
  const [user, setUser] = useState(null)
  const [mesDemandes, setMesDemandes] = useState([])

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)

      // Pré-remplir le formulaire avec les informations de l'utilisateur
      setFormData((prevState) => ({
        ...prevState,
        nom: userData.nom || "",
        prenom: userData.prenom || "",
      }))
    }

    // Récupérer la liste des clubs
    fetchClubs()

    // Récupérer les demandes de l'utilisateur
    fetchMesDemandes()
  }, [])

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/api/clubs", {
        headers: { "x-auth-token": token },
      })
      setClubs(response.data)
      setLoading(false)
    } catch (err) {
      setError("Erreur lors de la récupération des clubs")
      setLoading(false)
      console.error("Erreur:", err)
    }
  }

  const fetchMesDemandes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/api/mes-demandes", {
        headers: { "x-auth-token": token },
      })
      setMesDemandes(response.data)
    } catch (err) {
      console.error("Erreur lors de la récupération des demandes:", err)
    }
  }

  const handleOpenModal = (club) => {
    // Vérifier si l'utilisateur a déjà une demande en attente pour ce club
    const demandeExistante = mesDemandes.find(
      (demande) => demande.club._id === club._id && demande.statut === "en_attente",
    )

    if (demandeExistante) {
      alert("Vous avez déjà une demande en attente pour ce club")
      return
    }

    // Vérifier si l'utilisateur est déjà membre du club
    const isMember = club.membres.some((member) => member.userId && user && member.userId === user.id)

    if (isMember) {
      alert("Vous êtes déjà membre de ce club")
      return
    }

    setSelectedClub(club)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedClub(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.acceptRules) {
      alert("Vous devez accepter les règles de discipline pour rejoindre le club")
      return
    }

    try {
      const token = localStorage.getItem("token")
      // Utiliser la nouvelle route /demande
      const response = await axios.post(`http://localhost:5000/api/clubs/${selectedClub._id}/demande`, formData, {
        headers: { "x-auth-token": token },
      })

      alert("Demande envoyée avec succès !")
      handleCloseModal()
      // Rafraîchir la liste des demandes
      fetchMesDemandes()
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi de la demande")
      console.error("Erreur:", err)
    }
  }

  // Fonction pour obtenir le statut d'une demande pour un club
  const getDemandeStatus = (clubId) => {
    const demande = mesDemandes.find((d) => d.club._id === clubId)
    if (!demande) return null
    return demande.statut
  }

  // Fonction pour obtenir le texte du bouton en fonction du statut de la demande
  const getButtonText = (clubId) => {
    const status = getDemandeStatus(clubId)

    if (!status) return "Rejoindre"

    switch (status) {
      case "en_attente":
        return "Demande en attente"
      case "acceptée":
        return "Membre"
      case "refusée":
        return "Demande refusée"
      default:
        return "Rejoindre"
    }
  }

  // Fonction pour déterminer si le bouton doit être désactivé
  const isButtonDisabled = (clubId) => {
    const status = getDemandeStatus(clubId)
    return status === "en_attente" || status === "acceptée"
  }

  if (loading) return <div className="loading">Chargement des clubs...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="join-club-container">
      <h1 className="page-title">Rejoindre un Club</h1>
      <p className="page-description">
        Découvrez les clubs disponibles et rejoignez ceux qui vous intéressent pour développer vos compétences et
        élargir votre réseau.
      </p>

      {mesDemandes.length > 0 && (
        <div className="mes-demandes-section">
          <h2>Mes demandes d'adhésion</h2>
          <div className="demandes-list">
            {mesDemandes.map((demande) => (
              <div key={demande._id} className={`demande-card demande-${demande.statut}`}>
                <div className="demande-club-info">
                  {demande.club.logo ? (
                    <img
                      src={`http://localhost:5000/${demande.club.logo}`}
                      alt={`Logo ${demande.club.nom}`}
                      className="demande-club-logo"
                    />
                  ) : (
                    <div className="demande-club-logo-placeholder">{demande.club.nom.charAt(0)}</div>
                  )}
                  <div>
                    <h3>{demande.club.nom}</h3>
                    <p>{demande.club.etablissement}</p>
                  </div>
                </div>
                <div className="demande-status">
                  <span className={`status-badge status-${demande.statut}`}>
                    {demande.statut === "en_attente"
                      ? "En attente"
                      : demande.statut === "acceptée"
                        ? "Acceptée"
                        : "Refusée"}
                  </span>
                  <p className="demande-date">Demande envoyée le {new Date(demande.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="clubs-table-container">
        <table className="clubs-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nom du Club</th>
              <th>Description</th>
              <th>Établissement</th>
              <th>Membres</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clubs.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-clubs">
                  Aucun club disponible pour le moment
                </td>
              </tr>
            ) : (
              clubs.map((club) => (
                <tr key={club._id}>
                  <td>
                    {club.logo ? (
                      <img src={`http://localhost:5000/${club.logo}`} alt={`Logo ${club.nom}`} className="club-logo" />
                    ) : (
                      <div className="club-logo-placeholder">{club.nom.charAt(0)}</div>
                    )}
                  </td>
                  <td>{club.nom}</td>
                  <td className="club-description">{club.description}</td>
                  <td>{club.etablissement}</td>
                  <td>{club.membres.length}</td>
                  <td>
                    <button
                      className={`join-button ${isButtonDisabled(club._id) ? "disabled" : ""}`}
                      onClick={() => handleOpenModal(club)}
                      disabled={isButtonDisabled(club._id)}
                    >
                      {getButtonText(club._id)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal pour rejoindre un club */}
      {showModal && selectedClub && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Rejoindre {selectedClub.nom}</h2>
              <button className="close-button" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="join-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nom">Nom</label>
                  <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="prenom">Prénom</label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="age">Âge</label>
                  <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="specialite">Spécialité</label>
                  <input
                    type="text"
                    id="specialite"
                    name="specialite"
                    value={formData.specialite}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="idScolaire">ID Scolaire</label>
                <input
                  type="text"
                  id="idScolaire"
                  name="idScolaire"
                  value={formData.idScolaire}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">Compétences</label>
                <textarea
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="Décrivez vos compétences pertinentes pour ce club"
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="acceptRules"
                  name="acceptRules"
                  checked={formData.acceptRules}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="acceptRules">
                  J'accepte les règles de discipline du club et je m'engage à les respecter
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCloseModal}>
                  Annuler
                </button>
                <button type="submit" className="submit-button">
                  Envoyer ma demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default JoinClub

