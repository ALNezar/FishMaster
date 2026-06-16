import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaFish, FaChartLine, FaUser, FaChartPie, FaPlus } from 'react-icons/fa';
import styles from './QuickAccessNav.module.scss';
import { haptics } from '../../../utils/haptics';

const navItems = [
  {
    path: '/dashboard',
    label: 'My Tanks',
    icon: FaFish,
    matchPaths: ['/dashboard', '/tanks'],
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
    path: '/profile',
    label: 'Profile',
    icon: FaUser,
    matchPaths: ['/profile'],
  },
];

const QuickAccessNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
    <nav className={styles.bottomNav} aria-label="Main navigation">
      <div className={styles.navBar}>
        {navItems.slice(0, 2).map(renderNavItem)}

        {/* Middle FAB for Species Management / Add Fish */}
        <button 
          className={styles.fabButtonWrapper} 
          onClick={() => {
            haptics.tap();
            navigate('/fish-types');
          }}
          aria-label="Manage Species"
        >
          <div className={styles.fabButton}>
            <FaPlus className={styles.fabPlusIcon} />
            <FaFish className={styles.fabFishIcon} />
          </div>
        </button>

        {navItems.slice(2).map(renderNavItem)}
      </div>
    </nav>
  );
};

export default QuickAccessNav;
