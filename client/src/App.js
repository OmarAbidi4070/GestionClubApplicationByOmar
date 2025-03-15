import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar"
import NavbarStudent from "./Student/NavbarStudent"
import NavbarRes from "./Responsable/NavbarRes"
import NavbarAdmin from "./Admin/NavbarAdmin"

import Inscription from "./components/Inscription"
import Login from "./components/Login"
import CreateClub from "./Responsable/CreateClub"
import Dashboard from "./components/Dashboard"
import ProtectedRoute from "./components/ProtectedRoute"
import JoinClub from "./Student/JoinClub"
import "./App.css"
import UserManagement from "./components/UserManagement"

// Student components
import Temoignage from "./Student/Temoignage"
import Reclamation from "./Student/Reclamation"

// Responsable components
import ClubHome from "./Responsable/ClubHome"
import MemberManagement from "./Responsable/MemberManagement"
import EventsPlanning from "./Responsable/EventsPlanning"
import ReservationsManagement from "./Responsable/ReservationsManagement"

// Admin components
import AdminDashboard from "./Admin/AdminDashboard"
import ClubManagement from "./Admin/ClubManagement"

// Composant pour gérer l'affichage conditionnel de la navbar
const NavbarManager = () => {
  const location = useLocation()
  const userRole = getUserRole()

  // Pages publiques qui utilisent PublicNavbar
  const publicRoutes = ["/login", "/inscription"]

  // Vérifier si la route actuelle est une route publique
  const isPublicRoute = publicRoutes.includes(location.pathname)
  
  // Vérifier si la route actuelle est une route admin
  const isAdminRoute = location.pathname.startsWith("/admin")

  if (isPublicRoute) {
    return <Navbar />
  } else if (isAdminRoute && userRole === "administrateur") {
    return <NavbarAdmin />
  } else if (userRole === "etudiant") {
    return <NavbarStudent />
  } else if (userRole === "responsable") {
    return <NavbarRes />
  } else {
    return <Navbar />
  }
}

// Fonction pour récupérer le rôle de l'utilisateur
const getUserRole = () => {
  const user = localStorage.getItem("user")
  if (user) {
    try {
      return JSON.parse(user).poste
    } catch (error) {
      console.error("Error parsing user from localStorage:", error)
      return null
    }
  }
  return null
}

function App() {
  return (
    <Router>
      <div className="App">
        <NavbarManager />

        <Routes>
          {/* Public routes */}
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes for all authenticated users */}
          <Route element={<ProtectedRoute allowedRoles={["administrateur", "etudiant", "responsable"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Protected routes only for responsable */}
          <Route element={<ProtectedRoute allowedRoles={["responsable"]} />}>
            <Route path="/create-club" element={<CreateClub />} />
            <Route path="/club-home" element={<ClubHome />} />
            <Route path="/member-requests" element={<MemberManagement />} />
            <Route path="/member-list" element={<MemberManagement />} />
            <Route path="/member-roles" element={<MemberManagement />} />
            <Route path="/events" element={<EventsPlanning />} />
            <Route path="/reservations" element={<ReservationsManagement />} />
            <Route path="/messages" element={<div className="placeholder-page">Messagerie en construction</div>} />
            <Route path="/edit-club" element={<div className="placeholder-page">Édition du club en construction</div>} />
            <Route path="/club-activity" element={<div className="placeholder-page">Activité du club en construction</div>} />
          </Route>

          {/* Protected routes only for administrateur */}
          <Route element={<ProtectedRoute allowedRoles={["administrateur"]} />}>
            <Route path="/users" element={<UserManagement />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/clubs" element={<ClubManagement />} />
            <Route path="/admin/club-requests" element={<ClubManagement />} />
            <Route path="/admin/club-stats" element={<div className="placeholder-page">Statistiques des clubs en construction</div>} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/roles" element={<div className="placeholder-page">Gestion des rôles en construction</div>} />
            <Route path="/admin/complaints" element={<div className="placeholder-page">Gestion des réclamations en construction</div>} />
            <Route path="/admin/testimonials" element={<div className="placeholder-page">Gestion des témoignages en construction</div>} />
            <Route path="/admin/statistics" element={<div className="placeholder-page">Statistiques générales en construction</div>} />
            <Route path="/admin/settings" element={<div className="placeholder-page">Paramètres en construction</div>} />
            <Route path="/admin/activity" element={<div className="placeholder-page">Activité récente en construction</div>} />
            <Route path="/admin/member-requests" element={<div className="placeholder-page">Demandes d'adhésion en construction</div>} />
          </Route>

          {/* Protected routes only for etudiant */}
          <Route element={<ProtectedRoute allowedRoles={["etudiant"]} />}>
            <Route path="/join-club" element={<JoinClub />} />
            <Route path="/events" element={<div className="placeholder-page">Page Événements en construction</div>} />
            <Route path="/testimonials" element={<Temoignage />} />
            <Route path="/complaints" element={<Reclamation />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App