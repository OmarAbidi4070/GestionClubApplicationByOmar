"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Check, X, UserPlus, UserMinus, UserCog, Search, Filter, ChevronDown } from "lucide-react"
import "./MemberManagement.css"

const MemberManagement = () => {
  const [activeTab, setActiveTab] = useState("requests")
  const [requests, setRequests] = useState([])
  const [members, setMembers] = useState([])
  const [club, setClub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [newRole, setNewRole] = useState("")
  const [confirmAction, setConfirmAction] = useState(null)
  const navigate = useNavigate()

  // Available roles for club members
  const availableRoles = [
    "Membre",
    "Secrétaire",
    "Trésorier",
    "Vice-président",
    "Responsable événements",
    "Responsable communication",
    "Responsable technique",
    "Membre du bureau",
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const user = JSON.parse(localStorage.getItem("user"))

        if (!token || !user) {
          navigate("/login")
          return
        }

        // Fetch clubs where the user is the responsable
        const clubsResponse = await axios.get("http://localhost:5000/api/clubs", {
          headers: { "x-auth-token": token },
        })

        // Find the club where the user is the responsable
        const userClub = clubsResponse.data.find((c) => {
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
        setMembers(clubDetailsResponse.data.membres)

        // Fetch pending requests
        const demandesResponse = await axios.get("http://localhost:5000/api/demandes", {
          headers: { "x-auth-token": token },
        })

        const clubRequests = demandesResponse.data.filter((demande) => demande.club._id === userClub._id)

        setRequests(clubRequests)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Erreur lors du chargement des données")
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:5000/api/demandes/${requestId}`,
        { statut: "acceptée" },
        { headers: { "x-auth-token": token } },
      )

      // Update local state
      setRequests(requests.map((req) => (req._id === requestId ? { ...req, statut: "acceptée" } : req)))

      // Refresh members list
      if (club) {
        const clubDetailsResponse = await axios.get(`http://localhost:5000/api/clubs/${club._id}`, {
          headers: { "x-auth-token": token },
        })
        setMembers(clubDetailsResponse.data.membres)
      }

      setConfirmAction({ type: "success", message: "Demande acceptée avec succès" })
      setTimeout(() => setConfirmAction(null), 3000)
    } catch (err) {
      console.error("Error accepting request:", err)
      setConfirmAction({ type: "error", message: "Erreur lors de l'acceptation de la demande" })
      setTimeout(() => setConfirmAction(null), 3000)
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:5000/api/demandes/${requestId}`,
        { statut: "refusée" },
        { headers: { "x-auth-token": token } },
      )

      // Update local state
      setRequests(requests.map((req) => (req._id === requestId ? { ...req, statut: "refusée" } : req)))

      setConfirmAction({ type: "success", message: "Demande refusée" })
      setTimeout(() => setConfirmAction(null), 3000)
    } catch (err) {
      console.error("Error rejecting request:", err)
      setConfirmAction({ type: "error", message: "Erreur lors du refus de la demande" })
      setTimeout(() => setConfirmAction(null), 3000)
    }
  }

  const handleOpenRoleModal = (member) => {
    setSelectedMember(member)
    setNewRole(member.role)
    setShowRoleModal(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedMember || !newRole || !club) return

    try {
      const token = localStorage.getItem("token")

      // Create a copy of the current members array
      const updatedMembers = members.map((member) => {
        if (member.email === selectedMember.email) {
          return { ...member, role: newRole }
        }
        return member
      })

      // Update the club with the new members array
      await axios.put(
        `http://localhost:5000/api/clubs/${club._id}`,
        { activeMembers: JSON.stringify(updatedMembers) },
        {
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
        },
      )

      // Update local state
      setMembers(updatedMembers)
      setShowRoleModal(false)

      setConfirmAction({ type: "success", message: "Rôle mis à jour avec succès" })
      setTimeout(() => setConfirmAction(null), 3000)
    } catch (err) {
      console.error("Error updating role:", err)
      setConfirmAction({ type: "error", message: "Erreur lors de la mise à jour du rôle" })
      setTimeout(() => setConfirmAction(null), 3000)
    }
  }

  const handleRemoveMember = async (memberEmail) => {
    if (!club) return

    try {
      const token = localStorage.getItem("token")

      // Filter out the member to remove
      const updatedMembers = members.filter((member) => member.email !== memberEmail)

      // Update the club with the new members array
      await axios.put(
        `http://localhost:5000/api/clubs/${club._id}`,
        { activeMembers: JSON.stringify(updatedMembers) },
        {
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
        },
      )

      // Update local state
      setMembers(updatedMembers)

      setConfirmAction({ type: "success", message: "Membre retiré avec succès" })
      setTimeout(() => setConfirmAction(null), 3000)
    } catch (err) {
      console.error("Error removing member:", err)
      setConfirmAction({ type: "error", message: "Erreur lors du retrait du membre" })
      setTimeout(() => setConfirmAction(null), 3000)
    }
  }

  // Filter requests based on search term and status
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "all") return matchesSearch
    return matchesSearch && request.statut === filterStatus
  })

  // Filter members based on search term
  const filteredMembers = members.filter(
    (member) =>
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  if (error) return <div className="error-container">{error}</div>
  if (!club) return <div className="error-container">Aucun club trouvé</div>

  return (
    <div className="member-management-container">
      <div className="page-header">
        <h1>Gestion des Membres</h1>
        <p>Gérez les demandes d'adhésion et les membres de votre club</p>
      </div>

      {confirmAction && <div className={`action-notification ${confirmAction.type}`}>{confirmAction.message}</div>}

      <div className="tabs">
        <button className={`tab ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>
          <UserPlus size={18} />
          Demandes d'adhésion
          {requests.filter((r) => r.statut === "en_attente").length > 0 && (
            <span className="badge">{requests.filter((r) => r.statut === "en_attente").length}</span>
          )}
        </button>
        <button className={`tab ${activeTab === "members" ? "active" : ""}`} onClick={() => setActiveTab("members")}>
          <UserCog size={18} />
          Membres du club
          <span className="badge">{members.length}</span>
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={activeTab === "requests" ? "Rechercher dans les demandes..." : "Rechercher un membre..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === "requests" && (
          <div className="filter-dropdown">
            <button className="filter-btn">
              <Filter size={18} />
              Statut:{" "}
              {filterStatus === "all"
                ? "Tous"
                : filterStatus === "en_attente"
                  ? "En attente"
                  : filterStatus === "acceptée"
                    ? "Acceptée"
                    : "Refusée"}
              <ChevronDown size={16} />
            </button>
            <div className="dropdown-content">
              <div onClick={() => setFilterStatus("all")}>Tous</div>
              <div onClick={() => setFilterStatus("en_attente")}>En attente</div>
              <div onClick={() => setFilterStatus("acceptée")}>Acceptée</div>
              <div onClick={() => setFilterStatus("refusée")}>Refusée</div>
            </div>
          </div>
        )}
      </div>

      {activeTab === "requests" && (
        <div className="requests-container">
          {filteredRequests.length === 0 ? (
            <div className="empty-state">
              <UserPlus size={48} />
              <p>Aucune demande d'adhésion trouvée</p>
            </div>
          ) : (
            <div className="requests-list">
              {filteredRequests.map((request) => (
                <div key={request._id} className={`request-card ${request.statut}`}>
                  <div className="request-header">
                    <div className="student-info">
                      <div className="student-avatar">
                        {request.prenom.charAt(0)}
                        {request.nom.charAt(0)}
                      </div>
                      <div>
                        <h3>
                          {request.prenom} {request.nom}
                        </h3>
                        <p className="student-email">{request.etudiant.email}</p>
                      </div>
                    </div>
                    <div className="request-status">
                      <span className={`status-badge ${request.statut}`}>
                        {request.statut === "en_attente"
                          ? "En attente"
                          : request.statut === "acceptée"
                            ? "Acceptée"
                            : "Refusée"}
                      </span>
                      <p className="request-date">
                        Demande reçue le {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="request-details">
                    <div className="detail-row">
                      <span className="detail-label">Âge:</span>
                      <span className="detail-value">{request.age} ans</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Spécialité:</span>
                      <span className="detail-value">{request.specialite}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">ID Scolaire:</span>
                      <span className="detail-value">{request.idScolaire}</span>
                    </div>
                    <div className="detail-row skills">
                      <span className="detail-label">Compétences:</span>
                      <span className="detail-value">{request.skills}</span>
                    </div>
                  </div>

                  {request.statut === "en_attente" && (
                    <div className="request-actions">
                      <button className="accept-btn" onClick={() => handleAcceptRequest(request._id)}>
                        <Check size={16} />
                        Accepter
                      </button>
                      <button className="reject-btn" onClick={() => handleRejectRequest(request._id)}>
                        <X size={16} />
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div className="members-container">
          {filteredMembers.length === 0 ? (
            <div className="empty-state">
              <UserCog size={48} />
              <p>Aucun membre trouvé</p>
            </div>
          ) : (
            <div className="members-table-container">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Membre</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, index) => (
                    <tr key={index}>
                      <td className="member-cell">
                        <div className="member-avatar">{member.email.charAt(0).toUpperCase()}</div>
                        <div className="member-info">
                          <p className="member-email">{member.email}</p>
                        </div>
                      </td>
                      <td>
                        <span className="role-badge">{member.role}</span>
                      </td>
                      <td>
                        <div className="member-actions">
                          <button
                            className="edit-role-btn"
                            onClick={() => handleOpenRoleModal(member)}
                            disabled={member.role === "Créateur"}
                          >
                            <UserCog size={16} />
                            Modifier le rôle
                          </button>
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveMember(member.email)}
                            disabled={member.role === "Créateur"}
                          >
                            <UserMinus size={16} />
                            Retirer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for changing member role */}
      {showRoleModal && selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Modifier le rôle</h2>
              <button className="close-btn" onClick={() => setShowRoleModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Modifier le rôle de <strong>{selectedMember.email}</strong>
              </p>

              <div className="role-selector">
                <label htmlFor="role">Nouveau rôle:</label>
                <select id="role" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowRoleModal(false)}>
                Annuler
              </button>
              <button className="save-btn" onClick={handleUpdateRole}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberManagement

