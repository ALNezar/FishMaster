import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getTanks, getSensorData, useTemperatureStream } from '../../api';
import Card from '../../components/common/card/card.jsx';
import InfoTooltip from '../../components/common/InfoTooltip/InfoTooltip';
import styles from './TrendsPage.module.scss';
import {
  FaChartLine,
  FaThermometerHalf,
  FaTint,
  FaWater,
  FaWifi,
} from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function TrendsPage() {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeRange, setTimeRange] = useState('30d');
  const [fillsVisible, setFillsVisible] = useState(false);

  const { lastReading: liveTemp, connected: sseConnected } = useTemperatureStream();

  useEffect(() => {
    const loadTanks = async () => {
      try {
        const data = await getTanks();
        setTanks(data || []);
        if (data && data.length > 0) setSelectedTank(data[0].id);
      } catch (err) {
        console.error('Failed to load tanks:', err);
      }
    };
    loadTanks();
  }, []);

  useEffect(() => {
    if (selectedTank) loadTrendData();
  }, [selectedTank, timeRange]);

  const loadTrendData = async () => {
    setLoading(true);
    setFillsVisible(false);
    try {
      const data = await getSensorData(selectedTank, timeRange);
      setTrendData(data);
      setTimeout(() => setFillsVisible(true), 120);
    } catch (err) {
      console.error('Failed to load trend data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!liveTemp) return;
    const value = Number(liveTemp.temperature);
    const label = new Date(liveTemp.serverTimestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setTrendData(prev => {
      if (!prev?.temperature) return prev;
      return {
        ...prev,
        temperature: {
          ...prev.temperature,
          labels: [...prev.temperature.labels, label],
          values: [...prev.temperature.values, value],
        },
      };
    });
  }, [liveTemp]);

  const calculateTrend = (values) => {
    if (!values || values.length < 2) return { direction: 'stable', change: 0 };
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const change = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);
    if (Math.abs(change) < 2) return { direction: 'stable', change: 0 };
    return { direction: change > 0 ? 'rising' : 'falling', change: Math.abs(change) };
  };

  /**
   * Returns 0–100 representing how stressed/full a reading is
   * relative to its safe range.
   */
  const getFillPercent = (key, values) => {
    if (!values || values.length === 0) return 0;
    const current = values[values.length - 1];
    const ranges = {
      temperature: { min: 22, max: 28 },
      ph:          { min: 6.5, max: 8.0 },
      turbidity:   { min: 0,   max: 8 },
    };
    const { min, max } = ranges[key] || { min: 0, max: 100 };
    return Math.min(100, Math.max(0, Math.round(((current - min) / (max - min)) * 100)));
  };

  /**
   * Rule-based recommendation — built from calculateTrend, no AI.
   */
  const buildRecommendation = () => {
    if (!trendData) return null;

    const tempTrend = calculateTrend(trendData.temperature?.values);
    const phTrend   = calculateTrend(trendData.ph?.values);
    const turbTrend = calculateTrend(trendData.turbidity?.values);

    const describeTrend = (label, trend, highText, lowText) => {
      if (trend.direction === 'stable') return `${label} is steady`;
      if (trend.direction === 'rising') return highText;
      return lowText;
    };

    return [
      describeTrend(
        'Temperature',
        tempTrend,
        'Temperature is warming up a little',
        'Temperature is cooling down a little'
      ),
      describeTrend(
        'pH',
        phTrend,
        'pH is moving up a little',
        'pH is moving down a little'
      ),
      describeTrend(
        'Turbidity',
        turbTrend,
        'Turbidity is going up a little',
        'Turbidity is going down a little'
      ),
    ].join('. ') + '.';
  };

  const getTrendLabel = (trend) => {
    if (trend.direction === 'stable') return 'Steady';
    if (trend.direction === 'rising') return 'Going up a little';
    return 'Going down a little';
  };

  const metrics = [
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      icon: <FaThermometerHalf />,
      color: '#b01222',
      bgColor: 'rgba(18,119,176,0.10)',
      textColor: '#3d3021',
      statusColor: '#a0163b',
      optimal: '24–26°C',
      whatIsIt: 'How warm or cold your water is.',
      whyItMatters: 'Fish are cold-blooded. If water is too hot or cold, they get stressed or sick.',
      ideal: '24–26°C (75–79°F)',
      danger: 'Below 22°C or above 28°C',
    },
    {
      key: 'ph',
      label: 'pH Level',
      unit: '',
      icon: <FaTint />,
      color: '#16a34a',
      bgColor: 'rgba(22,163,74,0.10)',
      textColor: '#3d3021',
      statusColor: '#16a34a',
      optimal: '6.8–7.4',
      whatIsIt: 'How acidic or alkaline your water is. 7 = neutral.',
      whyItMatters: 'Wrong pH hurts fish gills and skin.',
      ideal: '6.8–7.4 for most fish',
      danger: 'Below 6.5 or above 8.0',
    },
    {
      key: 'turbidity',
      label: 'Turbidity',
      unit: 'NTU',
      icon: <FaWater />,
      color: '#ca8a04',
      bgColor: 'rgba(202,138,4,0.10)',
      textColor: '#3d3021',
      statusColor: '#ca8a04',
      optimal: '< 3',
      whatIsIt: 'How cloudy or clear your water looks.',
      whyItMatters: 'Cloudy water = bacteria or dirt.',
      ideal: 'Under 3 NTU (crystal clear)',
      danger: 'Above 5 NTU — check your filter!',
    },
  ];

  const calculateMovingAverage = (values, window) => {
    if (!values) return [];
    return values.map((_, i, arr) => {
      const start = Math.max(0, i - window + 1);
      const subset = arr.slice(start, i + 1);
      return subset.reduce((a, b) => a + b, 0) / subset.length;
    });
  };

  const getChartData = () => {
    if (!trendData || !trendData[selectedMetric]) return null;
    const metric = metrics.find(m => m.key === selectedMetric);
    return {
      labels: trendData[selectedMetric].labels,
      datasets: [
        {
          label: metric.label,
          data: trendData[selectedMetric].values,
          borderColor: metric.color,
          backgroundColor: `${metric.color}20`,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: metric.color,
        },
        {
          label: 'Trend Line',
          data: calculateMovingAverage(trendData[selectedMetric].values, 5),
          borderColor: '#3d3021',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: "'DM Sans', sans-serif", size: 12 },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(61, 48, 33, 0.9)',
        titleFont: { family: "'Special Elite', cursive", size: 14 },
        bodyFont: { family: "'DM Sans', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "'DM Sans', sans-serif", size: 10 }, maxRotation: 45 },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: "'DM Sans', sans-serif", size: 11 } },
      },
    },
  };

  const activeMetric = metrics.find(m => m.key === selectedMetric);
  const recommendation = buildRecommendation();

  if (loading && !trendData) {
    return (
      <div className={styles.trendsPage}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analyzing trends…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.trendsPage}>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1><FaChartLine /> Trends & Analysis</h1>
          <p>Track parameter changes over time and understand long-term patterns</p>
        </div>
        <div className={`${styles.liveIndicator} ${sseConnected ? styles.liveConnected : styles.liveReconnecting}`}>
          <span className={styles.liveDot} />
          <FaWifi className={styles.liveWifiIcon} />
          {sseConnected ? 'Live' : 'Reconnecting'}
        </div>
      </header>

      {/* Controls */}
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
          <label>Time Period</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={styles.select}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main grid: param cards (left) + chart (right) */}
      <div className={styles.mainGrid}>

        {/* Parameter cards column */}
        <div className={styles.paramCol}>
          {metrics.map(metric => {
            const data     = trendData?.[metric.key];
            const trend    = data ? calculateTrend(data.values) : { direction: 'stable', change: 0 };
            const current  = data?.values?.[data.values.length - 1]?.toFixed(1) ?? '--';
            const fill     = data ? getFillPercent(metric.key, data.values) : 0;
            const isActive = selectedMetric === metric.key;

            return (
              <div
                key={metric.key}
                className={`${styles.paramCard} ${isActive ? styles.paramActive : ''}`}
                onClick={() => setSelectedMetric(metric.key)}
                style={{ '--card-color': metric.color }}
              >
                {/* Animated fill layer */}
                <div
                  className={styles.paramFill}
                  style={{
                    height: fillsVisible ? `${fill}%` : '0%',
                    background: metric.color,
                  }}
                />

                <div className={styles.paramInner}>
                  <div className={styles.paramTop}>
                    <div
                      className={styles.paramIcon}
                      style={{ background: metric.bgColor, color: metric.color }}
                    >
                      {metric.icon}
                    </div>
                    <span className={styles.paramPct} style={{ color: metric.color }}>
                      {fill}%
                    </span>
                  </div>

                  <div className={styles.paramLabelRow} style={{ color: metric.textColor }}>
                    <span className={styles.paramLabel}>{metric.label}</span>
                    <InfoTooltip
                      title={metric.label}
                      whatIsIt={metric.whatIsIt}
                      whyItMatters={metric.whyItMatters}
                      ideal={metric.ideal}
                      danger={metric.danger}
                      learnMoreUrl={null}
                    />
                  </div>

                  <div className={styles.paramValue} style={{ color: metric.textColor }}>
                    {current}
                    {metric.unit && (
                      <span className={styles.paramUnit} style={{ color: metric.textColor }}>
                        {metric.unit}
                      </span>
                    )}
                  </div>

                  <div className={styles.paramTarget} style={{ color: metric.textColor }}>
                    Target {metric.optimal}
                  </div>

                  <div
                    className={styles.paramStatus}
                    style={{ background: `${metric.color}18`, color: metric.statusColor }}
                  >
                    <span className={styles.paramDot} style={{ background: metric.color }} />
                    {getTrendLabel(trend)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart card */}
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2>
              {timeRange === '7d' ? '7-Day' : '30-Day'} Trend: {activeMetric?.label}
            </h2>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: activeMetric?.color }} />
                Actual
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendLine} />
                Moving Average
              </span>
            </div>
          </div>
          <div className={styles.chartContainer}>
            {loading ? (
              <div className={styles.loadingChart}>
                <div className={styles.spinner} />
                <p>Loading chart…</p>
              </div>
            ) : getChartData() ? (
              <Line data={getChartData()} options={chartOptions} />
            ) : (
              <div className={styles.emptyChart}><p>No data available</p></div>
            )}
          </div>
        </Card>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className={styles.recoCard}>
          <div className={styles.recoAvatar}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3.5" fill="white" />
              <path
                d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div className={styles.recoBody}>
            <span className={styles.recoEyebrow}>Recommendation</span>
            <p className={styles.recoText}>{recommendation}</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default TrendsPage;