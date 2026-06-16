import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getTanks, getSensorData, useTemperatureStream, usePhStream, useTurbidityStream } from '../../api';
import styles from './Dashboard.module.scss';
import { FaFish, FaThermometerHalf, FaBell, FaChartLine, FaTint, FaPlus, FaHome, FaWater, FaUtensils, FaWrench, FaCircle, FaFlask } from 'react-icons/fa';
import Header from "./header.jsx";

/**
 * Dashboard - Main overview page with sidebar layout
 */
function Dashboard() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const user = outlet?.user;
  const [tanks, setTanks] = useState([]);
  const [loadingTanks, setLoadingTanks] = useState(true);
  const [sensorData, setSensorData] = useState(null);

  // Live temperature via SSE
  const { lastReading: liveTemp, connected: sseConnected } = useTemperatureStream();
  
  // Live pH via SSE
  const { lastReading: livePh, connected: phConnected } = usePhStream();

  // Live turbidity via SSE
  const { lastReading: liveTurbidity, connected: turbidityConnected } = useTurbidityStream();

  useEffect(() => {
    getTanks()
      .then(data => {
        setTanks(data || []);
        if (data && data.length > 0) {
          getSensorData(data[0].id, '24h')
            .then(sensor => setSensorData(sensor))
            .catch(err => console.error('Failed to load sensor data:', err));
        }
      })
      .catch(err => console.error('Failed to load tanks:', err))
      .finally(() => setLoadingTanks(false));
  }, []);

  // Merge live SSE temperature into readings whenever a new event arrives
  useEffect(() => {
    if (!liveTemp) return;
    const value = Number(liveTemp.temperature);
    setSensorData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentReadings: {
          ...prev.currentReadings,
          temperature: {
            value,
            unit: '°C',
            status: value < 22 || value > 28 ? 'warning' : 'optimal',
            trend: prev.currentReadings?.temperature?.value != null
              ? value > prev.currentReadings.temperature.value ? 'rising'
                : value < prev.currentReadings.temperature.value ? 'falling'
                : 'stable'
              : 'stable',
          },
        },
      };
    });
  }, [liveTemp]);

  // Merge live SSE pH into readings whenever a new event arrives
  useEffect(() => {
    if (!livePh) return;
    const value = Number(livePh.ph);
    setSensorData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentReadings: {
          ...prev.currentReadings,
          ph: {
            value,
            unit: '',
            status: value < 6.5 || value > 7.5 ? 'warning' : 'optimal',
            trend: prev.currentReadings?.ph?.value != null
              ? value > prev.currentReadings.ph.value ? 'rising'
                : value < prev.currentReadings.ph.value ? 'falling'
                : 'stable'
              : 'stable',
          },
        },
      };
    });
  }, [livePh]);

  // Merge live SSE turbidity into readings whenever a new event arrives
  useEffect(() => {
    if (!liveTurbidity) return;
    const value = Number(liveTurbidity.ntu);
    setSensorData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentReadings: {
          ...prev.currentReadings,
          turbidity: {
            value,
            unit: 'NTU',
            status: value > 5 ? 'warning' : 'optimal',
            trend: prev.currentReadings?.turbidity?.value != null
              ? value > prev.currentReadings.turbidity.value ? 'rising'
                : value < prev.currentReadings.turbidity.value ? 'falling'
                : 'stable'
              : 'stable',
          },
        },
      };
    });
  }, [liveTurbidity]);

  const totalFish = tanks.reduce((sum, tank) => sum + (tank.fish?.length || 0), 0);
  const readings = sensorData?.currentReadings;

  // Health score — ammonia removed (no live sensor)
  const getHealthPercent = () => {
    if (!readings) return 0;
    let score = 0;
    const weights = { ph: 1.5, temperature: 0.8, turbidity: 0.5 };
    const maxScore = Object.values(weights).reduce((a, b) => a + b, 0);
    if (readings.ph?.value >= 6.8 && readings.ph?.value <= 7.4) score += weights.ph;
    if (readings.temperature?.value >= 24 && readings.temperature?.value <= 26) score += weights.temperature;
    if (readings.turbidity?.value < 3) score += weights.turbidity;
    return Math.round((score / maxScore) * 100);
  };

  const healthPercent = getHealthPercent();

  const trendLabel = (trend) =>
    trend === 'rising' ? '↑ Rising' : trend === 'falling' ? '↓ Falling' : '→ Stable';

  return (
    <div className={styles.dashboardContainer}>
      <Header user={user} />

      <div className={styles.layout}>
        {/* Main Content */}
        <div className={styles.mainContent}>

          {/* Summary Stats Row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard} onClick={() => navigate('/tanks')}>
              <div className={styles.statLabel}>Total Tanks</div>
              <div className={styles.statValue}>{loadingTanks ? '…' : tanks.length}</div>
            </div>
            <div className={styles.statCard} onClick={() => navigate('/tanks')}>
              <div className={styles.statLabel}>Total Fish</div>
              <div className={styles.statValue}>{totalFish}</div>
            </div>
            <div className={styles.statCard} onClick={() => navigate('/analytics')}>
              <div className={styles.statLabel}>Health Score</div>
              <div className={styles.statValue}>{healthPercent}%</div>
              <div className={styles.statSubtext}>
                {healthPercent >= 80 ? '😃 Optimal' : healthPercent >= 60 ? '😐 Fair' : '😟 Needs attention'}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Temperature</div>
              <div className={styles.statValue}>
                {readings?.temperature?.value?.toFixed(1) ?? '--'}°C
              </div>
            </div>
          </div>

          {/* Quick Actions (Mobile friendly) */}
          <div className={styles.card} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            <button 
              className={styles.addTankBtn} 
              onClick={() => navigate('/fish-types')} 
              style={{ flex: 1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f5f1e3', color: '#3d3021', border: '2px solid #1277b0' }}
            >
              <FaFlask /> Species Lab
            </button>
            <button 
              className={styles.addTankBtn} 
              onClick={() => navigate('/advisor')} 
              style={{ flex: 1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <FaChartLine /> Tank Advisor
            </button>
          </div>

          {/* Tank List */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3><FaFish /> My Tanks</h3>
              <span className={styles.sectionLink} onClick={() => navigate('/tanks')}>View All →</span>
            </div>
            {loadingTanks ? (
              <div className={styles.emptyState}>Loading tanks…</div>
            ) : tanks.length > 0 ? (
              <div className={styles.tankList}>
                {tanks.map(tank => (
                  <div
                    key={tank.id}
                    className={styles.tankRow}
                    onClick={() => navigate(`/tanks/${tank.id}`)}
                  >
                    <span className={styles.tankName}>{tank.name}</span>
                    <span className={styles.tankSize}>{tank.sizeLiters}L</span>
                    <div className={styles.tankMetric}>
                      <span className={styles.tankMetricValue}>
                        {tank.waterParameters?.targetPh?.toFixed(1) ?? '--'}
                      </span>
                      <span className={styles.tankMetricLabel}>pH</span>
                    </div>
                    <div className={styles.tankMetric}>
                      <span className={styles.tankMetricValue}>
                        {tank.waterParameters?.targetTemperature ?? '--'}°
                      </span>
                      <span className={styles.tankMetricLabel}>Temp</span>
                    </div>
                    <span className={styles.tankFish}>
                      <FaFish /> {tank.fish?.length || 0}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                No tanks yet
                <button className={styles.addTankBtn} onClick={() => navigate('/tanks')} style={{ marginTop: '0.75rem' }}>
                  <FaPlus /> Add Your First Tank
                </button>
              </div>
            )}
          </div>

          {/* Live Readings — ammonia removed */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3><FaThermometerHalf /> Live Readings</h3>
              {/* SSE connection badge (temperature + pH + turbidity) */}
              {(() => {
                const connectedCount = [sseConnected, phConnected, turbidityConnected].filter(Boolean).length;
                const both = connectedCount === 3;
                const partial = connectedCount > 0 && connectedCount < 3;
                const cls = both ? styles.success : partial ? styles.warning : styles.danger;
                const title = both ? 'All live data connected' : partial ? 'Partial live data' : 'Reconnecting…';
                const label = both ? 'Live' : partial ? 'Partial' : 'Reconnecting…';
                return (
                  <span
                    className={`${styles.badge} ${cls}`}
                    title={title}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FaCircle style={{ fontSize: '0.5rem' }} />
                    {label}
                  </span>
                );
              })()}
            </div>
            {readings ? (
              <div className={styles.readingsRow}>
                {/* Temperature — real data via SSE */}
                <div className={styles.readingCard}>
                  <div className={styles.readingHeader}>
                    <span className={styles.readingLabel}>Temperature</span>
                    <span className={`${styles.readingStatus} ${styles[readings.temperature?.status || 'optimal']}`} />
                  </div>
                  <div className={styles.readingValue}>{readings.temperature?.value?.toFixed(1)}</div>
                  <div className={styles.readingUnit}>°C</div>
                  <div className={`${styles.readingTrend} ${styles[readings.temperature?.trend || 'stable']}`}>
                    {trendLabel(readings.temperature?.trend)}
                  </div>
                </div>

                {/* pH */}
                <div className={styles.readingCard}>
                  <div className={styles.readingHeader}>
                    <span className={styles.readingLabel}>pH Level</span>
                    <span className={`${styles.readingStatus} ${styles[readings.ph?.status || 'optimal']}`} />
                  </div>
                  <div className={styles.readingValue}>{readings.ph?.value?.toFixed(1)}</div>
                  <div className={styles.readingUnit}>pH</div>
                  <div className={`${styles.readingTrend} ${styles[readings.ph?.trend || 'stable']}`}>
                    {trendLabel(readings.ph?.trend)}
                  </div>
                </div>

                {/* Turbidity */}
                <div className={styles.readingCard}>
                  <div className={styles.readingHeader}>
                    <span className={styles.readingLabel}>Turbidity</span>
                    <span className={`${styles.readingStatus} ${styles[readings.turbidity?.status || 'optimal']}`} />
                  </div>
                  <div className={styles.readingValue}>{readings.turbidity?.value?.toFixed(1)}</div>
                  <div className={styles.readingUnit}>NTU</div>
                  <div className={`${styles.readingTrend} ${styles[readings.turbidity?.trend || 'stable']}`}>
                    {trendLabel(readings.turbidity?.trend)}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>No sensor data available</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Navigation */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Navigation</h3>
            </div>
            <div className={styles.navList}>
              <div className={`${styles.navItem} ${styles.active}`}>
                <FaHome /> Dashboard
              </div>
              <div className={styles.navItem} onClick={() => navigate('/tanks')}>
                <FaFish /> My Tanks
              </div>
              <div className={styles.navItem} onClick={() => navigate('/fish-types')}>
                <FaFlask /> Species Lab
              </div>
              <div className={styles.navItem} onClick={() => navigate('/analytics')}>
                <FaChartLine /> Analytics
              </div>
              <div className={styles.navItem} onClick={() => navigate('/alerts')}>
                <FaBell /> Alerts
              </div>
            </div>
          </div>

          {/* Recent Tanks */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Recent Tanks</h3>
            </div>
            {tanks.length > 0 ? (
              <div className={styles.recentTanks}>
                {tanks.slice(0, 2).map(tank => (
                  <div
                    key={tank.id}
                    className={styles.recentTankCard}
                    onClick={() => navigate(`/tanks/${tank.id}`)}
                  >
                    <div className={styles.recentTankName}>{tank.name}</div>
                    <div className={styles.recentTankInfo}>{tank.fish?.length || 0} fish</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No tanks</div>
            )}
          </div>

          {/* Alerts */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3><FaBell /> Alerts</h3>
              <span className={`${styles.badge} ${styles.warning}`}>2</span>
            </div>
            <div className={styles.alertsList}>
              <div className={styles.alertItem} onClick={() => navigate('/alerts')}>
                <div className={`${styles.alertIcon} ${styles.danger}`}>
                  <FaUtensils />
                </div>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>Feeding Reminder</div>
                  <div className={styles.alertDesc}>Time to feed the Goldfish</div>
                </div>
              </div>
              <div className={styles.alertItem} onClick={() => navigate('/alerts')}>
                <div className={`${styles.alertIcon} ${styles.warning}`}>
                  <FaWrench />
                </div>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>Filter Maintenance</div>
                  <div className={styles.alertDesc}>Due in 3 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;