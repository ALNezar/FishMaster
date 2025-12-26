import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getTanks } from '../../services/api.js';
import Card from '../../components/common/card/card.jsx';
import Analytics from './Analytics.jsx';
import styles from './Dashboard.module.scss';
import { FaFish, FaTemperatureHigh, FaBell, FaUtensils, FaPlus, FaCheck, FaExclamationTriangle, FaHome, FaChartLine } from 'react-icons/fa';
import Header from "./header.jsx";


/**
 * Dashboard - Main app view with tabs for Overview and Analytics
 */
function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tanks, setTanks] = useState([]);
  const [loadingTanks, setLoadingTanks] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Layout handles auth check, we just load user data for display
    getCurrentUser().then(setUser).catch(() => { });
    
    getTanks()
      .then(data => setTanks(data || []))
      .catch(err => console.error('Failed to load tanks:', err))
      .finally(() => setLoadingTanks(false));
  }, []);

  const renderOverview = () => (
    <div className={styles.grid}>

      {/* Tank Status Card */}
      <Card className={`${styles.card} ${styles.statusCard}`}>
        <div className={styles.cardHeader}>
          <h3><FaFish /> Tank Status</h3>
          {tanks.length > 0 && <span className={styles.badgeSuccess}>All Optimal</span>}
        </div>
        <div className={styles.tankList}>
          {loadingTanks ? (
            <div className={styles.emptyState}>
              <p>Loading tanks...</p>
            </div>
          ) : tanks.length > 0 ? (
            tanks.slice(0, 3).map(tank => (
              <div 
                key={tank.id} 
                className={styles.tankItem}
                onClick={() => navigate(`/tanks/${tank.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.tankInfo}>
                  <span className={styles.tankName}>{tank.name}</span>
                  <span className={styles.tankDetail}>
                    {tank.sizeLiters}L • {tank.fish?.length || 0} Fish
                  </span>
                </div>
                <div className={styles.tankMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>pH</span>
                    <span className={styles.metricValue}>
                      {tank.waterParameters?.targetPh?.toFixed(1) || '—'}
                    </span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Temp</span>
                    <span className={styles.metricValue}>
                      {tank.waterParameters?.targetTemperature ? `${tank.waterParameters.targetTemperature}°C` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No tanks yet. Create your first tank!</p>
            </div>
          )}
        </div>
        <button className={styles.addTankBtn} onClick={() => navigate('/tanks')}>
          <FaPlus /> {tanks.length > 0 ? 'Manage Tanks' : 'Add New Tank'}
        </button>
      </Card>

      {/* Action Required / Alerts */}
      <Card className={`${styles.card} ${styles.alertCard}`}>
        <div className={styles.cardHeader}>
          <h3><FaBell /> Alerts</h3>
          <span className={styles.badgeWarning}>1 Notice</span>
        </div>
        <ul className={styles.alertList}>
          <li className={styles.alertItem}>
            <FaUtensils className={styles.alertIcon} />
            <div>
              <strong>Feeding Reminder</strong>
              <p>Time to feed the Goldfish!</p>
            </div>
            <button className={styles.actionBtn}><FaCheck /></button>
          </li>
          <li className={`${styles.alertItem} ${styles.alertInfo}`}>
            <FaExclamationTriangle className={styles.alertIcon} />
            <div>
              <strong>Filter Maintenance</strong>
              <p>Due in 3 days.</p>
            </div>
          </li>
        </ul>
      </Card>

      {/* Water Quality Overview */}
      <Card className={`${styles.card} ${styles.chartCard}`}>
        <div className={styles.cardHeader}>
          <h3><FaTemperatureHigh /> Water Quality Trends</h3>
          <select className={styles.timeSelect}>
            <option>Last 24 Hours</option>
            <option>Last Week</option>
          </select>
        </div>
        <div className={styles.chartPlaceholder}>
          {/* Placeholder for a chart library like Recharts */}
          <div className={styles.chartBar} style={{ height: '60%' }}></div>
          <div className={styles.chartBar} style={{ height: '70%' }}></div>
          <div className={styles.chartBar} style={{ height: '50%' }}></div>
          <div className={styles.chartBar} style={{ height: '80%' }}></div>
          <div className={styles.chartBar} style={{ height: '65%' }}></div>
          <div className={styles.chartBar} style={{ height: '75%' }}></div>
          <div className={styles.chartBar} style={{ height: '70%' }}></div>
          <p className={styles.chartLabel}>Temperature Stability</p>
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className={`${styles.card} ${styles.tipCard}`}>
        <h3>💡 Daily Tip</h3>
        <p>
          "Consistency is key! Fish adapt better to stable parameters than perfectly ideal ones that fluctuate wildly."
        </p>
      </Card>
    </div>
  );

  return (
    <div className={styles.dashboardContainer}>

      <Header user={user} />
      
      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaHome /> Overview
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartLine /> Data & Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? renderOverview() : <Analytics />}
    </div>
  );
}

export default Dashboard;
