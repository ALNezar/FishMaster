// --- Tank Health Score Calculation (ammonia removed — no live sensor) ---
const PARAM_WEIGHTS = {
  ph: 1.5,
  temperature: 0.8,
  turbidity: 0.5,
};

function getTankHealthScore({ ph, temperature, turbidity }) {
  let score = 0;
  if (ph >= 6.8 && ph <= 7.4) score += PARAM_WEIGHTS.ph;
  if (temperature >= 24 && temperature <= 26) score += PARAM_WEIGHTS.temperature;
  if (turbidity < 3) score += PARAM_WEIGHTS.turbidity;
  return score;
}

import React, { useState, useEffect, useRef } from 'react';
import { getSensorData, getTanks, useTemperatureStream } from '../../services/api.js';
import Card from '../../components/common/card/card.jsx';
import InfoTooltip from '../../components/common/InfoTooltip/InfoTooltip';
import {
  TemperatureChart,
  PhChart,
  TurbidityChart,
  WaterQualitySummary,
  MultiParameterChart,
} from '../../components/charts/SensorCharts.jsx';
import styles from './Analytics.module.scss';
import {
  FaThermometerHalf,
  FaTint,
  FaWater,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaSyncAlt,
  FaCircle,
} from 'react-icons/fa';

const TIME_RANGES = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

const METRIC_INFO = {
  temperature: {
    title: 'Temperature',
    whatIsIt: 'How warm or cold your water is.',
    whyItMatters: 'Fish are cold-blooded. Wrong temp = stressed or sick fish.',
    ideal: '24–26°C (75–79°F)',
    danger: 'Below 22°C or above 28°C',
    learnMoreUrl: null,
  },
  ph: {
    title: 'pH Level',
    whatIsIt: 'How acidic or alkaline your water is. 7 = neutral.',
    whyItMatters: 'Wrong pH hurts fish gills and skin.',
    ideal: '6.8–7.4 for most fish',
    danger: 'Below 6.5 or above 8.0',
    learnMoreUrl: null,
  },
  turbidity: {
    title: 'Turbidity',
    whatIsIt: 'How cloudy or clear your water looks.',
    whyItMatters: 'Cloudy = bacteria or dirt. Fish need clear water.',
    ideal: 'Under 3 NTU (crystal clear)',
    danger: 'Above 5 NTU — check filter!',
    learnMoreUrl: null,
  },
  waterQualityScore: {
    title: 'Water Quality Score',
    whatIsIt: 'A simple score showing how healthy your tank water is overall.',
    whyItMatters: 'A high score means your fish are safe and happy.',
    ideal: 'Aim for 70+ (green is great!)',
    danger: 'Below 50 is risky. Check your water and fix problems.',
    learnMoreUrl: null,
  },
};

/**
 * Analytics Dashboard — Sensor Data Visualization
 * Temperature is live via SSE from the real backend.
 * pH and turbidity use mock data until those sensors are wired up.
 */
function Analytics() {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Live temperature via SSE — updates the card in real time without polling
  const { lastReading: liveTemp, connected: sseConnected } = useTemperatureStream();

  // Load tanks on mount
  useEffect(() => {
    const loadTanks = async () => {
      try {
        const data = await getTanks();
        setTanks(data || []);
        if (data && data.length > 0) setSelectedTank(data[0].id);
      } catch (err) {
        setError('Failed to load tanks');
        console.error(err);
      }
    };
    loadTanks();
  }, []);

  // Load sensor data when tank or time range changes
  useEffect(() => {
    const loadSensorData = async () => {
      if (!selectedTank) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getSensorData(selectedTank, timeRange);
        setSensorData(data);
        setLastRefresh(new Date());
      } catch (err) {
        setError('Failed to load sensor data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSensorData();
  }, [selectedTank, timeRange]);

  // Merge live SSE temperature into sensorData so card + chart update in real time
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
        // Append new point to the temperature chart
        temperature: prev.temperature
          ? {
              ...prev.temperature,
              labels: [
                ...prev.temperature.labels,
                new Date(liveTemp.serverTimestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              ],
              values: [...prev.temperature.values, value],
            }
          : prev.temperature,
      };
    });
    setLastRefresh(new Date());
  }, [liveTemp]);

  const handleRefresh = async () => {
    if (!selectedTank) return;
    setLoading(true);
    try {
      const data = await getSensorData(selectedTank, timeRange);
      setSensorData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising':  return <FaArrowUp className={styles.trendUp} />;
      case 'falling': return <FaArrowDown className={styles.trendDown} />;
      default:        return <FaMinus className={styles.trendStable} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'optimal':  return styles.statusOptimal;
      case 'warning':  return styles.statusWarning;
      case 'critical': return styles.statusCritical;
      default:         return '';
    }
  };

  const getTimeRangeLabel = () =>
    TIME_RANGES.find(r => r.value === timeRange)?.label || timeRange;

  if (tanks.length === 0 && !loading) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.emptyState}>
          <FaChartLine className={styles.emptyIcon} />
          <h2>No Tanks Available</h2>
          <p>Add a tank to start viewing sensor data and analytics.</p>
        </div>
      </div>
    );
  }

  // Health score (no ammonia)
  let tankHealthScore = null, tankHealthMax = 0, tankHealthPercent = 0, tankHealthEmoji = '😃';
  if (sensorData?.currentReadings) {
    const { ph, temperature, turbidity } = sensorData.currentReadings;
    tankHealthScore = getTankHealthScore({
      ph: ph?.value,
      temperature: temperature?.value,
      turbidity: turbidity?.value,
    });
    tankHealthMax = Object.values(PARAM_WEIGHTS).reduce((a, b) => a + b, 0);
    tankHealthPercent = Math.round((tankHealthScore / tankHealthMax) * 100);
    if (tankHealthPercent < 80 && tankHealthPercent >= 60) tankHealthEmoji = '😐';
    else if (tankHealthPercent < 60) tankHealthEmoji = '😟';
  }

  return (
    <div className={styles.analyticsContainer}>
      {/* Header Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Select Tank</label>
          <select
            value={selectedTank || ''}
            onChange={(e) => setSelectedTank(Number(e.target.value))}
            className={styles.select}
          >
            {tanks.map(tank => (
              <option key={tank.id} value={tank.id}>
                {tank.name} ({tank.sizeLiters}L)
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={styles.select}
          >
            {TIME_RANGES.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={loading}
        >
          <FaSyncAlt className={loading ? styles.spinning : ''} />
          Refresh
        </button>

        {/* SSE live indicator */}
        <div className={styles.liveIndicator} title={sseConnected ? 'Live data connected' : 'Reconnecting…'}>
          <FaCircle style={{ color: sseConnected ? '#16a34a' : '#ca8a04', fontSize: '0.55rem' }} />
          <span>{sseConnected ? 'Live' : 'Reconnecting…'}</span>
        </div>
      </div>

      <div className={styles.lastUpdate}>
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {loading && !sensorData ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading sensor data…</p>
        </div>
      ) : sensorData ? (
        <>
          {/* Current Readings Cards — ammonia removed */}
          <div className={styles.currentReadings}>
            <Card className={`${styles.readingCard} ${getStatusClass(sensorData.currentReadings?.temperature?.status)}`}>
              <div className={styles.readingIcon}><FaThermometerHalf /></div>
              <div className={styles.readingInfo}>
                <div className={styles.labelRow}>
                  <span className={styles.readingLabel}>Temperature</span>
                  <InfoTooltip {...METRIC_INFO.temperature} />
                </div>
                <span className={styles.readingValue}>
                  {sensorData.currentReadings?.temperature?.value?.toFixed(1)}
                  <span className={styles.unit}>{sensorData.currentReadings?.temperature?.unit}</span>
                </span>
              </div>
              <div className={styles.trend}>
                {getTrendIcon(sensorData.currentReadings?.temperature?.trend)}
              </div>
            </Card>

            <Card className={`${styles.readingCard} ${getStatusClass(sensorData.currentReadings?.ph?.status)}`}>
              <div className={styles.readingIcon}><FaTint /></div>
              <div className={styles.readingInfo}>
                <div className={styles.labelRow}>
                  <span className={styles.readingLabel}>pH Level</span>
                  <InfoTooltip {...METRIC_INFO.ph} />
                </div>
                <span className={styles.readingValue}>
                  {sensorData.currentReadings?.ph?.value?.toFixed(1)}
                </span>
              </div>
              <div className={styles.trend}>
                {getTrendIcon(sensorData.currentReadings?.ph?.trend)}
              </div>
            </Card>

            <Card className={`${styles.readingCard} ${getStatusClass(sensorData.currentReadings?.turbidity?.status)}`}>
              <div className={styles.readingIcon}><FaWater /></div>
              <div className={styles.readingInfo}>
                <div className={styles.labelRow}>
                  <span className={styles.readingLabel}>Turbidity</span>
                  <InfoTooltip {...METRIC_INFO.turbidity} />
                </div>
                <span className={styles.readingValue}>
                  {sensorData.currentReadings?.turbidity?.value?.toFixed(1)}
                  <span className={styles.unit}>{sensorData.currentReadings?.turbidity?.unit}</span>
                </span>
              </div>
              <div className={styles.trend}>
                {getTrendIcon(sensorData.currentReadings?.turbidity?.trend)}
              </div>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className={styles.chartsGrid}>
            {/* Tank Health Score */}
            <Card className={styles.summaryCard}>
              <div className={styles.labelRow}>
                <h3><FaCheckCircle /> Tank Health Score</h3>
                <InfoTooltip
                  title="Tank Health Score"
                  whatIsIt="A quick way to see if your tank is safe for fish."
                  whyItMatters="If this score drops, your fish could be stressed or sick."
                  ideal={`${tankHealthMax.toFixed(1)} / ${tankHealthMax.toFixed(1)} (100%) means all readings are perfect!`}
                  danger="If below 60%, check your pH first."
                  learnMoreUrl="https://www.aquariumcoop.com/blogs/aquarium/water-parameters"
                />
              </div>
              <div className={styles.tankHealthScoreRow}>
                <span style={{ fontSize: '2rem', marginRight: 8 }}>{tankHealthEmoji}</span>
                <span style={{ fontWeight: 700, fontSize: '1.3rem' }}>
                  {tankHealthScore?.toFixed(1)} / {tankHealthMax.toFixed(1)} ({tankHealthPercent}%)
                </span>
              </div>
              <div className={styles.summaryLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#16a34a' }}></span>
                  Optimal Parameters
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#ca8a04' }}></span>
                  Needs Attention
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#dc2626' }}></span>
                  Critical
                </div>
              </div>
            </Card>

            {/* Temperature Chart — fed by real backend data */}
            <Card className={styles.chartCard}>
              <h3><FaThermometerHalf /> Temperature</h3>
              <TemperatureChart data={sensorData.temperature} timeRange={getTimeRangeLabel()} />
            </Card>

            {/* pH Chart */}
            <Card className={styles.chartCard}>
              <h3><FaTint /> pH Level</h3>
              <PhChart data={sensorData.ph} timeRange={getTimeRangeLabel()} />
            </Card>

            {/* Turbidity Chart */}
            <Card className={styles.chartCard}>
              <h3><FaWater /> Turbidity</h3>
              <TurbidityChart data={sensorData.turbidity} timeRange={getTimeRangeLabel()} />
            </Card>

            {/* Multi-Parameter Overview (temperature + ph only) */}
            <Card className={styles.wideCard}>
              <h3><FaChartLine /> All Parameters Overview</h3>
              <MultiParameterChart data={sensorData.multiParam} timeRange={getTimeRangeLabel()} />
            </Card>
          </div>
        </>
      ) : (
        <div className={styles.noDataState}>
          <FaExclamationTriangle />
          <h3>No Data Available</h3>
          <p>No sensor readings available for the selected time period. Try selecting a different time range.</p>
        </div>
      )}
    </div>
  );
}

export default Analytics;