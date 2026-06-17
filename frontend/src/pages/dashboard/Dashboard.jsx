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

  const generateAlerts = () => {
    const alerts = [];
    if (!readings) return alerts;
    
    if (readings.ph?.value > 7.5) {
      alerts.push({ type: 'critical', text: `pH level is severely high (${readings.ph.value}). Immediate water change recommended.` });
    } else if (readings.ph?.value < 6.5) {
      alerts.push({ type: 'critical', text: `pH level is severely low (${readings.ph.value}). Immediate water change recommended.` });
    }

    if (readings.temperature?.value > 28) {
      alerts.push({ type: 'critical', text: `Temperature is dangerously high (${readings.temperature.value}°C). Check cooling systems.` });
    } else if (readings.temperature?.value < 22) {
      alerts.push({ type: 'critical', text: `Temperature is dangerously low (${readings.temperature.value}°C). Check heaters.` });
    }
    
    if (readings.turbidity?.value > 5) {
      alerts.push({ type: 'warning', text: `Turbidity is high (${readings.turbidity.value} NTU). Consider cleaning the filter.` });
    }
    
    return alerts;
  };

  const actionableAlerts = generateAlerts();
  const activeTank = tanks.length > 0 ? tanks[0] : null;

  return (
    <div className={styles.dashboardContainer}>
      <Header user={user} healthPercent={healthPercent} />

      <div className={styles.homeContent}>
        {/* 1. Actionable Alerts (The "Why") */}
        {actionableAlerts.length > 0 && (
          <div className={styles.alertsSection}>
            {actionableAlerts.map((alert, idx) => (
              <div key={idx} className={`${styles.alertCard} ${alert.type === 'critical' ? styles.alertCritical : styles.alertWarning}`}>
                <div className={styles.alertIconWrapper}>
                  {alert.type === 'critical' ? '⚠️' : '🔧'}
                </div>
                <div className={styles.alertText}>
                  <strong>{alert.type === 'critical' ? 'CRITICAL' : 'Maintenance'}:</strong> {alert.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Live Sensor Readings (The "What") */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3><FaThermometerHalf /> Live Sensor Readings</h3>
            {/* Connection badge */}
            {(() => {
              const connectedCount = [sseConnected, phConnected, turbidityConnected].filter(Boolean).length;
              const isFull = connectedCount === 3;
              return (
                <span className={`${styles.connectionBadge} ${isFull ? styles.connLive : styles.connPartial}`}>
                  <FaCircle /> {isFull ? 'Live' : 'Partial'}
                </span>
              );
            })()}
          </div>

          <div className={styles.readingsGrid}>
            {/* Header Row */}
            <div className={styles.readingsHeaderRow}>
              <span>Parameter</span>
              <span>Current</span>
              <span>Status</span>
              <span>Trend</span>
            </div>

            {readings ? (
              <>
                <div className={styles.readingRow}>
                  <div className={styles.paramLabel}><strong>Temperature</strong></div>
                  <div className={styles.paramValue}>{readings.temperature?.value?.toFixed(1)} °C</div>
                  <div className={styles.paramStatus}>
                    <span className={`${styles.statusPill} ${styles[readings.temperature?.status || 'optimal']}`}>
                      {readings.temperature?.status === 'optimal' ? '🟢 Stable' : '🔴 Critical'}
                    </span>
                  </div>
                  <div className={styles.paramTrend}>{trendLabel(readings.temperature?.trend)}</div>
                </div>

                <div className={styles.readingRow}>
                  <div className={styles.paramLabel}><strong>pH Level</strong></div>
                  <div className={styles.paramValue}>{readings.ph?.value?.toFixed(1)} pH</div>
                  <div className={styles.paramStatus}>
                    <span className={`${styles.statusPill} ${styles[readings.ph?.status || 'optimal']}`}>
                      {readings.ph?.status === 'optimal' ? '🟢 Stable' : '🔴 Critical'}
                    </span>
                  </div>
                  <div className={styles.paramTrend}>{trendLabel(readings.ph?.trend)}</div>
                </div>

                <div className={styles.readingRow}>
                  <div className={styles.paramLabel}><strong>Turbidity</strong></div>
                  <div className={styles.paramValue}>{readings.turbidity?.value?.toFixed(1)} NTU</div>
                  <div className={styles.paramStatus}>
                    <span className={`${styles.statusPill} ${styles[readings.turbidity?.status || 'optimal']}`}>
                      {readings.turbidity?.status === 'optimal' ? '🟢 Stable' : '🟡 Warning'}
                    </span>
                  </div>
                  <div className={styles.paramTrend}>{trendLabel(readings.turbidity?.trend)}</div>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>No sensor data available</div>
            )}
          </div>
        </div>

        {/* 3. My Tanks Overview */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3><FaWater /> My Tanks Overview</h3>
            {tanks.length > 1 && (
              <button className={styles.textBtn} onClick={() => navigate('/tanks')}>View All ({tanks.length})</button>
            )}
          </div>

          {loadingTanks ? (
             <div className={styles.emptyState}>Loading tanks…</div>
          ) : activeTank ? (
            <div className={styles.tankOverviewCard} onClick={() => navigate(`/tanks/${activeTank.id}`)}>
              <div className={styles.tankOverviewHeader}>
                <h4>Tank: {activeTank.name} ({activeTank.sizeLiters}L)</h4>
                <FaFish className={styles.tankOverviewIcon} />
              </div>
              <ul className={styles.tankOverviewStats}>
                <li><strong>Inhabitants:</strong> {activeTank.fish?.length || 0} Fish</li>
                <li><strong>Current State:</strong> {readings?.temperature?.value?.toFixed(1) || '--'}°C | {readings?.ph?.value?.toFixed(1) || '--'} pH</li>
              </ul>
              <div className={styles.tankOverviewFooter}>
                Tap to view details & analytics →
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              No tanks yet
              <button className={styles.addTankBtn} onClick={() => navigate('/tanks')}>
                <FaPlus /> Add Your First Tank
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;