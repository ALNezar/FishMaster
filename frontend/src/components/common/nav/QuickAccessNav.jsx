import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaFish, FaChartPie, FaChartLine, FaBell, FaBars, FaTimes, FaUser, FaMicrochip, FaFlask } from 'react-icons/fa';
import styles from './QuickAccessNav.module.scss';
import { haptics } from '../../../utils/haptics';

const navItems = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: FaFish,
    matchPaths: ['/dashboard'],
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: FaChartPie,
    matchPaths: ['/analytics'],
  },
  {
    path: '/advisor',
    label: 'Advisor',
    icon: FaChartLine,
    matchPaths: ['/advisor', '/trends', '/history'],
  },
  {
    path: '/alerts',
    label: 'Alerts',
    icon: FaBell,
    matchPaths: ['/alerts'],
  }
];

const QuickAccessNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isItemActive = (item) => {
    if (item.matchPaths) {
      return item.matchPaths.some((p) => location.pathname.startsWith(p));
    }
    return location.pathname === item.path;
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const active = isItemActive(item);

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={`${styles.navItem} ${active ? styles.active : ''}`}
        onClick={() => haptics.tap()}
      >
        <div className={styles.iconWrapper}>
          {active && <div className={styles.activeIndicator} />}
          <Icon className={styles.navIcon} />
        </div>
        <span className={styles.navLabel}>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      <nav className={styles.bottomNav} aria-label="Main navigation">
        <div className={styles.navBar}>
          {navItems.map(renderNavItem)}

          {/* Menu Tab */}
          <button 
            className={`${styles.navItem} ${menuOpen ? styles.active : ''}`}
            onClick={() => {
              haptics.tap();
              setMenuOpen(!menuOpen);
            }}
            aria-label="More Menu"
          >
            <div className={styles.iconWrapper}>
              {menuOpen && <div className={styles.activeIndicator} />}
              <FaBars className={styles.navIcon} />
            </div>
            <span className={styles.navLabel}>Menu</span>
          </button>
        </div>
      </nav>

      {/* iOS-Style Bottom Sheet Menu */}
      <div className={`${styles.menuOverlay} ${menuOpen ? styles.menuOpen : ''}`} onClick={() => setMenuOpen(false)}>
        <div className={styles.menuSheet} onClick={e => e.stopPropagation()}>
          <div className={styles.menuHeader}>
            <h3>More Options</h3>
            <button className={styles.closeMenuBtn} onClick={() => setMenuOpen(false)}>
              <FaTimes />
            </button>
          </div>
          
          <div className={styles.menuGrid}>
            <NavLink to="/fish-types" className={styles.menuBtn} onClick={() => haptics.tap()}>
              <div className={`${styles.menuIconBox} ${styles.iconSpecies}`}>
                <FaFlask />
              </div>
              <span>Species Lab</span>
            </NavLink>
            
            <NavLink to="/device" className={styles.menuBtn} onClick={() => haptics.tap()}>
              <div className={`${styles.menuIconBox} ${styles.iconDevice}`}>
                <FaMicrochip />
              </div>
              <span>Devices</span>
            </NavLink>

            <NavLink to="/tanks" className={styles.menuBtn} onClick={() => haptics.tap()}>
              <div className={`${styles.menuIconBox} ${styles.iconTank}`}>
                <FaFish />
              </div>
              <span>Tanks</span>
            </NavLink>

            <NavLink to="/profile" className={styles.menuBtn} onClick={() => haptics.tap()}>
              <div className={`${styles.menuIconBox} ${styles.iconProfile}`}>
                <FaUser />
              </div>
              <span>Profile</span>
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickAccessNav;
