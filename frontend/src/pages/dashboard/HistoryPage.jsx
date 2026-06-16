import React, { useState, useEffect } from 'react';
import { getTankHistoryTimeline, getTanks } from '../../api';
import Card from '../../components/common/card/card.jsx';
import styles from './HistoryPage.module.scss';
import { FaHistory, FaThermometerHalf, FaExclamationTriangle, FaTools, FaFish, FaTint, FaCheckCircle, FaFilter } from 'react-icons/fa';

/**
 * History Page - Shows historical events and logs for tanks
 */
function HistoryPage({ isTab }) {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingTanks, setLoadingTanks] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const loadTanks = async () => {
      try {
        const data = await getTanks();
        setTanks(data || []);
        if (data && data.length > 0) {
          setSelectedTank(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load tanks:', err);
        setError('Failed to load tanks.');
      } finally {
        setLoadingTanks(false);
      }
    };
    loadTanks();
  }, []);

  useEffect(() => {
    if (!selectedTank) {
      setHistoryData([]);
      return;
    }
    let isActive = true;

    const loadHistory = async () => {
      setLoadingHistory(true);
      setError('');

      try {
        const data = await getTankHistoryTimeline(selectedTank, 24);
        if (isActive) {
          setHistoryData(data || []);
        }
      } catch (err) {
        console.error('Failed to load history timeline:', err);
        if (isActive) {
          setHistoryData([]);
          setError('Failed to load history timeline.');
        }
      } finally {
        if (isActive) {
          setLoadingHistory(false);
        }
      }
    };

    loadHistory();

    return () => {
      isActive = false;
    };
  }, [selectedTank]);

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getEventClass = (type) => {
    switch (type) {
      case 'alert': return styles.alertEvent;
      case 'maintenance': return styles.maintenanceEvent;
      case 'feeding': return styles.feedingEvent;
      default: return styles.parameterEvent;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'warning': return styles.statusWarning;
      case 'success': return styles.statusSuccess;
      default: return styles.statusInfo;
    }
  };

  const getEventIcon = (event) => {
    switch (event.type) {
      case 'feeding':
        return <FaFish />;
      case 'alert':
        return <FaExclamationTriangle />;
      case 'maintenance':
        return <FaTools />;
      case 'parameter':
        return event.title.toLowerCase().includes('ph') ? <FaTint /> : <FaThermometerHalf />;
      default:
        return <FaCheckCircle />;
    }
  };

  const filteredHistory = filterType === 'all' 
    ? historyData 
    : historyData.filter(event => event.type === filterType);

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'parameter', label: 'Parameters' },
    { value: 'alert', label: 'Alerts' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'feeding', label: 'Feeding' },
  ];

  if (loadingTanks) {
    return (
      <div className={styles.historyPage}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.historyPage}>
      {!isTab && (
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1><FaHistory /> History Log</h1>
            <p>View real feeding, telemetry, and system history for each tank</p>
          </div>
        </header>
      )}

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Tank</label>
          <select 
            value={selectedTank || ''} 
            onChange={(e) => setSelectedTank(Number(e.target.value))}
            className={styles.select}
          >
            {tanks.map(tank => (
              <option key={tank.id} value={tank.id}>{tank.name}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.controlGroup}>
          <label>Filter</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.select}
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{historyData.filter(e => e.type === 'parameter').length}</span>
          <span className={styles.statLabel}>Parameters</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{historyData.filter(e => e.type === 'alert').length}</span>
          <span className={styles.statLabel}>Alerts</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{historyData.filter(e => e.type === 'maintenance').length}</span>
          <span className={styles.statLabel}>Maintenance</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{historyData.filter(e => e.type === 'feeding').length}</span>
          <span className={styles.statLabel}>Feedings</span>
        </Card>
      </div>

      {/* Timeline */}
      <Card className={styles.timelineCard}>
        <div className={styles.timeline}>
          {loadingHistory ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner}></div>
              <p>Loading real history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <FaHistory className={styles.emptyIcon} />
              <p>No real history events found for this tank</p>
            </div>
          ) : (
            filteredHistory.map((event) => (
              <div key={event.id} className={`${styles.timelineItem} ${getEventClass(event.type)}`}>
                <div className={`${styles.timelineDot} ${getStatusClass(event.status)}`}>
                  {getEventIcon(event)}
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineHeader}>
                    <h3>{event.title}</h3>
                    <span className={styles.timestamp}>{formatTime(event.timestamp)}</span>
                  </div>
                  <p>{event.description}</p>
                  <span className={`${styles.typeBadge} ${styles[event.type]}`}>{event.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export default HistoryPage;
