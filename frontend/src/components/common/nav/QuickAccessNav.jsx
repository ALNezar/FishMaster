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
    label: 'My Tanks',
    icon: FaFish,
    matchPaths: ['/tanks'],
  },
  {
    path: '/fish-types',
    label: 'Species Lab',
    icon: FaFlask,
    matchPaths: ['/fish-types'],
  },
  {
    path: '/advisor',
    label: 'Tank Advisor',
    icon: FaCompass,
    matchPaths: ['/advisor', '/trends'],
  },
  {
    path: '/data',
    label: 'Analytics',
    icon: FaChartLine,
    matchPaths: ['/data', '/history', '/analytics'],
    subTabs: [
      { path: '/data', label: 'Sensor Data', icon: MdSensors },
      { path: '/history', label: 'History', icon: MdHistory },
    ],
  },
  {
    path: '/alerts',
    label: 'Alerts',
    icon: FaBell,
    matchPaths: ['/alerts', '/notifications'],
    subTabs: [
      { path: '/alerts', label: 'Alert Rules', icon: MdRule },
      { path: '/alerts?tab=history', label: 'Notifications', icon: MdNotifications },
    ],
  },
];

const QuickAccessNav = () => {
  const location = useLocation();

  const getActiveParent = () => {
    for (const item of navItems) {
      if (item.subTabs) {
        const pathMatch = item.matchPaths?.some((p) => {
          const base = p.split('?')[0];
          return location.pathname === base || location.pathname.startsWith(`${base}/`);
        });
        if (pathMatch) return item;
      }
      if (item.matchPaths?.some((p) => location.pathname.startsWith(p.split('?')[0]))) {
        return item;
      }
      if (location.pathname === item.path) {
        return item;
      }
    }
    return null;
  };

  const activeParent = getActiveParent();

  const isItemActive = (item) => {
    if (item.subTabs) {
      return activeParent?.path === item.path;
    }
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

      {activeParent?.subTabs && (
        <div className={styles.subTabs}>
          {activeParent.subTabs.map((sub, index) => {
            const SubIcon = sub.icon;
            const isSubActive =
              `${location.pathname}${location.search}` === sub.path
              || (location.pathname === sub.path && !sub.path.includes('?'));

            return (
              <NavLink
                key={sub.path}
                to={sub.path}
                className={`${styles.subTabButton} ${isSubActive ? styles.activeSubTab : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => haptics.tap()}
              >
                <SubIcon className={styles.subTabIcon} />
                <span>{sub.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default QuickAccessNav;
