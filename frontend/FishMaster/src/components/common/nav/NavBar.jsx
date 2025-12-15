import React, { useState } from 'react';
import '../nav/NavBar.scss';
import { 
  FaHome, 
  FaFish, 
  FaChartBar, 
  FaBell, 
  FaEnvelope, 
  FaBook, 
  FaMicrochip, 
  FaUser 
} from 'react-icons/fa';

const NavBar = () => {
  // State to track the active menu item. Default is 'Dashboard' based on image.
  const [activeItem, setActiveItem] = useState('Dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaHome /> },
    { id: 'tanks', label: 'My Tanks', icon: <FaFish className="icon-blue" /> },
    { id: 'trends', label: 'Data & Trends', icon: <FaChartBar className="icon-green" /> },
    { id: 'alerts', label: 'Alert Rules', icon: <FaBell className="icon-yellow" /> },
    { id: 'notifications', label: 'Notifications', icon: <FaEnvelope className="icon-blue-light" /> },
    { id: 'learn', label: 'Learn & Care', icon: <FaBook className="icon-brown" /> },
    { id: 'device', label: 'Device Setup', icon: <FaMicrochip className="icon-dark" /> },
    { id: 'profile', label: 'Profile & Settings', icon: <FaUser className="icon-peach" /> },
  ];

  return (
    <nav className="fishmaster-navbar">
      <ul className="nav-list">
        {menuItems.map((item) => (
          <li 
            key={item.id} 
            className={`nav-item ${activeItem === item.label ? 'active' : ''}`}
            onClick={() => setActiveItem(item.label)}
          >
            <span className="icon-wrapper">
              {item.icon}
            </span>
            <span className="label">{item.label}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavBar;