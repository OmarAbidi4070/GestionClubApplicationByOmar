"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import "./reclamation.css"

const Reclamation = () => {
  const [reclamations, setReclamations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    sujet: "",
    description: "",
    type: "general", // Par défaut
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [expandedReclamation, setExpandedReclamation] = useState(null)

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // Récupérer la liste des réclamations de l'utilisateur
    fetchReclamations()
  }, [])

  const fetchReclamations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/api/reclamations", {
        headers: { "x-auth-token": token },
      })
      setReclamations(response.data)
      setLoading(false)
    } catch (err) {
      setError("Erreur lors de la récupération des réclamations")
      setLoading(false)
      console.error("Erreur:", err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.sujet.trim() === "" || formData.description.trim() === "") {
      alert("Veuillez remplir tous les champs")
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem("token")
      const response = await axios.post("http://localhost:5000/api/reclamations", formData, {
        headers: { "x-auth-token": token },
      })

      // Réinitialiser le formulaire
      setFormData({
        sujet: "",
        description: "",
        type: "general",
      })

      // Afficher un message de succès
      setSuccessMessage("Votre réclamation a été envoyée avec succès !")
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      // Rafraîchir la liste des réclamations
      fetchReclamations()
      setSubmitting(false)
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi de la réclamation")
      setSubmitting(false)
      console.error("Erreur:", err)
    }
  }

  const toggleReclamation = (id) => {
    if (expandedReclamation === id) {
      setExpandedReclamation(null)
    } else {
      setExpandedReclamation(id)
    }
  }

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("fr-FR", options)
  }

  // Fonction pour obtenir la classe de statut
  const getStatusClass = (statut) => {
    switch (statut) {
      case "en_attente":
        return "status-pending"
      case "en_cours":
        return "status-processing"
      case "resolue":
        return "status-resolved"
      case "rejetee":
        return "status-rejected"
      default:
        return ""
    }
  }

  // Fonction pour obtenir le texte du statut
  const getStatusText = (statut) => {
    switch (statut) {
      case "en_attente":
        return "En attente"
      case "en_cours":
        return "En cours de traitement"
      case "resolue":
        return "Résolue"
      case "rejetee":
        return "Rejetée"
      default:
        return statut
    }
  }

  if (loading && reclamations.length === 0) return <div className="loading">Chargement des réclamations...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="reclamation-container">
      <h1 className="page-title">Réclamations</h1>
      <p className="page-description">
        Signalez un problème ou faites une demande spécifique concernant les clubs universitaires.
      </p>

      {/* Formulaire de réclamation */}
      <div className="reclamation-form-container">
        <h2>Soumettre une réclamation</h2>
        <form onSubmit={handleSubmit} className="reclamation-form">
          <div className="form-group">
            <label htmlFor="type">Type de réclamation</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} required>
              <option value="general">Général</option>
              <option value="technique">Problème technique</option>
              <option value="administratif">Problème administratif</option>
              <option value="suggestion">Suggestion</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sujet">Sujet</label>
            <input
              type="text"
              id="sujet"
              name="sujet"
              value={formData.sujet}
              onChange={handleChange}
              placeholder="Sujet de votre réclamation"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez votre problème ou votre demande en détail..."
              required
            />
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? "Envoi en cours..." : "Envoyer ma réclamation"}
          </button>
        </form>
      </div>

      {/* Liste des réclamations */}
      <div className="reclamations-list">
        <h2>Mes réclamations</h2>
        {reclamations.length === 0 ? (
          <div className="no-reclamations">Vous n'avez soumis aucune réclamation pour le moment.</div>
        ) : (
          reclamations.map((reclamation) => (
            <div key={reclamation._id} className="reclamation-card">
              <div className="reclamation-header" onClick={() => toggleReclamation(reclamation._id)}>
                <div className="reclamation-title">
                  <AlertTriangle size={18} className="reclamation-icon" />
                  <h3>{reclamation.sujet}</h3>
                </div>
                <div className="reclamation-meta">
                  <span className={`status-badge ${getStatusClass(reclamation.statut)}`}>
                    {getStatusText(reclamation.statut)}
                  </span>
                  <span className="reclamation-date">{formatDate(reclamation.createdAt)}</span>
                  {expandedReclamation === reclamation._id ? (
                    <ChevronUp size={18} className="toggle-icon" />
                  ) : (
                    <ChevronDown size={18} className="toggle-icon" />
                  )}
                </div>
              </div>
              {expandedReclamation === reclamation._id && (
                <div className="reclamation-details">
                  <div className="reclamation-info">
                    <p className="info-label">Type:</p>
                    <p className="info-value">{reclamation.type}</p>
                  </div>
                  <div className="reclamation-description">
                    <p className="description-label">Description:</p>
                    <p className="description-content">{reclamation.description}</p>
                  </div>
                  {reclamation.reponse && (
                    <div className="reclamation-response">
                      <p className="response-label">Réponse:</p>
                      <p className="response-content">{reclamation.reponse}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Reclamation

