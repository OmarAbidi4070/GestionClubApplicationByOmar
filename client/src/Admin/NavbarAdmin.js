import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { LayoutDashboard, Users, ClipboardList, Settings, Shield, LogOut, Menu, ChevronDown, BarChart2, Flag, MessageSquare, Building } from 'lucide-react'
import "./NavbarAdmin.css"

const NavbarAdmin = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState(null)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin/dashboard" },
    {
      icon: Building,
      label: "Gestion des Clubs",
      submenu: [
        { label: "Liste des clubs", href: "/admin/clubs" },
        { label: "Demandes de création", href: "/admin/club-requests" },
        { label: "Statistiques des clubs", href: "/admin/club-stats" },
      ],
    },
    {
      icon: Users,
      label: "Gestion des Utilisateurs",
      submenu: [
        { label: "Liste des utilisateurs", href: "/admin/users" },
        { label: "Rôles et permissions", href: "/admin/roles" },
      ],
    },
    { icon: Flag, label: "Réclamations", href: "/admin/complaints" },
    { icon: MessageSquare, label: "Témoignages", href: "/admin/testimonials" },
    { icon: BarChart2, label: "Statistiques", href: "/admin/statistics" },
    { icon: Settings, label: "Paramètres", href: "/admin/settings" },
  ]

  const toggleSubmenu = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index)
  }

  return (
    <nav className="navbar admin-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Shield className="admin-icon" />
          <span className="admin-title">Administration</span>
        </div>

        {/* Mobile Menu */}
        <div className="mobile-menu">
          <button className="menu-button" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            <Menu className="menu-icon" />
          </button>
          
          {isOpen && (
            <div className="mobile-menu-content">
              <div className="mobile-menu-items">
                {menuItems.map((item, index) => (
                  <div key={index} className="mobile-menu-item">
                    {item.submenu ? (
                      <div className="mobile-submenu">
                        <button 
                          className="mobile-submenu-title"
                          onClick={() => toggleSubmenu(index)}
                        >
                          <item.icon className="menu-item-icon" />
                          {item.label}
                          <ChevronDown className={`dropdown-icon ${openSubmenu === index ? 'rotate' : ''}`} />
                        </button>
                        {openSubmenu === index && (
                          <div className="mobile-submenu-items">
                            {item.submenu.map((subitem, subindex) => (
                              <Link
                                key={subindex}
                                to={subitem.href}
                                className="mobile-submenu-item"
                                onClick={() => {
                                  setIsOpen(false)
                                  setOpenSubmenu(null)
                                }}
                              >
                                {subitem.label}
                              </Link>
                            ))}
                          </div>
                        )}
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
                  <button 
                    className="dropdown-button"
                    onClick={() => toggleSubmenu(index)}
                    aria-expanded={openSubmenu === index}
                  >
                    <item.icon className="menu-item-icon" />
                    {item.label}
                    <ChevronDown className={`dropdown-icon ${openSubmenu === index ? 'rotate' : ''}`} />
                  </button>
                  {openSubmenu === index && (
                    <div className="dropdown-content">
                      {item.submenu.map((subitem, subindex) => (
                        <Link 
                          key={subindex} 
                          to={subitem.href} 
                          className="dropdown-item"
                          onClick={() => setOpenSubmenu(null)}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link to={item.href} className="desktop-menu-link">
                  <item.icon className="menu-item-icon" />
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          <button
            className="desktop-logout-button"
            onClick={handleLogout}
          >
            <LogOut className="menu-item-icon" />
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}

export default NavbarAdmin