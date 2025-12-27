import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { removeToken } from '../../../services/api';
import styles from './ProfileAvatar.module.scss';

const ProfileAvatar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'FM';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const menuItems = [
    { icon: FaUser, label: 'My Profile', path: '/profile' },
    { icon: FaCog, label: 'Device Setup', path: '/device' },
  ];

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.avatar}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.username || 'Fishkeeper'}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          
          <div className={styles.divider} />
          
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              className={styles.menuItem}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
          
          <div className={styles.divider} />
          
          <button
            className={`${styles.menuItem} ${styles.logout}`}
            onClick={handleLogout}
            style={{ animationDelay: '100ms' }}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
