// --- Tank Health Score Calculation ---
const PARAM_WEIGHTS = {
  ph: 1.5,
  ammonia: 1.2,
  temperature: 0.8,
  turbidity: 0.5,
};

function getTankHealthScore({ ph, ammonia, temperature, turbidity }) {
  let score = 0;
  // pH: 6.8 - 7.4 is good
  if (ph >= 6.8 && ph <= 7.4) score += PARAM_WEIGHTS.ph;
  // Ammonia: 0 - 0.25 ppm is good
  if (ammonia >= 0 && ammonia <= 0.25) score += PARAM_WEIGHTS.ammonia;
  // Temperature: 24 - 26°C is good
  if (temperature >= 24 && temperature <= 26) score += PARAM_WEIGHTS.temperature;
  // Turbidity: < 3 NTU is good
  if (turbidity < 3) score += PARAM_WEIGHTS.turbidity;
  return score;
}
import React, { useState, useEffect } from 'react';
import { getSensorData, getTanks } from '../../services/api.js';
import Card from '../../components/common/card/card.jsx';
import InfoTooltip from '../../components/common/InfoTooltip/InfoTooltip';
import {
  TemperatureChart,
  PhChart,
  TurbidityChart,
  AmmoniaChart,
  WaterQualitySummary,
  MultiParameterChart,
} from '../../components/charts/SensorCharts.jsx';
import styles from './Analytics.module.scss';
import { 
  FaThermometerHalf, 
  FaTint, 
  FaWater, 
  FaFlask,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaSyncAlt
} from 'react-icons/fa';

const TIME_RANGES = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

// ============================================
// METRIC INFO - Easy to edit! Change text below.
// To add links: add learnMoreUrl: 'https://...'
// ============================================
const METRIC_INFO = {
  temperature: {
    title: 'Temperature',
    whatIsIt: 'How warm or cold your water is.',
    whyItMatters: 'Fish are cold-blooded. Wrong temp = stressed or sick fish.',
    ideal: '24-26°C (75-79°F)',
    danger: 'Below 22°C or above 28°C',
    learnMoreUrl: null,
  },
  ph: {
    title: 'pH Level',
    whatIsIt: 'How acidic or alkaline your water is. 7 = neutral.',
    whyItMatters: 'Wrong pH hurts fish gills and skin.',
    ideal: '6.8-7.4 for most fish',
    danger: 'Below 6.5 or above 8.0',
    learnMoreUrl: null,
  },
  ammonia: {
    title: 'Ammonia',
    whatIsIt: 'Toxic stuff from fish poop and leftover food.',
    whyItMatters: 'Even tiny amounts are poisonous to fish!',
    ideal: '0 ppm (zero is best!)',
    danger: 'Above 0.25 ppm - do water change!',
    learnMoreUrl: null,
  },
  turbidity: {
    title: 'Turbidity',
    whatIsIt: 'How cloudy or clear your water looks.',
    whyItMatters: 'Cloudy = bacteria or dirt. Fish need clear water.',
    ideal: 'Under 3 NTU (crystal clear)',
    danger: 'Above 5 NTU - check filter!',
    learnMoreUrl: null,
  },
  waterQualityScore: {
    title: 'Water Quality Score',
    whatIsIt: 'A simple score showing how healthy your tank water is overall.',
    whyItMatters: 'A high score means your fish are safe and happy. A low score means something needs fixing.',
    ideal: 'Aim for 70+ (green is great!)',
    danger: 'Below 50 is risky. Check your water and fix problems.',
    learnMoreUrl: null,
  },
};

/**
 * Analytics Dashboard - Sensor Data Visualization
 * UC 4: View Sensor Data
 */
function Analytics() {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load tanks on mount
  useEffect(() => {
    const loadTanks = async () => {
      try {
        const data = await getTanks();
        setTanks(data || []);
        if (data && data.length > 0) {
          setSelectedTank(data[0].id);
        }
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
      case 'rising': return <FaArrowUp className={styles.trendUp} />;
      case 'falling': return <FaArrowDown className={styles.trendDown} />;
      default: return <FaMinus className={styles.trendStable} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'optimal': return styles.statusOptimal;
      case 'warning': return styles.statusWarning;
      case 'critical': return styles.statusCritical;
      default: return '';
    }
  };

  const getTimeRangeLabel = () => {
    return TIME_RANGES.find(r => r.value === timeRange)?.label || timeRange;
  };

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

  // --- Tank Health Score values ---
  let tankHealthScore = null, tankHealthMax = 0, tankHealthPercent = 0, tankHealthEmoji = '😃';
  if (sensorData && sensorData.currentReadings) {
    const { ph, ammonia, temperature, turbidity } = sensorData.currentReadings;
    tankHealthScore = getTankHealthScore({
      ph: ph?.value,
      ammonia: ammonia?.value,
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
          <p>Loading sensor data...</p>
        </div>
      ) : sensorData ? (
        <>
          {/* Current Readings Cards */}
          <div className={styles.currentReadings}>
            <Card className={`${styles.readingCard} ${getStatusClass(sensorData.currentReadings?.temperature?.status)}`}>
              <div className={styles.readingIcon}>
                <FaThermometerHalf />
              </div>
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
              <div className={styles.readingIcon}>
                <FaTint />
              </div>
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
              <div className={styles.readingIcon}>
                <FaWater />
              </div>
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
            
            <Card className={`${styles.readingCard} ${getStatusClass(sensorData.currentReadings?.ammonia?.status)}`}>
              <div className={styles.readingIcon}>
                <FaFlask />
              </div>
              <div className={styles.readingInfo}>
                <div className={styles.labelRow}>
                  <span className={styles.readingLabel}>Ammonia</span>
                  <InfoTooltip {...METRIC_INFO.ammonia} />
                </div>
                <span className={styles.readingValue}>
                  {sensorData.currentReadings?.ammonia?.value?.toFixed(2)}
                  <span className={styles.unit}>{sensorData.currentReadings?.ammonia?.unit}</span>
                </span>
              </div>
              <div className={styles.trend}>
                {getTrendIcon(sensorData.currentReadings?.ammonia?.trend)}
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
                  ideal="4/4 (100%) means all readings are perfect!"
                  danger="If below 3/4, check your pH and ammonia first."
                  learnMoreUrl="https://www.aquariumcoop.com/blogs/aquarium/water-parameters"
                />
              </div>
              <div className={styles.tankHealthScoreRow}>
                <span style={{ fontSize: '2rem', marginRight: 8 }}>{tankHealthEmoji}</span>
                <span style={{ fontWeight: 700, fontSize: '1.3rem' }}>{tankHealthScore?.toFixed(1)} / {tankHealthMax} ({tankHealthPercent}%)</span>
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

            {/* Temperature Chart */}
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

            {/* Ammonia Chart */}
            <Card className={styles.chartCard}>
              <h3><FaFlask /> Ammonia Levels</h3>
              <AmmoniaChart data={sensorData.ammonia} timeRange={getTimeRangeLabel()} />
            </Card>

            {/* Multi-Parameter Overview */}
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
