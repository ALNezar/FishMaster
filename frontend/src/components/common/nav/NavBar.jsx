import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MdDashboard,
  MdWaterDrop,
  MdTrendingUp,
  MdNotifications,
  MdWarning,
  MdMenuBook,
  MdSettings,
  MdPerson,
  MdLogout,
  MdMenu,
  MdClose,
  MdHistory,
  MdShowChart,
  MdSensors
} from 'react-icons/md';
import { logout } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './NavBar.scss';

const sections = [
  { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { path: '/tanks', label: 'My Tanks', icon: MdWaterDrop },
  { path: '/data', label: 'Sensor Data', icon: MdSensors },
  { path: '/trends', label: 'Trends', icon: MdShowChart },
  { path: '/history', label: 'History', icon: MdHistory },
  { path: '/alerts', label: 'Alert Rules', icon: MdWarning },
  { path: '/notifications', label: 'Notifications', icon: MdNotifications },
  { path: '/education', label: 'Learn & Care', icon: MdMenuBook },
  { path: '/device', label: 'Device Setup', icon: MdSettings },
  { path: '/profile', label: 'My Profile', icon: MdPerson },
];

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button className="navbar__menu-btn" onClick={toggleMenu} aria-label="Toggle Menu">
        {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      {isOpen && <div className="navbar__overlay" onClick={closeMenu} />}

      <nav className={`navbar ${isOpen ? 'navbar--open' : ''}`}>
        <div className="navbar__header">
          <h2 className="navbar__title">FishMaster</h2>
        </div>

        <div className="navbar__items">
          {sections.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `navbar__item ${isActive ? 'navbar__item--active' : ''}`
              }
              onClick={closeMenu}
            >
              <Icon size={20} className="navbar__item-icon" />
              <span className="navbar__item-label">{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="navbar__footer">
          <button className="navbar__user" onClick={handleLogout}>
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}