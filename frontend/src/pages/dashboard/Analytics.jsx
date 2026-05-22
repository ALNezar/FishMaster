import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSensorData, getTanks, useTemperatureStream } from '../../api';
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
} from 'react-icons/fa';

// ─── Constants ────────────────────────────────────────────────────────────────

const PARAM_WEIGHTS = { ph: 1.5, temperature: 0.8, turbidity: 0.5 };
const HEALTH_MAX = Object.values(PARAM_WEIGHTS).reduce((a, b) => a + b, 0);

const TIME_RANGES = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d',  label: 'Last 7 Days'   },
  { value: '30d', label: 'Last 30 Days'  },
];

const METRIC_INFO = {
  temperature: {
    title:        'Temperature',
    whatIsIt:     'How warm or cold your water is.',
    whyItMatters: 'Fish are cold-blooded — wrong temp means stressed or sick fish.',
    ideal:        '24–26 °C (75–79 °F)',
    danger:       'Below 22 °C or above 28 °C',
    learnMoreUrl: null,
  },
  ph: {
    title:        'pH Level',
    whatIsIt:     'How acidic or alkaline your water is. 7 = neutral.',
    whyItMatters: 'Wrong pH damages fish gills and skin.',
    ideal:        '6.8–7.4 for most fish',
    danger:       'Below 6.5 or above 8.0',
    learnMoreUrl: null,
  },
  turbidity: {
    title:        'Turbidity',
    whatIsIt:     'How cloudy or clear your water looks.',
    whyItMatters: 'Cloudiness signals bacteria or excess particulates.',
    ideal:        'Under 3 NTU (crystal clear)',
    danger:       'Above 5 NTU — check your filter!',
    learnMoreUrl: null,
  },
  waterQualityScore: {
    title:        'Water Quality Score',
    whatIsIt:     'An overall health score for your tank water.',
    whyItMatters: 'A high score means your fish are safe and happy.',
    ideal:        'Aim for 70+ (green is great!)',
    danger:       'Below 50 is risky — check your readings.',
    learnMoreUrl: null,
  },
};

const STATUS_LEGEND = [
  { color: '#16a34a', label: 'Optimal Parameters'  },
  { color: '#ca8a04', label: 'Needs Attention'     },
  { color: '#dc2626', label: 'Critical'             },
];

const READING_CONFIGS = [
  { key: 'temperature', label: 'Temperature', icon: <FaThermometerHalf />, info: METRIC_INFO.temperature },
  { key: 'ph',          label: 'pH Level',    icon: <FaTint />,            info: METRIC_INFO.ph          },
  { key: 'turbidity',   label: 'Turbidity',   icon: <FaWater />,           info: METRIC_INFO.turbidity   },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getTankHealthScore({ ph, temperature, turbidity }) {
  let score = 0;
  if (ph >= 6.8 && ph <= 7.4)         score += PARAM_WEIGHTS.ph;
  if (temperature >= 24 && temperature <= 26) score += PARAM_WEIGHTS.temperature;
  if (turbidity < 3)                   score += PARAM_WEIGHTS.turbidity;
  return score;
}

function getHealthEmoji(pct) {
  if (pct >= 80) return '😃';
  if (pct >= 60) return '😐';
  return '😟';
}

function deriveTrend(nextVal, prevVal) {
  if (prevVal == null) return 'stable';
  if (nextVal > prevVal) return 'rising';
  if (nextVal < prevVal) return 'falling';
  return 'stable';
}

function mergeTemperatureReading(prev, liveTemp) {
  if (!prev) return prev;
  const value  = Number(liveTemp.temperature);
  const prevVal = prev.currentReadings?.temperature?.value;
  return {
    ...prev,
    currentReadings: {
      ...prev.currentReadings,
      temperature: {
        value,
        unit:   '°C',
        status: value < 22 || value > 28 ? 'warning' : 'optimal',
        trend:  deriveTrend(value, prevVal),
      },
    },
    temperature: prev.temperature
      ? {
          ...prev.temperature,
          labels: [
            ...prev.temperature.labels,
            new Date(liveTemp.serverTimestamp).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit',
            }),
          ],
          values: [...prev.temperature.values, value],
        }
      : prev.temperature,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendIcon({ trend }) {
  if (trend === 'rising')  return <FaArrowUp   className={styles.trendUp}     />;
  if (trend === 'falling') return <FaArrowDown  className={styles.trendDown}   />;
  return                          <FaMinus      className={styles.trendStable} />;
}

function ReadingCard({ icon, label, info, reading }) {
  const statusClass = reading?.status ? styles[`status${capitalize(reading.status)}`] : '';

  return (
    <Card className={`${styles.readingCard} ${statusClass}`}>
      <div className={styles.readingIcon}>{icon}</div>
      <div className={styles.readingInfo}>
        <div className={styles.labelRow}>
          <span className={styles.readingLabel}>{label}</span>
          <InfoTooltip {...info} />
        </div>
        <span className={styles.readingValue}>
          {reading?.value?.toFixed(1) ?? '—'}
          {reading?.unit && <span className={styles.unit}>{reading.unit}</span>}
        </span>
      </div>
      <div className={styles.trend}>
        <TrendIcon trend={reading?.trend} />
      </div>
    </Card>
  );
}

function LiveIndicator({ connected }) {
  return (
    <div
      className={`${styles.liveIndicator} ${connected ? styles.liveConnected : styles.liveReconnecting}`}
      title={connected ? 'Live data connected' : 'Reconnecting…'}
    >
      <span className={styles.liveDot} aria-hidden="true" />
      <span>{connected ? 'Live' : 'Reconnecting…'}</span>
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Analytics Dashboard — Sensor Data Visualization
 * Temperature is live via SSE from the real backend.
 * pH and turbidity use mock data until those sensors are wired up.
 */
function Analytics() {
  const [tanks,        setTanks       ] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [timeRange,    setTimeRange   ] = useState('24h');
  const [sensorData,   setSensorData  ] = useState(null);
  const [loading,      setLoading     ] = useState(true);
  const [error,        setError       ] = useState(null);
  const [lastRefresh,  setLastRefresh ] = useState(new Date());

  // Live temperature via SSE — updates the card in real time without polling
  const { lastReading: liveTemp, connected: sseConnected } = useTemperatureStream();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchSensorData = useCallback(async (tankId, range) => {
    if (!tankId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSensorData(tankId, range);
      setSensorData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load sensor data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tanks on mount
  useEffect(() => {
    const loadTanks = async () => {
      try {
        const data = await getTanks();
        setTanks(data || []);
        if (data?.length > 0) setSelectedTank(data[0].id);
      } catch (err) {
        setError('Failed to load tanks.');
        console.error(err);
      }
    };
    loadTanks();
  }, []);

  // Refetch when tank or time range changes
  useEffect(() => {
    fetchSensorData(selectedTank, timeRange);
  }, [selectedTank, timeRange, fetchSensorData]);

  // Merge live SSE temperature into sensorData
  useEffect(() => {
    if (!liveTemp) return;
    setSensorData(prev => mergeTemperatureReading(prev, liveTemp));
    setLastRefresh(new Date());
  }, [liveTemp]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const healthStats = useMemo(() => {
    const readings = sensorData?.currentReadings;
    if (!readings) return null;

    const score   = getTankHealthScore({
      ph:          readings.ph?.value,
      temperature: readings.temperature?.value,
      turbidity:   readings.turbidity?.value,
    });
    const percent = Math.round((score / HEALTH_MAX) * 100);

    return { score, percent, emoji: getHealthEmoji(percent) };
  }, [sensorData?.currentReadings]);

  const timeRangeLabel = useMemo(
    () => TIME_RANGES.find(r => r.value === timeRange)?.label ?? timeRange,
    [timeRange],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRefresh    = useCallback(() => fetchSensorData(selectedTank, timeRange), [fetchSensorData, selectedTank, timeRange]);
  const handleTankChange = useCallback((e) => setSelectedTank(Number(e.target.value)), []);
  const handleRangeChange= useCallback((e) => setTimeRange(e.target.value), []);

  // ── Render ─────────────────────────────────────────────────────────────────

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

  return (
    <div className={styles.analyticsContainer}>

      {/* ── Controls ── */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="tank-select">Select Tank</label>
          <select
            id="tank-select"
            value={selectedTank ?? ''}
            onChange={handleTankChange}
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
          <label htmlFor="range-select">Time Range</label>
          <select
            id="range-select"
            value={timeRange}
            onChange={handleRangeChange}
            className={styles.select}
          >
            {TIME_RANGES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh sensor data"
        >
          <FaSyncAlt className={loading ? styles.spinning : ''} />
          Refresh
        </button>

        <LiveIndicator connected={sseConnected} />
      </div>

      <p className={styles.lastUpdate}>
        Last updated: {lastRefresh.toLocaleTimeString()}
      </p>

      {/* ── Error banner ── */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <FaExclamationTriangle aria-hidden="true" />
          {error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && !sensorData && (
        <div className={styles.loadingState} aria-live="polite" aria-label="Loading sensor data">
          <div className={styles.spinner} />
          <p>Loading sensor data…</p>
        </div>
      )}

      {/* ── Main content ── */}
      {sensorData && (
        <>
          {/* Current Readings */}
          <div className={styles.currentReadings}>
            {READING_CONFIGS.map(({ key, label, icon, info }) => (
              <ReadingCard
                key={key}
                icon={icon}
                label={label}
                info={info}
                reading={sensorData.currentReadings?.[key]}
              />
            ))}
          </div>

          {/* Charts */}
          <div className={styles.chartsGrid}>

            {/* Health Score Summary */}
            <Card className={styles.summaryCard}>
              <div className={styles.labelRow}>
                <h3><FaCheckCircle /> Tank Health Score</h3>
                <InfoTooltip
                  title="Tank Health Score"
                  whatIsIt="A quick way to see if your tank is safe for fish."
                  whyItMatters="If this score drops, your fish could be stressed or sick."
                  ideal={`${HEALTH_MAX.toFixed(1)} / ${HEALTH_MAX.toFixed(1)} (100%) means all readings are perfect!`}
                  danger="If below 60%, check your pH first."
                  learnMoreUrl="https://www.aquariumcoop.com/blogs/aquarium/water-parameters"
                />
              </div>

              {healthStats && (
                <div className={styles.tankHealthScoreRow}>
                  <span className={styles.healthEmoji} aria-hidden="true">
                    {healthStats.emoji}
                  </span>
                  <span className={styles.healthScore}>
                    {healthStats.score.toFixed(1)}
                    <span className={styles.healthMax}> / {HEALTH_MAX.toFixed(1)}</span>
                    <span className={styles.healthPercent}> ({healthStats.percent}%)</span>
                  </span>
                </div>
              )}

              <ul className={styles.summaryLegend} aria-label="Status legend">
                {STATUS_LEGEND.map(({ color, label }) => (
                  <li key={label} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: color }} aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Individual Parameter Charts */}
            <Card className={styles.chartCard}>
              <h3><FaThermometerHalf /> Temperature</h3>
              <TemperatureChart data={sensorData.temperature} timeRange={timeRangeLabel} />
            </Card>

            <Card className={styles.chartCard}>
              <h3><FaTint /> pH Level</h3>
              <PhChart data={sensorData.ph} timeRange={timeRangeLabel} />
            </Card>

            <Card className={styles.chartCard}>
              <h3><FaWater /> Turbidity</h3>
              <TurbidityChart data={sensorData.turbidity} timeRange={timeRangeLabel} />
            </Card>

            {/* Multi-Parameter Overview */}
            <Card className={styles.wideCard}>
              <h3><FaChartLine /> All Parameters Overview</h3>
              <MultiParameterChart data={sensorData.multiParam} timeRange={timeRangeLabel} />
            </Card>

          </div>
        </>
      )}

      {/* ── No data state ── */}
      {!loading && !sensorData && !error && (
        <div className={styles.noDataState}>
          <FaExclamationTriangle />
          <h3>No Data Available</h3>
          <p>No sensor readings found for this time period. Try a different range.</p>
        </div>
      )}

    </div>
  );
}

export default Analytics;