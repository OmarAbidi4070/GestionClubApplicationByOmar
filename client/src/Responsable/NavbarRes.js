import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Home, Users, Calendar, BookOpenCheck, MessageSquare, LogOut, Menu, ChevronDown } from 'lucide-react'
import "./navbarRes.css"

const NavbarRes = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const menuItems = [
    { icon: Home, label: "Accueil", href: "/club-home" },
    {
      icon: Users,
      label: "Gestion des Membres",
      submenu: [
        { label: "Demandes d'adhésion", href: "/member-requests" },
        { label: "Liste des membres", href: "/member-list" },
        { label: "Gestion des rôles", href: "/member-roles" },
      ],
    },
    { icon: Calendar, label: "Planning des Événements", href: "/events" },
    { icon: BookOpenCheck, label: "Réservations", href: "/reservations" },
    { icon: MessageSquare, label: "Messagerie", href: "/messages" },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Mobile Menu */}
        <div className="mobile-menu">
          <button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
            <Menu className="menu-icon" />
            <span className="sr-only">Toggle menu</span>
          </button>
          
          {isOpen && (
            <div className="mobile-menu-content">
              <div className="mobile-menu-items">
                {menuItems.map((item, index) => (
                  <div key={index} className="mobile-menu-item">
                    {item.submenu ? (
                      <div className="mobile-submenu">
                        <div className="mobile-submenu-title">
                          <item.icon className="menu-item-icon" />
                          {item.label}
                        </div>
                        <div className="mobile-submenu-items">
                          {item.submenu.map((subitem, subindex) => (
                            <Link
                              key={subindex}
                              to={subitem.href}
                              className="mobile-submenu-item"
                              onClick={() => setIsOpen(false)}
                            >
                              {subitem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        className="mobile-menu-link"
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="menu-item-icon" />
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
                <button
                  className="mobile-logout-button"
                  onClick={handleLogout}
                >
                  <LogOut className="menu-item-icon" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Menu */}
        <div className="desktop-menu">
          {menuItems.map((item, index) => (
            <div key={index} className="desktop-menu-item">
              {item.submenu ? (
                <div className="dropdown">
                  <button className="dropdown-button">
                    <item.icon className="menu-item-icon" />
                    {item.label}
                    <ChevronDown className="dropdown-icon" />
                  </button>
                  <div className="dropdown-content">
                    {item.submenu.map((subitem, subindex) => (
                      <Link key={subindex} to={subitem.href} className="dropdown-item">
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link to={item.href} className="desktop-menu-link">
                  <item.icon className="menu-item-icon" />
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Logout Button (Desktop) */}
        <button
          className="desktop-logout-button"
          onClick={handleLogout}
        >
          <LogOut className="menu-item-icon" />
          Déconnexion
        </button>
      </div>
    </nav>
  )
}

export default NavbarRes
