import { useState, useEffect } from 'react';
import { FaWifi, FaBatteryFull } from 'react-icons/fa';
import { MdSignalCellular4Bar } from 'react-icons/md';
import styles from './StatusBar.module.scss';

export default function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className={styles.statusBar} aria-hidden="true">
      <div className={styles.time}>{timeString}</div>
      <div className={styles.notch} />
      <div className={styles.icons}>
        <MdSignalCellular4Bar className={styles.icon} />
        <FaWifi className={styles.icon} />
        <FaBatteryFull className={`${styles.icon} ${styles.battery}`} />
      </div>
    </div>
  );
}
