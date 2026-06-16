import fishLogo from "../../assets/images/blackandredfish.svg";
import { FaFlask } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoArea}>
          <img src={fishLogo} alt="FishMaster" className={styles.logo} />
        </div>
        <div className={styles.actionsArea}>
          <button 
            className={styles.speciesBtn}
            onClick={() => navigate('/fish-types')}
            aria-label="Species Lab"
          >
            <FaFlask className={styles.actionIcon} />
            <span className={styles.actionText}>Species Lab</span>
          </button>
        </div>
      </div>
    </header>
  );
}