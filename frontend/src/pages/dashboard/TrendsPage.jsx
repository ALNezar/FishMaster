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
import { getTanks, getSensorData, useTemperatureStream } from '../../services/api';
import Card from '../../components/common/card/card.jsx';
import InfoTooltip from '../../components/common/InfoTooltip/InfoTooltip';
import styles from './TrendsPage.module.scss';
import {
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaThermometerHalf,
  FaTint,
  FaWater,
  FaLightbulb,
  FaCircle,
} from 'react-icons/fa';

// Register Chart.js
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

/**
 * Trends Page — parameter trends over time.
 * Temperature is fed by real backend data; pH and turbidity use mock until those sensors ship.
 */
function TrendsPage() {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeRange, setTimeRange] = useState('30d');

  // Live SSE — append new temperature points to the chart in real time
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
    try {
      const data = await getSensorData(selectedTank, timeRange);
      setTrendData(data);
    } catch (err) {
      console.error('Failed to load trend data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Append live SSE readings to the temperature series
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

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'rising':  return <FaArrowUp className={styles.trendUp} />;
      case 'falling': return <FaArrowDown className={styles.trendDown} />;
      default:        return <FaMinus className={styles.trendStable} />;
    }
  };

  // Ammonia removed — no live sensor hardware
  const metrics = [
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      icon: <FaThermometerHalf />,
      color: '#dc2626',
      optimal: '24–26°C',
      whatIsIt: 'How warm or cold your water is.',
      whyItMatters: 'Fish are cold-blooded. If water is too hot or cold, they get stressed or sick.',
      ideal: '24–26°C (75–79°F)',
      danger: 'Below 22°C or above 28°C',
      learnMoreUrl: null,
    },
    {
      key: 'ph',
      label: 'pH Level',
      unit: '',
      icon: <FaTint />,
      color: '#16a34a',
      optimal: '6.8–7.4',
      whatIsIt: 'How acidic or alkaline your water is. 7 = neutral.',
      whyItMatters: 'Wrong pH hurts fish gills and skin. Each fish likes a specific range.',
      ideal: '6.8–7.4 for most fish',
      danger: 'Below 6.5 or above 8.0',
      learnMoreUrl: null,
    },
    {
      key: 'turbidity',
      label: 'Turbidity',
      unit: 'NTU',
      icon: <FaWater />,
      color: '#1277b0',
      optimal: '< 3',
      whatIsIt: 'How cloudy or clear your water looks.',
      whyItMatters: 'Cloudy water = bacteria or dirt. Fish need clean, clear water to thrive.',
      ideal: 'Under 3 NTU (crystal clear)',
      danger: 'Above 5 NTU — check your filter!',
      learnMoreUrl: null,
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

  const generateInsights = () => {
    if (!trendData) return [];
    const insights = [];

    const tempTrend = calculateTrend(trendData.temperature?.values);
    if (tempTrend.direction === 'stable') {
      insights.push({ type: 'success', icon: '✅', text: 'Temperature has remained stable within optimal range for the analysis period.' });
    } else if (tempTrend.direction === 'rising') {
      insights.push({ type: 'warning', icon: '⚠️', text: `Temperature shows an upward trend of ${tempTrend.change}%. Monitor your heater settings.` });
    } else {
      insights.push({ type: 'warning', icon: '⚠️', text: `Temperature is trending down by ${tempTrend.change}%. Check your heater is on and working.` });
    }

    const phTrend = calculateTrend(trendData.ph?.values);
    if (phTrend.direction === 'falling') {
      insights.push({ type: 'warning', icon: '⚠️', text: 'pH shows a slight downward trend. Consider checking your substrate and water source.' });
    } else {
      insights.push({ type: 'info', icon: '💧', text: 'pH levels are maintaining within acceptable parameters.' });
    }

    const turbTrend = calculateTrend(trendData.turbidity?.values);
    if (turbTrend.direction === 'rising') {
      insights.push({ type: 'warning', icon: '⚠️', text: `Turbidity is creeping up by ${turbTrend.change}%. Check your filter and avoid overfeeding.` });
    } else {
      insights.push({ type: 'success', icon: '✅', text: 'Water clarity is good — filter and feeding routine are on track.' });
    }

    insights.push({ type: 'info', icon: '📅', text: 'Based on current trends, next water change recommended in 3–4 days.' });

    return insights;
  };

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

  const activeMetric = metrics.find(m => m.key === selectedMetric);

  return (
    <div className={styles.trendsPage}>
      <header className={styles.header}>
        <div>
          <h1><FaChartLine /> Trends & Analysis</h1>
          <p>Track parameter changes over time and understand long-term patterns</p>
        </div>
        {/* SSE live indicator */}
        <div
          className={styles.liveIndicator}
          title={sseConnected ? 'Live temperature connected' : 'Reconnecting…'}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
        >
          <FaCircle style={{ color: sseConnected ? '#16a34a' : '#ca8a04', fontSize: '0.5rem' }} />
          {sseConnected ? 'Live' : 'Reconnecting…'}
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

      {/* Trend Summary Cards — 3 metrics, no ammonia */}
      <div className={styles.trendCards}>
        {metrics.map(metric => {
          const data = trendData?.[metric.key];
          const trend = data ? calculateTrend(data.values) : { direction: 'stable', change: 0 };
          const currentValue = data?.values?.[data.values.length - 1]?.toFixed(1) ?? '--';
          const isActive = selectedMetric === metric.key;

          return (
            <Card
              key={metric.key}
              className={`${styles.trendCard} ${isActive ? styles.active : ''}`}
              onClick={() => setSelectedMetric(metric.key)}
              style={{ '--accent-color': metric.color }}
            >
              <div className={styles.cardIcon} style={{ color: metric.color }}>
                {metric.icon}
              </div>
              <div className={styles.cardContent}>
                <div className={styles.metricLabelRow}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <InfoTooltip
                    title={metric.label}
                    whatIsIt={metric.whatIsIt}
                    whyItMatters={metric.whyItMatters}
                    ideal={metric.ideal}
                    danger={metric.danger}
                    learnMoreUrl={metric.learnMoreUrl}
                  />
                </div>
                <div className={styles.cardValue}>
                  {currentValue}
                  <span className={styles.unit}>{metric.unit}</span>
                </div>
                <div className={styles.cardTrend}>
                  {getTrendIcon(trend.direction)}
                  <span className={styles[trend.direction]}>
                    {trend.direction === 'stable' ? 'Stable' : `${trend.change}%`}
                  </span>
                </div>
                <div className={styles.optimal}>Target: {metric.optimal}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Chart */}
      <Card className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2>
            {timeRange === '7d' ? '7-Day' : '30-Day'} Trend: {activeMetric?.label}
          </h2>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: activeMetric?.color }}></span>
              Actual
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendLine}></span>
              Moving Average
            </span>
          </div>
        </div>
        <div className={styles.chartContainer}>
          {loading ? (
            <div className={styles.loadingChart}>
              <div className={styles.spinner}></div>
              <p>Loading chart…</p>
            </div>
          ) : getChartData() ? (
            <Line data={getChartData()} options={chartOptions} />
          ) : (
            <div className={styles.emptyChart}><p>No data available</p></div>
          )}
        </div>
      </Card>

      {/* Insights */}
      <Card className={styles.insightsCard}>
        <h2><FaLightbulb /> Insights & Recommendations</h2>
        <div className={styles.insightsList}>
          {generateInsights().map((insight, index) => (
            <div key={index} className={`${styles.insight} ${styles[insight.type]}`}>
              <span className={styles.insightIcon}>{insight.icon}</span>
              <p>{insight.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default TrendsPage;