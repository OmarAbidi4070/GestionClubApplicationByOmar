import React, { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Search, Filter, ChevronDown, Check, X, Eye, Edit, Trash2, Users, Calendar, MessageSquare, AlertTriangle, Info, Building } from 'lucide-react'
import "./ClubManagement.css"

const ClubManagement = () => {
  const [clubs, setClubs] = useState([])
  const [pendingClubs, setPendingClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("approved") // 'approved' or 'pending'
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const user = JSON.parse(localStorage.getItem("user"))

        if (!token || !user || user.poste !== "administrateur") {
          navigate("/login")
          return
        }

        // Fetch approved clubs
        const approvedClubsResponse = await axios.get("http://localhost:5000/api/clubs", {
          headers: { "x-auth-token": token },
        })

        // Filter approved clubs (statutValidation === 'validé')
        const approvedClubs = approvedClubsResponse.data.filter(
          club => club.statutValidation === 'validé'
        )

        // Fetch pending club requests
        const pendingClubsResponse = await axios.get("http://localhost:5000/api/clubs", {
          headers: { "x-auth-token": token },
        })

        // Filter pending clubs (statutValidation === 'en_attente')
        const pendingClubs = pendingClubsResponse.data.filter(
          club => club.statutValidation === 'en_attente'
        )

        setClubs(approvedClubs)
        setPendingClubs(pendingClubs)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching clubs:", err)
        setError("Erreur lors du chargement des clubs")
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleViewDetails = (club) => {
    setSelectedClub(club)
    setShowDetailsModal(true)
  }

  const handleApproveClub = async (clubId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(`http://localhost:5000/api/clubs/${clubId}/approve`, {}, {
        headers: { "x-auth-token": token },
      })

      // Update local state
      const approvedClub = pendingClubs.find(club => club._id === clubId)
      setPendingClubs(pendingClubs.filter(club => club._id !== clubId))
      setClubs([...clubs, { ...approvedClub, statutValidation: "validé" }])

      showNotification("Club approuvé avec succès")
    } catch (err) {
      console.error("Error approving club:", err)
      showNotification("Erreur lors de l'approbation du club", "error")
    }
  }

  const handleRejectClub = async (clubId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(`http://localhost:5000/api/clubs/${clubId}/reject`, {}, {
        headers: { "x-auth-token": token },
      })

      // Update local state
      setPendingClubs(pendingClubs.filter(club => club._id !== clubId))

      showNotification("Club rejeté avec succès")
    } catch (err) {
      console.error("Error rejecting club:", err)
      showNotification("Erreur lors du rejet du club", "error")
    }
  }

  const handleDeleteClub = async (clubId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/clubs/${clubId}`, {
        headers: { "x-auth-token": token },
      })

      // Update local state
      setClubs(clubs.filter(club => club._id !== clubId))
      setConfirmAction(null)

      showNotification("Club supprimé avec succès")
    } catch (err) {
      console.error("Error deleting club:", err)
      showNotification("Erreur lors de la suppression du club", "error")
    }
  }

  // Filter clubs based on search term and status
  const filteredClubs = clubs.filter(club => {
    const matchesSearch = 
      club.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.etablissement.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === "all") return matchesSearch
    return matchesSearch && club.statutValidation === (filterStatus === "active" ? "validé" : "refusé")
  })

  // Filter pending clubs based on search term
  const filteredPendingClubs = pendingClubs.filter(club => 
    club.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.etablissement.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  if (error) return <div className="error-container">{error}</div>

  return (
    <div className="club-management-container">
      <div className="page-header">
        <h1>Gestion des Clubs</h1>
        <p>Gérez les clubs et les demandes de création</p>
      </div>

      {notification && <div className={`notification ${notification.type}`}>{notification.message}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          <Building size={18} />
          Clubs Approuvés
          <span className="badge">{clubs.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <AlertTriangle size={18} />
          Demandes en Attente
          <span className="badge">{pendingClubs.length}</span>
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher un club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === "approved" && (
          <div className="filter-dropdown">
            <button className="filter-btn">
              <Filter size={18} />
              Statut: {filterStatus === "all" ? "Tous" : filterStatus === "active" ? "Actif" : "Inactif"}
              <ChevronDown size={16} />
            </button>
            <div className="dropdown-content">
              <div onClick={() => setFilterStatus("all")}>Tous</div>
              <div onClick={() => setFilterStatus("active")}>Actif</div>
              <div onClick={() => setFilterStatus("inactive")}>Inactif</div>
            </div>
          </div>
        )}
      </div>

      {activeTab === "approved" ? (
        <div className="clubs-table-container">
          {filteredClubs.length === 0 ? (
            <div className="empty-state">
              <Building size={48} />
              <p>Aucun club trouvé</p>
            </div>
          ) : (
            <table className="clubs-table">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Nom du Club</th>
                  <th>Établissement</th>
                  <th>Responsable</th>
                  <th>Membres</th>
                  <th>Date de Création</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClubs.map((club) => (
                  <tr key={club._id}>
                    <td>
                      {club.logo ? (
                        <img src={`http://localhost:5000/${club.logo}`} alt={`Logo ${club.nom}`} className="club-logo" />
                      ) : (
                        <div className="club-logo-placeholder">{club.nom.charAt(0)}</div>
                      )}
                    </td>
                    <td>{club.nom}</td>
                    <td>{club.etablissement}</td>
                    <td>{club.responsable?.email || "Non assigné"}</td>
                    <td>{club.membres?.length || 0}</td>
                    <td>{new Date(club.dateCreation).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${club.statutValidation === "validé" ? "active" : "inactive"}`}>
                        {club.statutValidation === "validé" ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <div className="club-actions">
                        <button
                          className="view-btn"
                          onClick={() => handleViewDetails(club)}
                          aria-label="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => navigate(`/admin/clubs/edit/${club._id}`)}
                          aria-label="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => setConfirmAction({ type: "delete", id: club._id })}
                          aria-label="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="pending-clubs-container">
          {filteredPendingClubs.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} />
              <p>Aucune demande de création en attente</p>
            </div>
          ) : (
            <div className="pending-clubs-grid">
              {filteredPendingClubs.map((club) => (
                <div key={club._id} className="pending-club-card">
                  <div className="pending-club-header">
                    {club.logo ? (
                      <img src={`http://localhost:5000/${club.logo}`} alt={`Logo ${club.nom}`} className="pending-club-logo" />
                    ) : (
                      <div className="pending-club-logo-placeholder">{club.nom.charAt(0)}</div>
                    )}
                    <div className="pending-club-info">
                      <h3>{club.nom}</h3>
                      <p>{club.etablissement}</p>
                    </div>
                  </div>
                  
                  <div className="pending-club-details">
                    <p className="pending-club-description">{club.description}</p>
                    <div className="pending-club-meta">
                      <div className="meta-item">
                        <Users size={16} />
                        <span>Membres: {club.membres?.length || 0}</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={16} />
                        <span>Demande reçue le: {new Date(club.dateCreation).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pending-club-actions">
                    <button className="view-details-btn" onClick={() => handleViewDetails(club)}>
                      <Info size={16} />
                      Détails
                    </button>
                    <button className="approve-btn" onClick={() => handleApproveClub(club._id)}>
                      <Check size={16} />
                      Approuver
                    </button>
                    <button className="reject-btn" onClick={() => handleRejectClub(club._id)}>
                      <X size={16} />
                      Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Club Details Modal */}
      {showDetailsModal && selectedClub && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content club-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails du Club</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            
            <div className="club-details-content">
              <div className="club-details-header">
                {selectedClub.logo ? (
                  <img 
                    src={`http://localhost:5000/${selectedClub.logo}`} 
                    alt={`Logo ${selectedClub.nom}`} 
                    className="club-details-logo" 
                  />
                ) : (
                  <div className="club-details-logo-placeholder">{selectedClub.nom.charAt(0)}</div>
                )}
                
                <div className="club-details-info">
                  <h3>{selectedClub.nom}</h3>
                  <p className="club-details-etablissement">{selectedClub.etablissement}</p>
                  <p className="club-details-date">
                    Créé le {new Date(selectedClub.dateCreation).toLocaleDateString()}
                  </p>
                  {selectedClub.statutValidation && (
                    <span className={`status-badge ${selectedClub.statutValidation === "validé" ? "active" : "inactive"}`}>
                      {selectedClub.statutValidation === "validé" ? "Actif" : 
                       selectedClub.statutValidation === "refusé" ? "Refusé" : "En attente"}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="club-details-section">
                <h4>Description</h4>
                <p>{selectedClub.description}</p>
              </div>
              
              <div className="club-details-section">
                <h4>Responsable</h4>
                <p>{selectedClub.responsable?.email || "Non assigné"}</p>
              </div>
              
              <div className="club-details-section">
                <h4>Membres ({selectedClub.membres?.length || 0})</h4>
                {selectedClub.membres && selectedClub.membres.length > 0 ? (
                  <div className="club-members-list">
                    {selectedClub.membres.slice(0, 5).map((membre, index) => (
                      <div key={index} className="club-member-item">
                        <div className="member-avatar">{membre.email.charAt(0).toUpperCase()}</div>
                        <div className="member-info">
                          <p className="member-email">{membre.email}</p>
                          <p className="member-role">{membre.role}</p>
                        </div>
                      </div>
                    ))}
                    {selectedClub.membres.length > 5 && (
                      <p className="more-members">+ {selectedClub.membres.length - 5} autres membres</p>
                    )}
                  </div>
                ) : (
                  <p>Aucun membre pour le moment</p>
                )}
              </div>
              
              <div className="club-details-section">
                <h4>Document de validation</h4>
                {selectedClub.validationDoc ? (
                  <a 
                    href={`http://localhost:5000/${selectedClub.validationDoc}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="validation-doc-link"
                  >
                    Voir le document
                  </a>
                ) : (
                  <p>Aucun document fourni</p>
                )}
              </div>
              
              <div className="modal-footer">
                {activeTab === "pending" ? (
                  <>
                    <button className="approve-btn" onClick={() => {
                      handleApproveClub(selectedClub._id);
                      setShowDetailsModal(false);
                    }}>
                      <Check size={16} />
                      Approuver
                    </button>
                    <button className="reject-btn" onClick={() => {
                      handleRejectClub(selectedClub._id);
                      setShowDetailsModal(false);
                    }}>
                      <X size={16} />
                      Rejeter
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit-btn" onClick={() => {
                      navigate(`/admin/clubs/edit/${selectedClub._id}`);
                      setShowDetailsModal(false);
                    }}>
                      <Edit size={16} />
                      Modifier
                    </button>
                    <button className="delete-btn" onClick={() => {
                      setConfirmAction({ type: "delete", id: selectedClub._id });
                      setShowDetailsModal(false);
                    }}>
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer ce club ? Cette action est irréversible.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setConfirmAction(null)}>
                Annuler
              </button>
              <button className="delete-btn" onClick={() => handleDeleteClub(confirmAction.id)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClubManagement