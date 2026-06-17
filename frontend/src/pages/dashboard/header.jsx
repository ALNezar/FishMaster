import officialLogo from "../../assets/images/fishmaster_official.png";
import { FaHeartbeat } from 'react-icons/fa';
import styles from './Header.module.scss';

export default function Header({ user, healthPercent = 0 }) {
  const getHealthStatus = () => {
    if (healthPercent >= 80) return { label: 'OPTIMAL', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' };
    if (healthPercent >= 60) return { label: 'WARNING', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    return { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  };

  const status = getHealthStatus();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoArea}>
          <img src={officialLogo} alt="FishMaster Official Logo" className={styles.logo} />
        </div>
        <div className={styles.actionsArea}>
          <div 
            className={styles.healthBadge} 
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            <FaHeartbeat />
            <span>SYSTEM HEALTH: {healthPercent}% ({status.label})</span>
          </div>
        </div>
      </div>
    </header>
  );
}