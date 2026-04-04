import { NavLink, useLocation } from 'react-router-dom';
import { FaHome, FaFish, FaChartLine, FaBell, FaBook } from 'react-icons/fa';
import { MdSensors, MdTimeline, MdHistory, MdNotifications, MdRule } from 'react-icons/md';
import styles from './QuickAccessNav.module.scss';

const navItems = [
  { 
    path: '/dashboard', 
    label: 'Dashboard', 
    icon: FaHome,
    exact: true 
  },
  { 
    path: '/tanks', 
    label: 'My Tanks', 
    icon: FaFish,
    matchPaths: ['/tanks']
  },
  { 
    path: '/data', 
    label: 'Analytics', 
    icon: FaChartLine,
    matchPaths: ['/data', '/trends', '/history'],
    subTabs: [
      { path: '/data', label: 'Sensor Data', icon: MdSensors },
      { path: '/trends', label: 'Trends', icon: MdTimeline },
      { path: '/history', label: 'History', icon: MdHistory },
    ]
  },
  { 
    path: '/alerts', 
    label: 'Alerts', 
    icon: FaBell,
    matchPaths: ['/alerts', '/notifications'],
    subTabs: [
      { path: '/alerts', label: 'Alert Rules', icon: MdRule },
      { path: '/notifications', label: 'Notifications', icon: MdNotifications },
    ]
  },
  { 
    path: '/education', 
    label: 'Learn', 
    icon: FaBook 
  },
];

const QuickAccessNav = () => {
  const location = useLocation();
  
  // Find active parent tab based on current path
  const getActiveParent = () => {
    for (const item of navItems) {
      if (item.matchPaths?.some(p => location.pathname.startsWith(p))) {
        return item;
      }
      if (item.exact && location.pathname === item.path) {
        return item;
      }
      if (!item.exact && !item.matchPaths && location.pathname.startsWith(item.path)) {
        return item;
      }
    }
    return null;
  };
  
  const activeParent = getActiveParent();
  const activeSubTabs = activeParent?.subTabs || [];

  return (
    <nav className={styles.quickAccessNav}>
      {/* Main Tabs */}
      <div className={styles.mainTabs}>
        {navItems.map((item) => {
          const isActive = activeParent?.path === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`${styles.tabButton} ${isActive ? styles.activeTab : ''}`}
            >
              <item.icon className={styles.tabIcon} />
              <span className={styles.tabLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      
      {/* Sub Tabs - appear with bubbly animation */}
      {activeSubTabs.length > 0 && (
        <div className={styles.subTabs}>
          {activeSubTabs.map((subItem, index) => (
            <NavLink
              key={subItem.path}
              to={subItem.path}
              className={({ isActive }) => 
                `${styles.subTabButton} ${isActive ? styles.activeSubTab : ''}`
              }
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <subItem.icon className={styles.subTabIcon} />
              <span>{subItem.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default QuickAccessNav;
