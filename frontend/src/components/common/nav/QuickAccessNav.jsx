import { NavLink, useLocation } from 'react-router-dom';
import { FaHome, FaFish, FaChartLine, FaBell, FaFlask, FaCompass } from 'react-icons/fa';
import { MdSensors, MdHistory, MdNotifications, MdRule } from 'react-icons/md';
import styles from './QuickAccessNav.module.scss';
import { haptics } from '../../../utils/haptics';

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: FaHome,
    exact: true,
  },
  {
    path: '/tanks',
    label: 'Tanks',
    icon: FaFish,
    matchPaths: ['/tanks'],
  },
  {
    path: '/advisor',
    label: 'Advisor',
    icon: FaCompass,
    matchPaths: ['/advisor', '/trends'],
  },
  {
    path: '/data',
    label: 'Analytics',
    icon: FaChartLine,
    matchPaths: ['/data', '/history', '/analytics'],
  },
  {
    path: '/alerts',
    label: 'Alerts',
    icon: FaBell,
    matchPaths: ['/alerts', '/notifications'],
  },
];

const QuickAccessNav = () => {
  const location = useLocation();

  const isItemActive = (item) => {
    if (item.matchPaths) {
      return item.matchPaths.some((p) => location.pathname.startsWith(p.split('?')[0]));
    }
    return location.pathname === item.path;
  };

  return (
    <nav className={styles.quickAccessNav} aria-label="Main navigation">
      <div className={styles.mainTabs}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={`${styles.tabButton} ${active ? styles.activeTab : ''}`}
              onClick={() => haptics.tap()}
            >
              <Icon className={styles.tabIcon} />
              <span className={styles.tabLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default QuickAccessNav;
