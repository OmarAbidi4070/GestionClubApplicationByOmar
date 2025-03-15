"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  BookOpenCheck,
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  ChevronDown,
  Package,
} from "lucide-react"
import "./ReservationsManagement.css"

const ReservationsManagement = () => {
  const [activeTab, setActiveTab] = useState("reservations")
  const [reservations, setReservations] = useState([])
  const [equipment, setEquipment] = useState([])
  const [club, setClub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [currentReservation, setCurrentReservation] = useState(null)
  const [currentEquipment, setCurrentEquipment] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()

  // Form state for reservations
  const [reservationForm, setReservationForm] = useState({
    titre: "",
    description: "",
    lieu: "",
    date: "",
    heureDebut: "",
    heureFin: "",
    equipements: [],
  })

  // Form state for equipment
  const [equipmentForm, setEquipmentForm] = useState({
    nom: "",
    description: "",
    quantite: "",
    etat: "disponible",
    image: null,
  })

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

        setClub(userClub)

        // Fetch reservations for this club
        const reservationsResponse = await axios.get(`http://localhost:5000/api/reservations/club/${userClub._id}`, {
          headers: { "x-auth-token": token },
        })

        setReservations(reservationsResponse.data)

        // Fetch equipment for this club
        const equipmentResponse = await axios.get(`http://localhost:5000/api/equipements/club/${userClub._id}`, {
          headers: { "x-auth-token": token },
        })

        setEquipment(equipmentResponse.data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Erreur lors du chargement des données")
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleReservationInputChange = (e) => {
    const { name, value } = e.target
    setReservationForm({
      ...reservationForm,
      [name]: value,
    })
  }

  const handleEquipmentInputChange = (e) => {
    const { name, value } = e.target
    setEquipmentForm({
      ...equipmentForm,
      [name]: value,
    })
  }

  const handleEquipmentImageChange = (e) => {
    setEquipmentForm({
      ...equipmentForm,
      image: e.target.files[0],
    })
  }

  const handleEquipmentSelection = (e) => {
    const selectedEquipmentIds = Array.from(e.target.selectedOptions, (option) => option.value)
    setReservationForm({
      ...reservationForm,
      equipements: selectedEquipmentIds,
    })
  }

  const resetReservationForm = () => {
    setReservationForm({
      titre: "",
      description: "",
      lieu: "",
      date: "",
      heureDebut: "",
      heureFin: "",
      equipements: [],
    })
    setCurrentReservation(null)
  }

  const resetEquipmentForm = () => {
    setEquipmentForm({
      nom: "",
      description: "",
      quantite: "",
      etat: "disponible",
      image: null,
    })
    setCurrentEquipment(null)
  }

  const handleOpenReservationModal = (reservation = null) => {
    if (reservation) {
      // Format date for the input field (YYYY-MM-DD)
      const reservationDate = new Date(reservation.date)
      const formattedDate = reservationDate.toISOString().split("T")[0]

      setReservationForm({
        titre: reservation.titre,
        description: reservation.description,
        lieu: reservation.lieu,
        date: formattedDate,
        heureDebut: reservation.heureDebut,
        heureFin: reservation.heureFin,
        equipements: reservation.equipements.map((eq) => eq._id),
      })
      setCurrentReservation(reservation)
    } else {
      resetReservationForm()
    }
    setShowReservationModal(true)
  }

  const handleOpenEquipmentModal = (equipment = null) => {
    if (equipment) {
      setEquipmentForm({
        nom: equipment.nom,
        description: equipment.description,
        quantite: equipment.quantite,
        etat: equipment.etat,
        image: null, // We can't set the file input value
      })
      setCurrentEquipment(equipment)
    } else {
      resetEquipmentForm()
    }
    setShowEquipmentModal(true)
  }

  const handleSubmitReservation = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")

      const reservationData = {
        ...reservationForm,
        club: club._id,
      }

      let response

      if (currentReservation) {
        // Update existing reservation
        response = await axios.put(
          `http://localhost:5000/api/reservations/${currentReservation._id}`,
          reservationData,
          {
            headers: {
              "x-auth-token": token,
              "Content-Type": "application/json",
            },
          },
        )

        // Update local state
        setReservations(reservations.map((res) => (res._id === currentReservation._id ? response.data : res)))

        showNotification("Réservation mise à jour avec succès")
      } else {
        // Create new reservation
        response = await axios.post("http://localhost:5000/api/reservations", reservationData, {
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
        })

        // Update local state
        setReservations([...reservations, response.data])

        showNotification("Réservation créée avec succès")
      }

      setShowReservationModal(false)
      resetReservationForm()
    } catch (err) {
      console.error("Error saving reservation:", err)
      showNotification("Erreur lors de l'enregistrement de la réservation", "error")
    }
  }

  const handleSubmitEquipment = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")

      // Create FormData object for file upload
      const data = new FormData()
      data.append("nom", equipmentForm.nom)
      data.append("description", equipmentForm.description)
      data.append("quantite", equipmentForm.quantite)
      data.append("etat", equipmentForm.etat)
      data.append("club", club._id)

      if (equipmentForm.image) {
        data.append("image", equipmentForm.image)
      }

      let response

      if (currentEquipment) {
        // Update existing equipment
        response = await axios.put(`http://localhost:5000/api/equipements/${currentEquipment._id}`, data, {
          headers: {
            "x-auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        })

        // Update local state
        setEquipment(equipment.map((eq) => (eq._id === currentEquipment._id ? response.data : eq)))

        showNotification("Équipement mis à jour avec succès")
      } else {
        // Create new equipment
        response = await axios.post("http://localhost:5000/api/equipements", data, {
          headers: {
            "x-auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        })

        // Update local state
        setEquipment([...equipment, response.data])

        showNotification("Équipement ajouté avec succès")
      }

      setShowEquipmentModal(false)
      resetEquipmentForm()
    } catch (err) {
      console.error("Error saving equipment:", err)
      showNotification("Erreur lors de l'enregistrement de l'équipement", "error")
    }
  }

  const handleDeleteReservation = async (reservationId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/reservations/${reservationId}`, {
        headers: { "x-auth-token": token },
      })

      // Update local state
      setReservations(reservations.filter((res) => res._id !== reservationId))
      setConfirmDelete(null)

      showNotification("Réservation supprimée avec succès")
    } catch (err) {
      console.error("Error deleting reservation:", err)
      showNotification("Erreur lors de la suppression de la réservation", "error")
    }
  }

  const handleDeleteEquipment = async (equipmentId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/equipements/${equipmentId}`, {
        headers: { "x-auth-token": token },
      })

      // Update local state
      setEquipment(equipment.filter((eq) => eq._id !== equipmentId))
      setConfirmDelete(null)

      showNotification("Équipement supprimé avec succès")
    } catch (err) {
      console.error("Error deleting equipment:", err)
      showNotification("Erreur lors de la suppression de l'équipement", "error")
    }
  }

  const handleUpdateReservationStatus = async (reservationId, newStatus) => {
    try {
      const token = localStorage.getItem("token")

      await axios.put(
        `http://localhost:5000/api/reservations/${reservationId}/status`,
        { statut: newStatus },
        {
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
        },
      )

      // Update local state
      setReservations(reservations.map((res) => (res._id === reservationId ? { ...res, statut: newStatus } : res)))

      showNotification(`Réservation ${newStatus === "approuvée" ? "approuvée" : "refusée"} avec succès`)
    } catch (err) {
      console.error("Error updating reservation status:", err)
      showNotification("Erreur lors de la mise à jour du statut", "error")
    }
  }

  // Filter reservations based on search term and status
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.lieu.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "all") return matchesSearch
    return matchesSearch && reservation.statut === filterStatus
  })

  // Filter equipment based on search term
  const filteredEquipment = equipment.filter(
    (eq) =>
      eq.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.description.toLowerCase().includes(searchTerm.toLowerCase()),
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
    <div className="reservations-container">
      <div className="page-header">
        <h1>Gestion des Réservations</h1>
        <p>Gérez les réservations et l'équipement de votre club</p>
      </div>

      {notification && <div className={`notification ${notification.type}`}>{notification.message}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === "reservations" ? "active" : ""}`}
          onClick={() => setActiveTab("reservations")}
        >
          <BookOpenCheck size={18} />
          Réservations
        </button>
        <button
          className={`tab ${activeTab === "equipment" ? "active" : ""}`}
          onClick={() => setActiveTab("equipment")}
        >
          <Package size={18} />
          Équipement
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={activeTab === "reservations" ? "Rechercher une réservation..." : "Rechercher un équipement..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === "reservations" && (
          <div className="filter-dropdown">
            <button className="filter-btn">
              <Filter size={18} />
              Statut:{" "}
              {filterStatus === "all"
                ? "Tous"
                : filterStatus === "en_attente"
                  ? "En attente"
                  : filterStatus === "approuvée"
                    ? "Approuvée"
                    : "Refusée"}
              <ChevronDown size={16} />
            </button>
            <div className="dropdown-content">
              <div onClick={() => setFilterStatus("all")}>Tous</div>
              <div onClick={() => setFilterStatus("en_attente")}>En attente</div>
              <div onClick={() => setFilterStatus("approuvée")}>Approuvée</div>
              <div onClick={() => setFilterStatus("refusée")}>Refusée</div>
            </div>
          </div>
        )}

        <button
          className="add-btn"
          onClick={() => (activeTab === "reservations" ? handleOpenReservationModal() : handleOpenEquipmentModal())}
        >
          <Plus size={16} />
          {activeTab === "reservations" ? "Nouvelle réservation" : "Nouvel équipement"}
        </button>
      </div>

      {activeTab === "reservations" && (
        <div className="reservations-list">
          {filteredReservations.length === 0 ? (
            <div className="empty-state">
              <BookOpenCheck size={48} />
              <p>Aucune réservation trouvée</p>
              <button className="add-first-btn" onClick={() => handleOpenReservationModal()}>
                Créer votre première réservation
              </button>
            </div>
          ) : (
            filteredReservations.map((reservation) => (
              <div key={reservation._id} className={`reservation-card ${reservation.statut}`}>
                <div className="reservation-header">
                  <h3>{reservation.titre}</h3>
                  <span className={`status-badge ${reservation.statut}`}>
                    {reservation.statut === "en_attente"
                      ? "En attente"
                      : reservation.statut === "approuvée"
                        ? "Approuvée"
                        : "Refusée"}
                  </span>
                </div>

                <div className="reservation-details">
                  <div className="detail">
                    <Calendar size={16} />
                    <span>{new Date(reservation.date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail">
                    <Clock size={16} />
                    <span>
                      {reservation.heureDebut} - {reservation.heureFin}
                    </span>
                  </div>
                  <div className="detail">
                    <MapPin size={16} />
                    <span>{reservation.lieu}</span>
                  </div>
                  <div className="detail">
                    <User size={16} />
                    <span>Réservé par: {reservation.createdBy?.email || "Utilisateur inconnu"}</span>
                  </div>
                </div>

                <p className="reservation-description">{reservation.description}</p>

                {reservation.equipements && reservation.equipements.length > 0 && (
                  <div className="reservation-equipment">
                    <h4>Équipement réservé:</h4>
                    <div className="equipment-list">
                      {reservation.equipements.map((eq) => (
                        <div key={eq._id} className="equipment-item">
                          {eq.nom} ({eq.quantite} disponible{eq.quantite > 1 ? "s" : ""})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="reservation-actions">
                  {reservation.statut === "en_attente" && (
                    <>
                      <button
                        className="approve-btn"
                        onClick={() => handleUpdateReservationStatus(reservation._id, "approuvée")}
                      >
                        <Check size={16} />
                        Approuver
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleUpdateReservationStatus(reservation._id, "refusée")}
                      >
                        <X size={16} />
                        Refuser
                      </button>
                    </>
                  )}
                  <button className="edit-btn" onClick={() => handleOpenReservationModal(reservation)}>
                    <Edit size={16} />
                    Modifier
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => setConfirmDelete({ type: "reservation", id: reservation._id })}
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "equipment" && (
        <div className="equipment-grid">
          {filteredEquipment.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <p>Aucun équipement trouvé</p>
              <button className="add-first-btn" onClick={() => handleOpenEquipmentModal()}>
                Ajouter votre premier équipement
              </button>
            </div>
          ) : (
            filteredEquipment.map((eq) => (
              <div key={eq._id} className="equipment-card">
                <div className="equipment-image">
                  {eq.image ? (
                    <img src={`http://localhost:5000/${eq.image}`} alt={eq.nom} />
                  ) : (
                    <div className="equipment-image-placeholder">
                      <Package size={32} />
                    </div>
                  )}
                  <span className={`equipment-status ${eq.etat}`}>
                    {eq.etat === "disponible" ? "Disponible" : "Indisponible"}
                  </span>
                </div>
                <div className="equipment-content">
                  <h3>{eq.nom}</h3>
                  <p className="equipment-description">{eq.description}</p>
                  <div className="equipment-quantity">
                    Quantité: <span>{eq.quantite}</span>
                  </div>
                </div>
                <div className="equipment-actions">
                  <button className="edit-btn" onClick={() => handleOpenEquipmentModal(eq)}>
                    <Edit size={16} />
                  </button>
                  <button className="delete-btn" onClick={() => setConfirmDelete({ type: "equipment", id: eq._id })}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reservation Form Modal */}
      {showReservationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{currentReservation ? "Modifier la réservation" : "Nouvelle réservation"}</h2>
              <button className="close-btn" onClick={() => setShowReservationModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitReservation} className="reservation-form">
              <div className="form-group">
                <label htmlFor="titre">Titre *</label>
                <input
                  type="text"
                  id="titre"
                  name="titre"
                  value={reservationForm.titre}
                  onChange={handleReservationInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={reservationForm.description}
                  onChange={handleReservationInputChange}
                  required
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={reservationForm.date}
                    onChange={handleReservationInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lieu">Lieu *</label>
                  <input
                    type="text"
                    id="lieu"
                    name="lieu"
                    value={reservationForm.lieu}
                    onChange={handleReservationInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="heureDebut">Heure de début *</label>
                  <input
                    type="time"
                    id="heureDebut"
                    name="heureDebut"
                    value={reservationForm.heureDebut}
                    onChange={handleReservationInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="heureFin">Heure de fin *</label>
                  <input
                    type="time"
                    id="heureFin"
                    name="heureFin"
                    value={reservationForm.heureFin}
                    onChange={handleReservationInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="equipements">Équipements nécessaires</label>
                <select
                  id="equipements"
                  name="equipements"
                  multiple
                  value={reservationForm.equipements}
                  onChange={handleEquipmentSelection}
                  className="equipment-select"
                >
                  {equipment
                    .filter((eq) => eq.etat === "disponible")
                    .map((eq) => (
                      <option key={eq._id} value={eq._id}>
                        {eq.nom} ({eq.quantite} disponible{eq.quantite > 1 ? "s" : ""})
                      </option>
                    ))}
                </select>
                <p className="form-help">Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs équipements</p>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowReservationModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="save-btn">
                  {currentReservation ? "Mettre à jour" : "Créer la réservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Form Modal */}
      {showEquipmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{currentEquipment ? "Modifier l'équipement" : "Nouvel équipement"}</h2>
              <button className="close-btn" onClick={() => setShowEquipmentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitEquipment} className="equipment-form">
              <div className="form-group">
                <label htmlFor="nom">Nom de l'équipement *</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={equipmentForm.nom}
                  onChange={handleEquipmentInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={equipmentForm.description}
                  onChange={handleEquipmentInputChange}
                  required
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantite">Quantité disponible *</label>
                  <input
                    type="number"
                    id="quantite"
                    name="quantite"
                    value={equipmentForm.quantite}
                    onChange={handleEquipmentInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="etat">État *</label>
                  <select
                    id="etat"
                    name="etat"
                    value={equipmentForm.etat}
                    onChange={handleEquipmentInputChange}
                    required
                  >
                    <option value="disponible">Disponible</option>
                    <option value="indisponible">Indisponible</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image">Image de l'équipement</label>
                <input type="file" id="image" name="image" onChange={handleEquipmentImageChange} accept="image/*" />
                <p className="form-help">Format recommandé: JPG ou PNG, max 2MB</p>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEquipmentModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="save-btn">
                  {currentEquipment ? "Mettre à jour" : "Ajouter l'équipement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirmer la suppression</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer{" "}
              {confirmDelete.type === "reservation" ? "cette réservation" : "cet équipement"} ? Cette action est
              irréversible.
            </p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setConfirmDelete(null)}>
                Annuler
              </button>
              <button
                className="delete-btn"
                onClick={() => {
                  if (confirmDelete.type === "reservation") {
                    handleDeleteReservation(confirmDelete.id)
                  } else {
                    handleDeleteEquipment(confirmDelete.id)
                  }
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReservationsManagement