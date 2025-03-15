"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  X,
  Video,
  LinkIcon,
} from "lucide-react"
import "./EventsPlanning.css"

const EventsPlanning = () => {
  const [events, setEvents] = useState([])
  const [club, setClub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState("calendar") // 'calendar' or 'list'
  const [searchTerm, setSearchTerm] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    lieu: "",
    date: "",
    heureDebut: "",
    heureFin: "",
    capaciteMax: "",
    type: "présentiel", // 'présentiel' or 'en ligne'
    lienVisio: "",
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

        // Fetch events for this club
        const eventsResponse = await axios.get(`http://localhost:5000/api/events/club/${userClub._id}`, {
          headers: { "x-auth-token": token },
        })

        setEvents(eventsResponse.data)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    })
  }

  const resetForm = () => {
    setFormData({
      titre: "",
      description: "",
      lieu: "",
      date: "",
      heureDebut: "",
      heureFin: "",
      capaciteMax: "",
      type: "présentiel",
      lienVisio: "",
      image: null,
    })
    setCurrentEvent(null)
  }

  const handleOpenModal = (event = null) => {
    if (event) {
      // Format date for the input field (YYYY-MM-DD)
      const eventDate = new Date(event.date)
      const formattedDate = eventDate.toISOString().split("T")[0]

      setFormData({
        titre: event.titre,
        description: event.description,
        lieu: event.lieu,
        date: formattedDate,
        heureDebut: event.heureDebut,
        heureFin: event.heureFin,
        capaciteMax: event.capaciteMax,
        type: event.type,
        lienVisio: event.lienVisio || "",
        image: null, // We can't set the file input value
      })
      setCurrentEvent(event)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")

      // Create FormData object for file upload
      const data = new FormData()
      data.append("titre", formData.titre)
      data.append("description", formData.description)
      data.append("lieu", formData.lieu)
      data.append("date", formData.date)
      data.append("heureDebut", formData.heureDebut)
      data.append("heureFin", formData.heureFin)
      data.append("capaciteMax", formData.capaciteMax)
      data.append("type", formData.type)
      data.append("club", club._id)

      if (formData.type === "en ligne" && formData.lienVisio) {
        data.append("lienVisio", formData.lienVisio)
      }

      if (formData.image) {
        data.append("image", formData.image)
      }

      let response

      if (currentEvent) {
        // Update existing event
        response = await axios.put(`http://localhost:5000/api/events/${currentEvent._id}`, data, {
          headers: {
            "x-auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        })

        // Update local state
        setEvents(events.map((event) => (event._id === currentEvent._id ? response.data : event)))
        showNotification("Événement mis à jour avec succès")
      } else {
        // Create new event
        response = await axios.post("http://localhost:5000/api/events", data, {
          headers: {
            "x-auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        })

        // Update local state
        setEvents([...events, response.data])
        showNotification("Événement créé avec succès")
      }

      setShowModal(false)
      resetForm()
    } catch (err) {
      console.error("Error saving event:", err)
      showNotification("Erreur lors de l'enregistrement de l'événement", "error")
    }
  }

  const handleDeleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/events/${eventId}`, {
        headers: { "x-auth-token": token },
      })

      // Update local state
      setEvents(events.filter((event) => event._id !== eventId))
      setConfirmDelete(null)
      showNotification("Événement supprimé avec succès")
    } catch (err) {
      console.error("Error deleting event:", err)
      showNotification("Erreur lors de la suppression de l'événement", "error")
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Calendar helpers
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Adjust for Sunday as first day (0)
    const startDay = firstDay === 0 ? 6 : firstDay - 1

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split("T")[0]

      // Find events for this day
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year
      })

      days.push(
        <div key={day} className={`calendar-day ${dayEvents.length > 0 ? "has-events" : ""}`}>
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.map((event) => (
              <div key={event._id} className="calendar-event" onClick={() => handleOpenModal(event)}>
                <div className="event-time">{event.heureDebut}</div>
                <div className="event-title">{event.titre}</div>
              </div>
            ))}
            {dayEvents.length === 0 && (
              <div
                className="add-event-button"
                onClick={() => {
                  resetForm()
                  setFormData({
                    ...formData,
                    date: dateString,
                  })
                  setShowModal(true)
                }}
              >
                <Plus size={16} />
              </div>
            )}
          </div>
        </div>,
      )
    }

    return days
  }

  // Filter events for list view
  const filteredEvents = events.filter(
    (event) =>
      event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.lieu.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Group events by month for list view
  const groupedEvents = sortedEvents.reduce((groups, event) => {
    const date = new Date(event.date)
    const monthYear = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`

    if (!groups[monthYear]) {
      groups[monthYear] = []
    }

    groups[monthYear].push(event)
    return groups
  }, {})

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  if (error) return <div className="error-container">{error}</div>

  return (
    <div className="events-planning-container">
      <div className="page-header">
        <h1>Planning des Événements</h1>
        <p>Gérez les événements de votre club</p>
      </div>

      {notification && <div className={`notification ${notification.type}`}>{notification.message}</div>}

      <div className="events-actions">
        <div className="view-toggle">
          <button className={`view-button ${view === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>
            <CalendarIcon size={16} />
            Calendrier
          </button>
          <button className={`view-button ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
            <Info size={16} />
            Liste
          </button>
        </div>

        <button className="add-event-btn" onClick={() => handleOpenModal()}>
          <Plus size={16} />
          Nouvel événement
        </button>
      </div>

      {view === "calendar" ? (
        <div className="calendar-view">
          <div className="calendar-header">
            <button className="month-nav-btn" onClick={handlePrevMonth}>
              <ChevronLeft size={20} />
            </button>
            <h2 className="current-month">
              {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
            </h2>
            <button className="month-nav-btn" onClick={handleNextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar-days-header">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div>Sam</div>
            <div>Dim</div>
          </div>

          <div className="calendar-grid">{renderCalendar()}</div>
        </div>
      ) : (
        <div className="list-view">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {Object.keys(groupedEvents).length === 0 ? (
            <div className="empty-state">
              <CalendarIcon size={48} />
              <p>Aucun événement trouvé</p>
              <button className="add-first-event-btn" onClick={() => handleOpenModal()}>
                Créer votre premier événement
              </button>
            </div>
          ) : (
            Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
              <div key={monthYear} className="events-month-group">
                <h3 className="month-heading">{monthYear}</h3>
                <div className="events-list">
                  {monthEvents.map((event) => (
                    <div key={event._id} className="event-card">
                      <div className="event-image">
                        {event.image ? (
                          <img src={`http://localhost:5000/${event.image}`} alt={event.titre} />
                        ) : (
                          <div className="event-image-placeholder">
                            {event.type === "en ligne" ? <Video size={32} /> : <CalendarIcon size={32} />}
                          </div>
                        )}
                        <span className={`event-type ${event.type}`}>
                          {event.type === "en ligne" ? "En ligne" : "Présentiel"}
                        </span>
                      </div>
                      <div className="event-content">
                        <h3 className="event-title">{event.titre}</h3>
                        <div className="event-details">
                          <div className="event-detail">
                            <CalendarIcon size={16} />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="event-detail">
                            <Clock size={16} />
                            <span>
                              {event.heureDebut} - {event.heureFin}
                            </span>
                          </div>
                          <div className="event-detail">
                            {event.type === "en ligne" ? (
                              <>
                                <LinkIcon size={16} />
                                <span>
                                  <a
                                    href={event.lienVisio}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="visio-link"
                                  >
                                    Lien de visioconférence
                                  </a>
                                </span>
                              </>
                            ) : (
                              <>
                                <MapPin size={16} />
                                <span>{event.lieu}</span>
                              </>
                            )}
                          </div>
                          <div className="event-detail">
                            <Users size={16} />
                            <span>Capacité: {event.capaciteMax} personnes</span>
                          </div>
                        </div>
                        <p className="event-description">{event.description}</p>
                      </div>
                      <div className="event-actions">
                        <button className="edit-event-btn" onClick={() => handleOpenModal(event)} aria-label="Modifier">
                          <Edit size={16} />
                        </button>
                        <button
                          className="delete-event-btn"
                          onClick={() => setConfirmDelete(event._id)}
                          aria-label="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentEvent ? "Modifier l'événement" : "Nouvel événement"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-group">
                <label htmlFor="titre">Titre de l'événement *</label>
                <input
                  type="text"
                  id="titre"
                  name="titre"
                  value={formData.titre}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
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
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">Type d'événement *</label>
                  <select id="type" name="type" value={formData.type} onChange={handleInputChange} required>
                    <option value="présentiel">Présentiel</option>
                    <option value="en ligne">En ligne</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="heureDebut">Heure de début *</label>
                  <input
                    type="time"
                    id="heureDebut"
                    name="heureDebut"
                    value={formData.heureDebut}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="heureFin">Heure de fin *</label>
                  <input
                    type="time"
                    id="heureFin"
                    name="heureFin"
                    value={formData.heureFin}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {formData.type === "présentiel" ? (
                <div className="form-group">
                  <label htmlFor="lieu">Lieu *</label>
                  <input
                    type="text"
                    id="lieu"
                    name="lieu"
                    value={formData.lieu}
                    onChange={handleInputChange}
                    required={formData.type === "présentiel"}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="lienVisio">Lien de visioconférence *</label>
                  <input
                    type="url"
                    id="lienVisio"
                    name="lienVisio"
                    value={formData.lienVisio}
                    onChange={handleInputChange}
                    required={formData.type === "en ligne"}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="capaciteMax">Capacité maximale *</label>
                <input
                  type="number"
                  id="capaciteMax"
                  name="capaciteMax"
                  value={formData.capaciteMax}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Image de l'événement</label>
                <input type="file" id="image" name="image" onChange={handleImageChange} accept="image/*" />
                <p className="form-help">Format recommandé: JPG ou PNG, max 2MB</p>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="save-btn">
                  {currentEvent ? "Mettre à jour" : "Créer l'événement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setConfirmDelete(null)}>
                Annuler
              </button>
              <button className="delete-btn" onClick={() => handleDeleteEvent(confirmDelete)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventsPlanning

