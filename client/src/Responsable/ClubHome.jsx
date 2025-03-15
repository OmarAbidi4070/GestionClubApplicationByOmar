"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Calendar, Users, MessageSquare, BookOpenCheck, Activity } from "lucide-react"
import "./ClubHome.css"

const ClubHome = () => {
  const [club, setClub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingRequests: 0,
    upcomingEvents: 0,
    pendingReservations: 0,
    activeDiscussions: 0,
  })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const token = localStorage.getItem("token")
        const user = JSON.parse(localStorage.getItem("user"))

        if (!token || !user) {
          navigate("/login")
          return
        }

        // Fetch clubs where the user is the responsable
        const response = await axios.get("http://localhost:5000/api/clubs", {
          headers: { "x-auth-token": token },
        })

        // Find the club where the user is the responsable
        const userClub = response.data.find((c) => {
          // Vérifier si l'utilisateur est le responsable du club
          if (c.responsable && (c.responsable._id === user.id || c.responsable === user.id)) {
            return true
          }

          // Vérifier si le club est validé
          if (c.statutValidation === "validé") {
            // Vérifier si l'utilisateur est membre avec le rôle Créateur
            const isMemberCreator =
              c.membres &&
              c.membres.some(
                (m) => (m.userId === user.id || (m.userId && m.userId._id === user.id)) && m.role === "Créateur",
              )

            if (isMemberCreator) return true
          }

          return false
        })

        if (!userClub) {
          setError("Vous n'êtes responsable d'aucun club.")
          setLoading(false)
          return
        }

        // Fetch detailed club info
        const clubDetailsResponse = await axios.get(`http://localhost:5000/api/clubs/${userClub._id}`, {
          headers: { "x-auth-token": token },
        })

        setClub(clubDetailsResponse.data)

        // Fetch pending requests
        const demandesResponse = await axios.get("http://localhost:5000/api/demandes", {
          headers: { "x-auth-token": token },
        })

        const pendingRequests = demandesResponse.data.filter(
          (demande) => demande.club._id === userClub._id && demande.statut === "en_attente",
        ).length

        // Set stats
        setStats({
          totalMembers: clubDetailsResponse.data.membres.length,
          pendingRequests,
          upcomingEvents: 0, // This would come from an events API
          pendingReservations: 0, // This would come from a reservations API
          activeDiscussions: 0, // This would come from a messaging API
        })

        setLoading(false)
      } catch (err) {
        console.error("Error fetching club data:", err)
        setError("Erreur lors du chargement des données du club")
        setLoading(false)
      }
    }

    fetchClubData()
  }, [navigate])

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  if (error) return <div className="error-container">{error}</div>
  if (!club) return <div className="error-container">Aucun club trouvé</div>

  return (
    <div className="club-home-container">
      <div className="club-header">
        <div className="club-info">
          {club.logo ? (
            <img src={`http://localhost:5000/${club.logo}`} alt={`Logo ${club.nom}`} className="club-logo" />
          ) : (
            <div className="club-logo-placeholder">{club.nom.charAt(0)}</div>
          )}
          <div className="club-details">
            <h1>{club.nom}</h1>
            <p className="club-etablissement">{club.etablissement}</p>
            <p className="club-creation-date">Créé le {new Date(club.dateCreation).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="club-actions">
          <button className="edit-club-btn" onClick={() => navigate("/edit-club")}>
            Modifier le club
          </button>
        </div>
      </div>

      <div className="club-description">
        <h2>À propos du club</h2>
        <p>{club.description || "Aucune description disponible."}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate("/member-list")}>
          <div className="stat-icon members-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Membres</h3>
            <p className="stat-value">{stats.totalMembers}</p>
            <p className="stat-label">membres actifs</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate("/member-requests")}>
          <div className="stat-icon requests-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Demandes</h3>
            <p className="stat-value">{stats.pendingRequests}</p>
            <p className="stat-label">en attente</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate("/events")}>
          <div className="stat-icon events-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Événements</h3>
            <p className="stat-value">{stats.upcomingEvents}</p>
            <p className="stat-label">à venir</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate("/reservations")}>
          <div className="stat-icon reservations-icon">
            <BookOpenCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>Réservations</h3>
            <p className="stat-value">{stats.pendingReservations}</p>
            <p className="stat-label">en attente</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate("/messages")}>
          <div className="stat-icon messages-icon">
            <MessageSquare size={24} />
          </div>
          <div className="stat-content">
            <h3>Messagerie</h3>
            <p className="stat-value">{stats.activeDiscussions}</p>
            <p className="stat-label">discussions actives</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate("/club-activity")}>
          <div className="stat-icon activity-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>Activité</h3>
            <p className="stat-label">Voir l'activité récente</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Activité récente</h2>
        {club.membres.length > 0 ? (
          <div className="members-list">
            <h3>Derniers membres</h3>
            <div className="recent-members">
              {club.membres.slice(0, 5).map((membre, index) => (
                <div key={index} className="member-item">
                  <div className="member-avatar">{membre.email.charAt(0).toUpperCase()}</div>
                  <div className="member-info">
                    <p className="member-email">{membre.email}</p>
                    <p className="member-role">{membre.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="view-all-btn" onClick={() => navigate("/member-list")}>
              Voir tous les membres
            </button>
          </div>
        ) : (
          <p className="no-data">Aucun membre dans ce club pour le moment.</p>
        )}
      </div>
    </div>
  )
}

export default ClubHome

