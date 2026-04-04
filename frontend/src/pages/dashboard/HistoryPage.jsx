import React, { useState, useEffect } from 'react';
import { getTanks } from '../../services/api';
import Card from '../../components/common/card/card.jsx';
import styles from './HistoryPage.module.scss';
import { FaHistory, FaThermometerHalf, FaExclamationTriangle, FaTools, FaFish, FaTint, FaCheckCircle, FaFilter } from 'react-icons/fa';

/**
 * History Page - Shows historical events and logs for tanks
 */
function HistoryPage() {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };
    loadTanks();
  }, []);

  useEffect(() => {
    if (selectedTank) {
      const mockHistory = generateMockHistory(selectedTank);
      setHistoryData(mockHistory);
    }
  }, [selectedTank]);

  const generateMockHistory = (tankId) => {
    const events = [
      { type: 'parameter', icon: <FaThermometerHalf />, title: 'Temperature adjusted', description: 'Temperature stabilized at 25°C', status: 'success' },
      { type: 'alert', icon: <FaExclamationTriangle />, title: 'pH Warning', description: 'pH level dropped below 6.8', status: 'warning' },
      { type: 'maintenance', icon: <FaTools />, title: 'Water change', description: '25% water change completed', status: 'info' },
      { type: 'feeding', icon: <FaFish />, title: 'Fish fed', description: 'Regular feeding schedule completed', status: 'success' },
      { type: 'parameter', icon: <FaTint />, title: 'Ammonia check', description: 'Ammonia levels normal at 0.02 ppm', status: 'success' },
      { type: 'alert', icon: <FaCheckCircle />, title: 'Alert resolved', description: 'pH level returned to normal range', status: 'success' },
      { type: 'maintenance', icon: <FaFilter />, title: 'Filter cleaned', description: 'Monthly filter maintenance performed', status: 'info' },
      { type: 'parameter', icon: <FaTint />, title: 'Turbidity check', description: 'Water clarity optimal at 1.2 NTU', status: 'success' },
      { type: 'alert', icon: <FaExclamationTriangle />, title: 'Temperature spike', description: 'Temperature rose to 28°C briefly', status: 'warning' },
      { type: 'feeding', icon: <FaFish />, title: 'Fish fed', description: 'Evening feeding completed', status: 'success' },
      { type: 'maintenance', icon: <FaTools />, title: 'Substrate vacuumed', description: 'Weekly substrate cleaning', status: 'info' },
      { type: 'parameter', icon: <FaThermometerHalf />, title: 'Heater calibrated', description: 'Heater set to maintain 25°C', status: 'success' },
    ];

    const now = new Date();
    return events.map((event, i) => ({
      ...event,
      id: i + 1,
      timestamp: new Date(now - i * 3600000 * (Math.random() * 5 + 1)).toISOString(),
      tankId,
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

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

  if (loading) {
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
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1><FaHistory /> History Log</h1>
          <p>View past events, alerts, and maintenance records</p>
        </div>
      </header>

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
          {filteredHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <FaHistory className={styles.emptyIcon} />
              <p>No history events found</p>
            </div>
          ) : (
            filteredHistory.map((event) => (
              <div key={event.id} className={`${styles.timelineItem} ${getEventClass(event.type)}`}>
                <div className={`${styles.timelineDot} ${getStatusClass(event.status)}`}>
                  {event.icon}
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
