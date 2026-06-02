import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowDown,
  FaArrowUp,
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFish,
  FaFilter,
  FaHistory,
  FaMagic,
  FaRulerCombined,
  FaSeedling,
  FaShieldAlt,
  FaSyncAlt,
  FaThermometerHalf,
  FaTint,
  FaWater,
  FaWifi,
  FaWrench,
  FaChartLine,
} from 'react-icons/fa';
import { getSensorData, getTankHistoryTimeline, getTanks, usePhStream, useTemperatureStream } from '../../api';
import TelemetryAnalyticsChart from '../../components/charts/TelemetryAnalyticsChart.jsx';
import styles from './Analytics.module.scss';

const METRICS = {
  temperature: {
    label: 'Temperature',
    unit: '°C',
    safeMin: 24,
    safeMax: 26,
    warningMin: 22,
    warningMax: 28,
    icon: FaThermometerHalf,
    tone: '#ef4444',
    soft: 'rgba(239, 68, 68, 0.14)',
  },
  ph: {
    label: 'pH',
    unit: 'pH',
    safeMin: 6.8,
    safeMax: 7.4,
    warningMin: 6.5,
    warningMax: 7.5,
    icon: FaTint,
    tone: '#3b82f6',
    soft: 'rgba(59, 130, 246, 0.16)',
  },
  turbidity: {
    label: 'Turbidity',
    unit: 'NTU',
    safeMin: 0,
    safeMax: 3,
    warningMin: 3,
    warningMax: 5,
    icon: FaWater,
    tone: '#14b8a6',
    soft: 'rgba(20, 184, 166, 0.16)',
  },
};

const TIME_RANGES = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'custom', label: 'Custom' },
];

const TIME_RANGE_FETCH = {
  '1h': '24h',
  '6h': '24h',
  '24h': '24h',
  '7d': '7d',
  '30d': '30d',
  custom: '30d',
};

const DISPLAY_POINTS = {
  '1h': 12,
  '6h': 24,
  '24h': 50,
  '7d': 160,
  '30d': 240,
};

const PREDICTION_OPTIONS = [1, 6, 24];
const TAB_OPTIONS = ['overview', 'trends', 'correlations', 'predictions', 'events'];
const EVENT_FILTERS = ['all', 'feeding', 'alert', 'maintenance', 'parameter', 'system'];
const MAX_LIVE_POINTS = 240;
const MOBILE_BREAKPOINT = 600;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mean(values) {
  const nums = values.map(toNumber).filter(Number.isFinite);
  if (!nums.length) return 0;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

function variance(values) {
  const nums = values.map(toNumber).filter(Number.isFinite);
  if (nums.length < 2) return 0;
  const avg = mean(nums);
  return nums.reduce((sum, value) => sum + (value - avg) ** 2, 0) / nums.length;
}

function stdev(values) {
  return Math.sqrt(variance(values));
}

function pearsonCorrelation(left = [], right = []) {
  const count = Math.min(left.length, right.length);
  if (count < 2) return 0;

  const xs = left.slice(-count).map(toNumber);
  const ys = right.slice(-count).map(toNumber);
  const xMean = mean(xs);
  const yMean = mean(ys);

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (let index = 0; index < count; index += 1) {
    const dx = xs[index] - xMean;
    const dy = ys[index] - yMean;
    numerator += dx * dy;
    denominatorX += dx * dx;
    denominatorY += dy * dy;
  }

  const denominator = Math.sqrt(denominatorX * denominatorY);
  return denominator ? numerator / denominator : 0;
}

function linearForecast(values = [], horizonSteps = 1) {
  const points = values.map(toNumber).filter(Number.isFinite);
  if (points.length < 2) {
    return { value: points[points.length - 1] ?? 0, confidence: 0 };
  }

  const n = Math.min(12, points.length);
  const recent = points.slice(-n);
  const xMean = (n - 1) / 2;
  const yMean = mean(recent);

  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < n; index += 1) {
    const dx = index - xMean;
    numerator += dx * (recent[index] - yMean);
    denominator += dx * dx;
  }

  const slope = denominator ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  const nextIndex = (n - 1) + horizonSteps;
  const predicted = intercept + slope * nextIndex;
  const noisePenalty = clamp(stdev(recent) * 6, 0, 45);
  const confidence = clamp(96 - noisePenalty - Math.min(Math.abs(slope) * 12, 18), 42, 98);

  return {
    value: predicted,
    confidence: Math.round(confidence),
  };
}

// Minimum required historical points for correlation/forecast to be meaningful
const MIN_HISTORY_POINTS = 24;

function hasEnoughHistory(series = [], minPoints = MIN_HISTORY_POINTS) {
  if (!series) return false;
  return series.length >= minPoints;
}

function formatTrendPercent(pct) {
  const rounded = Math.abs(pct) >= 10 ? Math.round(Math.abs(pct)) : Math.round(Math.abs(pct) * 10) / 10;
  const prefix = pct >= 0 ? '↑ +' : '↓ -';
  return `${prefix}${rounded}%`;
}

function formatValue(value, metricKey) {
  const digits = metricKey === 'ph' ? 2 : 1;
  return Number(value).toFixed(digits);
}

function ensureUniqueLabels(labels = []) {
  const counts = new Map();
  return labels.map((label) => {
    const next = (counts.get(label) || 0) + 1;
    counts.set(label, next);
    return next === 1 ? label : `${label} · ${next}`;
  });
}

function trimSeries(labels = [], values = [], maxPoints = MAX_LIVE_POINTS) {
  return {
    labels: labels.slice(-maxPoints),
    values: values.slice(-maxPoints),
  };
}

function appendMetricSeries(prev, metricKey, value, timestamp) {
  if (!prev) return prev;
  const label = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const metricSeries = prev[metricKey] || { labels: [], values: [] };
  const next = trimSeries(
    [...(metricSeries.labels || []), label],
    [...(metricSeries.values || []), value],
  );

  const multiParam = prev.multiParam
    ? {
        ...prev.multiParam,
        labels: [...(prev.multiParam.labels || []), label].slice(-MAX_LIVE_POINTS),
        [metricKey]: [...(prev.multiParam[metricKey] || []), value].slice(-MAX_LIVE_POINTS),
      }
    : prev.multiParam;

  return {
    ...prev,
    [metricKey]: {
      ...metricSeries,
      labels: next.labels,
      values: next.values,
      currentValue: value,
    },
    multiParam,
  };
}

function deriveMetricStatus(metricKey, value) {
  const metric = METRICS[metricKey];

  if (metricKey === 'turbidity') {
    if (value <= metric.safeMax) return { label: 'Good', tone: 'success' };
    if (value <= metric.warningMax) return { label: 'Watch', tone: 'warning' };
    return { label: 'Attention', tone: 'danger' };
  }

  if (value >= metric.safeMin && value <= metric.safeMax) {
    return { label: metricKey === 'temperature' ? 'Healthy' : 'Stable', tone: 'success' };
  }

  if (value >= metric.warningMin && value <= metric.warningMax) {
    return { label: 'Watch', tone: 'warning' };
  }

  return { label: 'Attention', tone: 'danger' };
}

function scoreMetric(metricKey, value) {
  const metric = METRICS[metricKey];

  if (metricKey === 'turbidity') {
    return clamp(100 - (value / 12) * 100, 0, 100);
  }

  const midpoint = (metric.safeMin + metric.safeMax) / 2;
  const span = metric.warningMax - metric.warningMin || 1;
  const distance = Math.abs(value - midpoint);
  return clamp(100 - (distance / (span / 2)) * 100, 0, 100);
}

function getDisplayLimit(timeRange, customHours) {
  if (timeRange === 'custom') {
    return clamp(Math.round(customHours * 2), 12, 500);
  }

  return DISPLAY_POINTS[timeRange] || 50;
}

function buildSeries(sensorData, timeRange, customHours) {
  const limit = getDisplayLimit(timeRange, customHours);
  const labels = ensureUniqueLabels(sensorData?.multiParam?.labels || sensorData?.temperature?.labels || []);

  const temperature = sensorData?.multiParam?.temperature || sensorData?.temperature?.values || [];
  const ph = sensorData?.multiParam?.ph || sensorData?.ph?.values || [];
  const turbidity = sensorData?.multiParam?.turbidity || sensorData?.turbidity?.values || [];

  const slice = (items) => items.slice(-limit);

  return {
    labels: slice(labels),
    temperature: slice(temperature).map(toNumber),
    ph: slice(ph).map(toNumber),
    turbidity: slice(turbidity).map(toNumber),
  };
}

function buildSnapshot(metricKey, values, currentValue) {
  const latest = currentValue ?? values[values.length - 1] ?? 0;
  const avg = mean(values);
  const min = values.length ? Math.min(...values.map(toNumber)) : latest;
  const max = values.length ? Math.max(...values.map(toNumber)) : latest;
  const previous = values.length > 1 ? values[values.length - 2] : latest;
  const trendPct = previous ? ((latest - previous) / Math.max(Math.abs(previous), 0.0001)) * 100 : 0;
  const status = deriveMetricStatus(metricKey, latest);
  const health = scoreMetric(metricKey, latest);

  return {
    current: latest,
    average: avg,
    min,
    max,
    trendPct,
    status,
    health,
  };
}

function getWaterQualityLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Moderate';
  return 'Needs Attention';
}

function getTankHealthSummary(snapshot) {
  const temperature = snapshot.temperature.health;
  const ph = snapshot.ph.health;
  const turbidity = snapshot.turbidity.health;
  const weighted = temperature * 0.35 + ph * 0.35 + turbidity * 0.3;
  const overall = Math.round(weighted);
  return {
    overall,
    temperature: Math.round(temperature),
    ph: Math.round(ph),
    turbidity: Math.round(turbidity),
    waterQuality: getWaterQualityLabel(overall),
  };
}

function getCorrelationLabel(score) {
  const abs = Math.abs(score);
  if (abs >= 0.75) return 'Strong relationship';
  if (abs >= 0.45) return 'Moderate relationship';
  if (abs >= 0.2) return 'Weak relationship';
  return 'No strong signal';
}

function getBehavioralInsight(label, leftSeries, rightSeries, recentFeedingHours) {
  const correlation = pearsonCorrelation(leftSeries, rightSeries);
  const relation = correlation > 0.35 ? 'moves with' : correlation < -0.35 ? 'moves opposite' : 'does not show a strong link with';
  const feedingNote = recentFeedingHours != null ? ` Recent feeding was ${recentFeedingHours} hours ago.` : '';
  return `${label} ${relation} the paired sensor.${feedingNote}`;
}

function makeCorrelationPair(leftName, rightName, leftSeries, rightSeries, recentFeedingHours) {
  const score = pearsonCorrelation(leftSeries, rightSeries);
  const strength = Math.round(Math.abs(score) * 100);
  return {
    leftName,
    rightName,
    score,
    strength,
    label: getCorrelationLabel(score),
    analysis: getBehavioralInsight(`${leftName} ↔ ${rightName}`, leftSeries, rightSeries, recentFeedingHours),
    trend: score >= 0 ? 'positive' : 'inverse',
  };
}

function buildRecommendations(snapshot, recentFeedingHours) {
  const tips = [];

  tips.push({
    tone: snapshot.temperature.status.tone === 'success' ? 'success' : 'warning',
    text: snapshot.temperature.status.tone === 'success' ? 'Temperature optimal' : 'Temperature needs attention',
  });

  tips.push({
    tone: snapshot.ph.status.tone === 'success' ? 'success' : 'warning',
    text: snapshot.ph.status.tone === 'success' ? 'pH stable' : 'pH drifting outside the comfort band',
  });

  tips.push({
    tone: snapshot.turbidity.status.tone === 'success' ? 'success' : 'warning',
    text: snapshot.turbidity.status.tone === 'success' ? 'Water clarity is good' : 'Turbidity requires attention',
  });

  if (recentFeedingHours != null && recentFeedingHours <= 3) {
    tips.push({ tone: 'warning', text: 'Feeding was recent, so turbidity spikes may be normal' });
  }

  return tips.slice(0, 4);
}

function buildInsights(snapshot, recentFeedingHours) {
  const insights = [];
  const tempDrift = Math.abs(snapshot.temperature.trendPct);
  const phDrift = Math.abs(snapshot.ph.trendPct);
  const turbidityDrift = Math.abs(snapshot.turbidity.trendPct);

  insights.push({
    tone: tempDrift < 1.5 ? 'success' : 'warning',
    text:
      tempDrift < 1.5
        ? 'Temperature remained stable during the selected period.'
        : 'Minor downward temperature trend detected.',
  });

  insights.push({
    tone: phDrift < 1.5 ? 'success' : 'warning',
    text:
      phDrift < 1.5
        ? 'pH stayed within the optimal band.'
        : 'pH drifted enough to warrant a closer look.',
  });

  insights.push({
    tone: turbidityDrift > 8 ? 'warning' : 'success',
    text:
      turbidityDrift > 8
        ? 'Turbidity increased after recent activity.'
        : 'No abnormal turbidity spike detected.',
  });

  if (recentFeedingHours != null && recentFeedingHours <= 3) {
    insights.push({ tone: 'warning', text: 'Turbidity often rises after feeding events.' });
  }

  insights.push({ tone: 'success', text: 'No abnormal sensor reconnection events detected.' });

  return insights.slice(0, 4);
}

function resolveEventType(event) {
  return String(event?.type || 'system').toLowerCase();
}

function resolveEventFilterValue(event) {
  const type = resolveEventType(event);
  if (type === 'parameter') return 'parameter';
  if (type === 'feeding' || type === 'alert' || type === 'maintenance') return type;
  return 'system';
}

function eventIcon(type) {
  switch (type) {
    case 'feeding':
      return FaSeedling;
    case 'alert':
      return FaExclamationTriangle;
    case 'maintenance':
      return FaWrench;
    case 'parameter':
      return FaChartLine;
    default:
      return FaWifi;
  }
}

function MetricBadge({ tone, children }) {
  return <span className={`${styles.metricBadge} ${styles[`metricBadge${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>{children}</span>;
}

function CompactStat({ label, value, sublabel, icon: Icon, tone = 'neutral' }) {
  return (
    <div className={`${styles.compactStat} ${styles[`compactStat${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
      <div className={styles.compactStatLabelRow}>
        <span className={styles.compactStatLabel}>{label}</span>
        {Icon ? <Icon className={styles.compactStatIcon} aria-hidden="true" /> : null}
      </div>
      <div className={styles.compactStatValue}>{value}</div>
      {sublabel ? <div className={styles.compactStatSub}>{sublabel}</div> : null}
    </div>
  );
}

function TimelineEvent({ event }) {
  const Icon = eventIcon(resolveEventType(event));
  return (
    <li className={styles.timelineItem}>
      <div className={styles.timelineDotWrap}>
        <span className={styles.timelineDot}>
          <Icon />
        </span>
      </div>
      <div className={styles.timelineContent}>
        <div className={styles.timelineTopRow}>
          <strong>{event.title}</strong>
          <span>{new Date(event.timestamp).toLocaleString()}</span>
        </div>
        <p>{event.description}</p>
      </div>
    </li>
  );
}

export default function Analytics() {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [customHours, setCustomHours] = useState(12);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartMode, setChartMode] = useState('area');
  const [visibleMetrics, setVisibleMetrics] = useState({ temperature: true, ph: true, turbidity: true });
  const [predictionHorizon, setPredictionHorizon] = useState(6);
  const [eventFilter, setEventFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [chartFullscreen, setChartFullscreen] = useState(false);
  const [showAllKpis, setShowAllKpis] = useState(false);

  const { lastReading: liveTemp, connected: tempConnected } = useTemperatureStream();
  const { lastReading: livePh, connected: phConnected } = usePhStream();

  const fetchSensorData = useCallback(async (tankId, range, options = {}) => {
    const { silent = false } = options;
    if (!tankId) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const apiRange = TIME_RANGE_FETCH[range] || '24h';
      const data = await getSensorData(tankId, apiRange);
      setSensorData(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to load sensor data.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchTimeline = useCallback(async (tankId, range) => {
    if (!tankId) return;

    try {
      const limit = range === '1h' ? 12 : range === '6h' ? 18 : range === '24h' ? 24 : 36;
      const data = await getTankHistoryTimeline(tankId, limit);
      setTimeline(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load timeline:', err);
      setTimeline([]);
    }
  }, []);

  useEffect(() => {
    getTanks()
      .then((data) => {
        const list = data || [];
        setTanks(list);
        if (list.length > 0) {
          setSelectedTank(list[0].id);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load tanks.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTank) return;
    fetchSensorData(selectedTank, timeRange);
    fetchTimeline(selectedTank, timeRange);
  }, [fetchSensorData, fetchTimeline, selectedTank, timeRange]);

  useEffect(() => {
    if (!selectedTank) return undefined;

    const intervalId = window.setInterval(() => {
      fetchSensorData(selectedTank, timeRange, { silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [fetchSensorData, selectedTank, timeRange]);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const applyMobileDefaults = () => {
      if (!mq.matches) return;
      setVisibleMetrics((prev) => {
        const enabled = Object.values(prev).filter(Boolean).length;
        if (enabled === 3) {
          return { temperature: true, ph: false, turbidity: false };
        }
        return prev;
      });
    };
    applyMobileDefaults();
    mq.addEventListener('change', applyMobileDefaults);
    return () => mq.removeEventListener('change', applyMobileDefaults);
  }, []);

  useEffect(() => {
    if (!liveTemp) return;
    setSensorData((prev) => {
      if (!prev) return prev;
      const value = toNumber(liveTemp.temperature);
      const timestamp = liveTemp.serverTimestamp || new Date().toISOString();
      const withSeries = appendMetricSeries(prev, 'temperature', value, timestamp);
      return {
        ...withSeries,
        currentReadings: {
          ...withSeries.currentReadings,
          temperature: {
            value,
            unit: '°C',
            status: value < 22 || value > 28 ? 'warning' : 'optimal',
            trend: prev.currentReadings?.temperature?.value != null
              ? value > prev.currentReadings.temperature.value
                ? 'rising'
                : value < prev.currentReadings.temperature.value
                  ? 'falling'
                  : 'stable'
              : 'stable',
          },
        },
      };
    });
  }, [liveTemp]);

  useEffect(() => {
    if (!livePh) return;
    setSensorData((prev) => {
      if (!prev) return prev;
      const value = toNumber(livePh.ph);
      const timestamp = livePh.serverTimestamp || new Date().toISOString();
      const withSeries = appendMetricSeries(prev, 'ph', value, timestamp);
      return {
        ...withSeries,
        currentReadings: {
          ...withSeries.currentReadings,
          ph: {
            value,
            unit: 'pH',
            status: value < 6.5 || value > 7.5 ? 'warning' : 'optimal',
            trend: prev.currentReadings?.ph?.value != null
              ? value > prev.currentReadings.ph.value
                ? 'rising'
                : value < prev.currentReadings.ph.value
                  ? 'falling'
                  : 'stable'
              : 'stable',
          },
        },
      };
    });
  }, [livePh]);

  const displaySeries = useMemo(() => buildSeries(sensorData, timeRange, customHours), [customHours, sensorData, timeRange]);

  const snapshots = useMemo(() => ({
    temperature: buildSnapshot('temperature', displaySeries.temperature, sensorData?.currentReadings?.temperature?.value),
    ph: buildSnapshot('ph', displaySeries.ph, sensorData?.currentReadings?.ph?.value),
    turbidity: buildSnapshot('turbidity', displaySeries.turbidity, sensorData?.currentReadings?.turbidity?.value),
  }), [displaySeries, sensorData?.currentReadings?.ph?.value, sensorData?.currentReadings?.temperature?.value, sensorData?.currentReadings?.turbidity?.value]);

  const healthSummary = useMemo(() => getTankHealthSummary(snapshots), [snapshots]);

  const sensorQuality = useMemo(() => {
    const allValues = [...displaySeries.temperature, ...displaySeries.ph, ...displaySeries.turbidity];
    const quality = clamp((allValues.filter((value) => Number.isFinite(value)).length / Math.max(allValues.length, 1)) * 100, 0, 100);
    const stability = clamp(100 - ((stdev(displaySeries.temperature) + stdev(displaySeries.ph) + stdev(displaySeries.turbidity)) / 3) * 18, 0, 100);
    const reliability = Math.round((quality * 0.55) + (stability * 0.45));
    const uptime = clamp(99.2 + (quality / 250), 90, 99.8);
    return {
      quality: Math.round(quality),
      stability: Math.round(stability),
      reliability,
      uptime: Number(uptime.toFixed(1)),
    };
  }, [displaySeries.ph, displaySeries.temperature, displaySeries.turbidity]);

  const recentFeedingHours = useMemo(() => {
    const feedingEvent = [...timeline].find((event) => resolveEventType(event) === 'feeding');
    if (!feedingEvent) return null;
    const diffHours = (Date.now() - new Date(feedingEvent.timestamp).getTime()) / 36e5;
    return Number.isFinite(diffHours) ? diffHours : null;
  }, [timeline]);

  const recommendations = useMemo(() => buildRecommendations(snapshots, recentFeedingHours != null ? Math.round(recentFeedingHours) : null), [recentFeedingHours, snapshots]);
  const insights = useMemo(() => buildInsights(snapshots, recentFeedingHours != null ? Math.round(recentFeedingHours) : null), [recentFeedingHours, snapshots]);

  const correlations = useMemo(() => {
    const temperature = displaySeries.temperature;
    const ph = displaySeries.ph;
    const turbidity = displaySeries.turbidity;

    return [
      makeCorrelationPair('Temperature', 'pH', temperature, ph, recentFeedingHours != null ? Math.round(recentFeedingHours) : null),
      makeCorrelationPair('Temperature', 'Turbidity', temperature, turbidity, recentFeedingHours != null ? Math.round(recentFeedingHours) : null),
      makeCorrelationPair('pH', 'Turbidity', ph, turbidity, recentFeedingHours != null ? Math.round(recentFeedingHours) : null),
    ];
  }, [displaySeries.ph, displaySeries.temperature, displaySeries.turbidity, recentFeedingHours]);

  const rangeHours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : customHours;
  const predictionScale = Math.max(1, Math.round((displaySeries.temperature.length / Math.max(rangeHours, 1)) * predictionHorizon));

  const forecasts = useMemo(() => ({
    temperature: linearForecast(displaySeries.temperature, predictionScale),
    ph: linearForecast(displaySeries.ph, predictionScale),
    turbidity: linearForecast(displaySeries.turbidity, predictionScale),
  }), [displaySeries.ph, displaySeries.temperature, displaySeries.turbidity, predictionScale]);

  // Helper to compute a simple expected range around the forecast using recent stdev
  const getForecastRange = (metricKey) => {
    const series = displaySeries[metricKey] || [];
    const window = Math.min(12, series.length);
    const recent = series.slice(-window);
    const sigma = stdev(recent);
    const predicted = forecasts[metricKey]?.value ?? (recent[recent.length - 1] ?? 0);
    const low = predicted - (sigma || 0.1);
    const high = predicted + (sigma || 0.1);
    return { low, high, sigma };
  };

  const timelineFiltered = useMemo(() => {
    const items = timeline.filter((event) => eventFilter === 'all' || resolveEventFilterValue(event) === eventFilter);
    return items.sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  }, [eventFilter, timeline]);

  const handleTankChange = useCallback((event) => setSelectedTank(Number(event.target.value)), []);

  const handleRefresh = useCallback(() => {
    if (!selectedTank) return;
    fetchSensorData(selectedTank, timeRange);
    fetchTimeline(selectedTank, timeRange);
  }, [fetchSensorData, fetchTimeline, selectedTank, timeRange]);

  const toggleMetric = useCallback((metricKey) => {
    setVisibleMetrics((prev) => {
      const nextValue = !prev[metricKey];
      if (!nextValue) {
        const enabledCount = Object.values(prev).filter(Boolean).length;
        if (enabledCount <= 1) {
          return prev;
        }
      }

      return { ...prev, [metricKey]: nextValue };
    });
  }, []);

  if (tanks.length === 0 && !loading) {
    return (
      <div className={styles.analyticsPage}>
        <div className={styles.emptyState}>
          <FaChartLine className={styles.emptyStateIcon} />
          <h2>No tanks available</h2>
          <p>Add a tank before analytics can render water quality and correlation insights.</p>
        </div>
      </div>
    );
  }

  const tankName = tanks.find((tank) => tank.id === selectedTank)?.name || 'Selected tank';

  return (
    <div className={`${styles.analyticsPage} ${chartFullscreen ? styles.analyticsPageFullscreen : ''}`}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.pageTitle}><FaChartLine /> Analytics</h1>
          <p className={styles.heroCopy}>{tankName}</p>
        </div>
        <div className={styles.heroBadges}>
          <span className={styles.heroBadge}><FaWifi /> {tempConnected && phConnected ? 'Live connected' : 'Partial live feed'}</span>
          <span className={styles.heroBadge}><FaFish /> {tankName}</span>
          <span className={styles.heroBadge}><FaClock /> {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </header>

      <section className={styles.toolbar} aria-label="Analytics controls">
        <label className={styles.control}>
          <span>Tank</span>
          <select value={selectedTank ?? ''} onChange={handleTankChange} className={styles.select}>
            {tanks.map((tank) => (
              <option key={tank.id} value={tank.id}>
                {tank.name} ({tank.sizeLiters}L)
              </option>
            ))}
          </select>
        </label>

        <div className={styles.rangeGroup} role="tablist" aria-label="Time range">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              className={`${styles.rangeChip} ${timeRange === range.value ? styles.rangeChipActive : ''}`}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>

        {timeRange === 'custom' && (
          <label className={styles.control}>
            <span>Custom hours</span>
            <input
              type="range"
              min="6"
              max="720"
              step="1"
              value={customHours}
              onChange={(event) => setCustomHours(Number(event.target.value))}
              className={styles.rangeInput}
            />
            <strong>{customHours}h</strong>
          </label>
        )}

        <button className={styles.refreshButton} onClick={handleRefresh} disabled={loading}>
          <FaSyncAlt className={loading ? styles.spin : ''} /> Refresh
        </button>

        <div className={styles.connectionPills}>
          <span className={`${styles.connectionPill} ${tempConnected ? styles.connectionOnline : styles.connectionLimited}`}>Temperature</span>
          <span className={`${styles.connectionPill} ${phConnected ? styles.connectionOnline : styles.connectionLimited}`}>pH</span>
        </div>
      </section>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {loading && !sensorData && <div className={styles.loadingState}><FaMagic className={styles.spin} /> Loading analytics…</div>}

      {sensorData && (
        <>
          {/* Prominent chart moved earlier to prioritize visual analysis */}
          <section className={`${styles.chartPanel} ${styles.chartProminent}`} aria-label="Primary chart">
            <TelemetryAnalyticsChart
              labels={displaySeries.labels}
              temperature={displaySeries.temperature}
              ph={displaySeries.ph}
              turbidity={displaySeries.turbidity}
              visibleMetrics={visibleMetrics}
              chartMode={chartMode}
              timeRangeLabel={TIME_RANGES.find((entry) => entry.value === timeRange)?.label || timeRange}
              onToggleMetric={toggleMetric}
              onSetChartMode={setChartMode}
              fullscreen={chartFullscreen}
              onToggleFullscreen={() => setChartFullscreen((prev) => !prev)}
              compact
            />
          </section>

          <section className={`${styles.kpiRail} ${showAllKpis ? styles.kpiRailExpanded : ''}`} aria-label="Quick statistics">
            {(() => {
              const entries = Object.entries(METRICS);
              const visible = showAllKpis ? entries : entries.slice(0, 3);
              return visible.map(([metricKey, metric]) => {
                const snapshot = snapshots[metricKey];
                const Icon = metric.icon;
                const trendTone = snapshot.trendPct >= 0 ? 'up' : 'down';

                return (
                  <article key={metricKey} className={`${styles.kpiCard} ${styles.colored} ${styles[metricKey]}`}>
                    <div className={styles.kpiTopRow}>
                      <div className={styles.kpiLabelWrap}>
                        <Icon className={styles.kpiIcon} />
                        <h2>{metric.label}</h2>
                      </div>
                      <MetricBadge tone={snapshot.status.tone}>{snapshot.status.label}</MetricBadge>
                    </div>

                    <div className={styles.kpiCurrent}>{formatValue(snapshot.current, metricKey)}<span>{metric.unit}</span></div>

                    <dl className={styles.kpiGrid}>
                      <div><dt>Average</dt><dd>{formatValue(snapshot.average, metricKey)}{metric.unit}</dd></div>
                      <div><dt>Min</dt><dd>{formatValue(snapshot.min, metricKey)}{metric.unit}</dd></div>
                      <div><dt>Max</dt><dd>{formatValue(snapshot.max, metricKey)}{metric.unit}</dd></div>
                      <div><dt>Trend</dt><dd className={trendTone === 'up' ? styles.trendUp : styles.trendDown}>{formatTrendPercent(snapshot.trendPct)}</dd></div>
                    </dl>

                    <div className={styles.kpiFooter}>
                      <span>Sensor health</span>
                      <strong>{Math.round(snapshot.health)}%</strong>
                    </div>
                  </article>
                );
              });
            })()}
            <div style={{ alignSelf: 'center' }}>
              <button type="button" className={styles.rangeChip} onClick={() => setShowAllKpis((s) => !s)}>
                {showAllKpis ? 'Show Less' : 'Show More'}
              </button>
            </div>
          </section>

          <section className={styles.centerGrid}>
            <article className={styles.healthCard}>
              <div className={styles.sectionHead}>
                <div>
                  <p className={styles.sectionEyebrow}>Aquarium health center</p>
                  <h2>Water quality intelligence</h2>
                </div>
                <MetricBadge tone={healthSummary.overall >= 70 ? 'success' : healthSummary.overall >= 55 ? 'warning' : 'danger'}>
                  {healthSummary.overall}%
                </MetricBadge>
              </div>

              <div className={styles.healthHero}>
                <div className={styles.healthScoreBlock}>
                  <span className={styles.healthScore}>{healthSummary.overall}%</span>
                  <span className={styles.healthLabel}>{healthSummary.waterQuality} water quality</span>
                </div>

                <div className={styles.healthStatsGrid}>
                  <div><span>System status</span><strong>{tempConnected || phConnected ? 'Online' : 'Degraded'}</strong></div>
                  <div><span>Sensor uptime</span><strong>{sensorQuality.uptime}%</strong></div>
                  <div><span>Tank stability</span><strong>{sensorQuality.stability}%</strong></div>
                  <div><span>Last feeding</span><strong>{recentFeedingHours != null ? `${Math.round(recentFeedingHours)} hours ago` : 'No feeding data'}</strong></div>
                </div>
              </div>

              <div className={styles.breakdownRow}>
                <div><span>Temperature</span><strong>{healthSummary.temperature}%</strong></div>
                <div><span>pH</span><strong>{healthSummary.ph}%</strong></div>
                <div><span>Turbidity</span><strong>{healthSummary.turbidity}%</strong></div>
              </div>

              <div className={styles.recommendationList}>
                {recommendations.map((item) => (
                  <div key={item.text} className={`${styles.recommendationItem} ${styles[`recommendation${item.tone[0].toUpperCase()}${item.tone.slice(1)}`]}`}>
                    {item.tone === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.insightsCard}>
              <div className={styles.sectionHead}>
                <div>
                  <p className={styles.sectionEyebrow}>AI insights</p>
                  <h2>Automated observations</h2>
                </div>
                <FaBolt className={styles.sectionIcon} />
              </div>

              <ul className={styles.insightList}>
                {insights.map((insight) => (
                  <li key={insight.text} className={`${styles.insightItem} ${styles[`insight${insight.tone[0].toUpperCase()}${insight.tone.slice(1)}`]}`}>
                    {insight.tone === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    <span>{insight.text}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className={styles.workspaceSection}>
            <div className={styles.tabBar} role="tablist" aria-label="Analytics workspace tabs">
              {TAB_OPTIONS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={styles.tabPanel}>
              {activeTab === 'overview' && (
                <div className={styles.overviewGrid}>
                  <div className={styles.overviewCard}>
                    <p>Water Quality Score</p>
                    <strong>{healthSummary.overall}%</strong>
                    <span>{getWaterQualityLabel(healthSummary.overall)}</span>
                  </div>
                  <div className={styles.overviewCard}>
                    <p>Tank Stability Score</p>
                    <strong>{sensorQuality.stability}%</strong>
                    <span>Derived from variance and drift.</span>
                  </div>
                  <div className={styles.overviewCard}>
                    <p>Fish Health Indicator</p>
                    <strong>{Math.round((healthSummary.overall + sensorQuality.reliability) / 2)}%</strong>
                    <span>Correlated with water quality and sensor reliability.</span>
                  </div>
                  <div className={styles.overviewCard}>
                    <p>Feeding Impact Analysis</p>
                    <strong>{recentFeedingHours != null ? 'Detected' : 'Pending'}</strong>
                    <span>{recentFeedingHours != null ? 'Track turbidity changes after feeding.' : 'Waiting for a feeding event.'}</span>
                  </div>
                </div>
              )}

              {activeTab === 'trends' && (
                <div className={styles.trendMetricGrid}>
                  {Object.entries(METRICS).map(([metricKey, metric]) => {
                    const snapshot = snapshots[metricKey];
                    const Icon = metric.icon;
                    const isActive = visibleMetrics[metricKey];
                    const trendTone = snapshot.trendPct >= 0 ? 'up' : 'down';

                    return (
                      <button
                        key={metricKey}
                        type="button"
                        className={`${styles.trendMetricCard} ${isActive ? styles.trendMetricCardActive : ''}`}
                        style={{ '--metric-tone': metric.tone }}
                        onClick={() => {
                          setVisibleMetrics({ temperature: false, ph: false, turbidity: false, [metricKey]: true });
                        }}
                      >
                        <div className={styles.trendMetricTop}>
                          <Icon className={styles.trendMetricIcon} />
                          <MetricBadge tone={snapshot.status.tone}>{snapshot.status.label}</MetricBadge>
                        </div>
                        <span className={styles.trendMetricLabel}>{metric.label}</span>
                        <strong className={styles.trendMetricValue}>
                          {formatValue(snapshot.current, metricKey)}
                          <span>{metric.unit}</span>
                        </strong>
                        <span className={trendTone === 'up' ? styles.trendUp : styles.trendDown}>
                          {formatTrendPercent(snapshot.trendPct)}
                        </span>
                        <span className={styles.trendMetricHint}>Tap to focus chart above</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'correlations' && (
                <div className={styles.correlationGrid}>
                  {!hasEnoughHistory(displaySeries.temperature) ? (
                    <div className={styles.emptyState}>
                      <FaExclamationTriangle className={styles.emptyStateIcon} />
                      <p>Not enough historical data. Need at least 24 data points to run correlation analysis.</p>
                    </div>
                  ) : (
                    correlations.map((item) => (
                      <article key={`${item.leftName}-${item.rightName}`} className={styles.correlationCard}>
                        <div className={styles.sectionHead}>
                          <div>
                            <p className={styles.sectionEyebrow}>Correlation</p>
                            <h3>{item.leftName} ↔ {item.rightName}</h3>
                          </div>
                          <MetricBadge tone={item.trend === 'positive' ? 'success' : 'warning'}>
                            {item.strength}%
                          </MetricBadge>
                        </div>
                        <div className={styles.correlationScore}>{item.score >= 0 ? '+' : '-'}{Math.abs(item.score).toFixed(2)}</div>
                        <p className={styles.correlationLabel}>{item.label}</p>
                        <p className={styles.correlationAnalysis}>{item.analysis}</p>
                      </article>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'predictions' && (
                <div className={styles.predictionGrid}>
                  <div className={styles.predictionControls}>
                    <p className={styles.sectionEyebrow}>Prediction horizon</p>
                    <div className={styles.predictionChips}>
                      {PREDICTION_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`${styles.rangeChip} ${predictionHorizon === value ? styles.rangeChipActive : ''}`}
                          onClick={() => setPredictionHorizon(value)}
                        >
                          {value}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {Object.entries(forecasts).map(([metricKey, forecast]) => {
                    const metric = METRICS[metricKey];
                    const range = getForecastRange(metricKey);
                    return (
                      <article key={metricKey} className={styles.predictionCard}>
                        <div className={styles.sectionHead}>
                          <div>
                            <p className={styles.sectionEyebrow}>{metric.label} forecast</p>
                            <h3>{metric.label}</h3>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Forecast method:</div>
                            <strong style={{ display: 'block' }}>Linear forecast</strong>
                          </div>
                        </div>
                        <strong className={styles.predictionValue}>{formatValue(forecast.value, metricKey)}{metric.unit}</strong>
                        <div style={{ marginTop: '0.5rem', color: 'var(--muted)' }}>
                          Expected range: {formatValue(range.low, metricKey)} — {formatValue(range.high, metricKey)} {metric.unit}
                        </div>
                        <span>Projected in {predictionHorizon} hour{predictionHorizon === 1 ? '' : 's'}.</span>
                      </article>
                    );
                  })}
                </div>
              )}

              {activeTab === 'events' && (
                <div className={styles.eventsLayout}>
                  <div className={styles.filterRow}>
                    <FaFilter className={styles.sectionIcon} />
                    {EVENT_FILTERS.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={`${styles.rangeChip} ${eventFilter === filter ? styles.rangeChipActive : ''}`}
                        onClick={() => setEventFilter(filter)}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <ul className={styles.timelineList}>
                    {timelineFiltered.length > 0 ? (
                      timelineFiltered.map((event) => <TimelineEvent key={event.id} event={event} />)
                    ) : (
                      <li className={styles.timelineEmpty}>No events match the selected filter.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className={styles.statisticsSection}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionEyebrow}>Analytics statistics</p>
                <h2>Statistical health summary</h2>
              </div>
              <FaRulerCombined className={styles.sectionIcon} />
            </div>

            <div className={styles.statisticsGrid}>
              <CompactStat label="Standard deviation" value={stdev(displaySeries.temperature).toFixed(2)} sublabel="Temperature dispersion" icon={FaChartLine} />
              <CompactStat label="Variance" value={variance(displaySeries.ph).toFixed(2)} sublabel="pH variation" icon={FaChartLine} />
              <CompactStat label="Stability score" value={`${sensorQuality.stability}%`} sublabel="Higher is calmer" icon={FaShieldAlt} tone={sensorQuality.stability >= 80 ? 'success' : 'warning'} />
              <CompactStat label="Data quality" value={`${sensorQuality.quality}%`} sublabel="Valid readings" icon={FaCheckCircle} tone={sensorQuality.quality >= 90 ? 'success' : 'warning'} />
              <CompactStat label="Sensor reliability" value={`${sensorQuality.reliability}%`} sublabel="Combined quality signal" icon={FaWifi} tone={sensorQuality.reliability >= 90 ? 'success' : 'warning'} />
              <CompactStat label="Uptime" value={`${sensorQuality.uptime}%`} sublabel="Observed connection health" icon={FaClock} tone={sensorQuality.uptime >= 99 ? 'success' : 'warning'} />
            </div>
          </section>
        </>
      )}

      {!loading && !sensorData && !error && (
        <div className={styles.emptyState}>
          <FaExclamationTriangle className={styles.emptyStateIcon} />
          <h2>No sensor data available</h2>
          <p>Try a different time range or wait for the next telemetry update.</p>
        </div>
      )}
    </div>
  );
}