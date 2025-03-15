"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Star, User } from "lucide-react"
import "./temoignage.css"

const Temoignage = () => {
  const [temoignages, setTemoignages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    opinion: "",
    rating: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // Récupérer la liste des témoignages
    fetchTemoignages()
  }, [])

  const fetchTemoignages = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/api/temoignages", {
        headers: { "x-auth-token": token },
      })
      setTemoignages(response.data)
      setLoading(false)
    } catch (err) {
      setError("Erreur lors de la récupération des témoignages")
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

  const handleRatingClick = (rating) => {
    setFormData({
      ...formData,
      rating,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.rating === 0) {
      alert("Veuillez sélectionner une note")
      return
    }

    if (formData.opinion.trim() === "") {
      alert("Veuillez saisir votre opinion")
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:5000/api/temoignages",
        {
          ...formData,
          nom: user.nom,
          prenom: user.prenom,
        },
        {
          headers: { "x-auth-token": token },
        },
      )

      // Réinitialiser le formulaire
      setFormData({
        opinion: "",
        rating: 0,
      })

      // Afficher un message de succès
      setSuccessMessage("Votre témoignage a été envoyé avec succès !")
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      // Rafraîchir la liste des témoignages
      fetchTemoignages()
      setSubmitting(false)
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi du témoignage")
      setSubmitting(false)
      console.error("Erreur:", err)
    }
  }

  // Fonction pour afficher les étoiles de notation
  const renderRatingStars = (rating, interactive = false) => {
    const stars = []
    for (let i = 1; i <= 7; i++) {
      stars.push(
        <Star
          key={i}
          size={interactive ? 24 : 16}
          className={`star ${i <= rating ? "filled" : ""} ${interactive ? "interactive" : ""}`}
          onClick={interactive ? () => handleRatingClick(i) : undefined}
        />,
      )
    }
    return <div className="stars-container">{stars}</div>
  }

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("fr-FR", options)
  }

  if (loading && temoignages.length === 0) return <div className="loading">Chargement des témoignages...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="temoignage-container">
      <h1 className="page-title">Témoignages</h1>
      <p className="page-description">
        Partagez votre expérience et découvrez ce que les autres étudiants pensent des clubs universitaires.
      </p>

      {/* Formulaire de témoignage */}
      <div className="temoignage-form-container">
        <h2>Partagez votre témoignage</h2>
        <form onSubmit={handleSubmit} className="temoignage-form">
          <div className="form-group">
            <label htmlFor="rating">Votre note (sur 7 étoiles)</label>
            {renderRatingStars(formData.rating, true)}
          </div>

          <div className="form-group">
            <label htmlFor="opinion">Votre opinion</label>
            <textarea
              id="opinion"
              name="opinion"
              value={formData.opinion}
              onChange={handleChange}
              placeholder="Partagez votre expérience avec les clubs universitaires..."
              required
            />
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? "Envoi en cours..." : "Envoyer mon témoignage"}
          </button>
        </form>
      </div>

      {/* Liste des témoignages */}
      <div className="temoignages-list">
        <h2>Témoignages des étudiants</h2>
        {temoignages.length === 0 ? (
          <div className="no-temoignages">
            Aucun témoignage pour le moment. Soyez le premier à partager votre expérience !
          </div>
        ) : (
          temoignages.map((temoignage) => (
            <div key={temoignage._id} className="temoignage-card">
              <div className="temoignage-header">
                <div className="user-info">
                  <div className="user-avatar">
                    <User size={24} />
                  </div>
                  <div>
                    <h3>
                      {temoignage.nom} {temoignage.prenom}
                    </h3>
                    <p className="temoignage-date">{formatDate(temoignage.createdAt)}</p>
                  </div>
                </div>
                <div className="temoignage-rating">{renderRatingStars(temoignage.rating)}</div>
              </div>
              <div className="temoignage-content">
                <p>{temoignage.opinion}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Temoignage

