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
import { getTanks, getSensorData } from '../../services/api';
import Card from '../../components/common/card/card.jsx';
import styles from './TrendsPage.module.scss';
import { 
  FaChartLine, 
  FaArrowUp, 
  FaArrowDown, 
  FaMinus,
  FaThermometerHalf,
  FaTint,
  FaFlask,
  FaWater,
  FaLightbulb
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
 * Trends Page - Shows trend analysis and predictions
 */
function TrendsPage() {
  const [tanks, setTanks] = useState([]);
  const [selectedTank, setSelectedTank] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('temperature');

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
      }
    };
    loadTanks();
  }, []);

  useEffect(() => {
    if (selectedTank) {
      loadTrendData();
    }
  }, [selectedTank]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      const data = await getSensorData(selectedTank, '30d');
      setTrendData(data);
    } catch (err) {
      console.error('Failed to load trend data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (values) => {
    if (!values || values.length < 2) return { direction: 'stable', change: 0 };
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);
    
    if (Math.abs(change) < 2) return { direction: 'stable', change: 0 };
    return { 
      direction: change > 0 ? 'rising' : 'falling', 
      change: Math.abs(change) 
    };
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'rising': return <FaArrowUp className={styles.trendUp} />;
      case 'falling': return <FaArrowDown className={styles.trendDown} />;
      default: return <FaMinus className={styles.trendStable} />;
    }
  };

  const metrics = [
    { key: 'temperature', label: 'Temperature', unit: '°C', icon: <FaThermometerHalf />, color: '#dc2626', optimal: '24-26°C' },
    { key: 'ph', label: 'pH Level', unit: '', icon: <FaTint />, color: '#16a34a', optimal: '6.8-7.4' },
    { key: 'ammonia', label: 'Ammonia', unit: 'ppm', icon: <FaFlask />, color: '#7c3aed', optimal: '< 0.25' },
    { key: 'turbidity', label: 'Turbidity', unit: 'NTU', icon: <FaWater />, color: '#1277b0', optimal: '< 3' },
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
        }
      ]
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
        }
      },
      tooltip: {
        backgroundColor: 'rgba(61, 48, 33, 0.9)',
        titleFont: { family: "'Special Elite', cursive", size: 14 },
        bodyFont: { family: "'DM Sans', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'DM Sans', sans-serif", size: 10 },
          maxRotation: 45,
        }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          font: { family: "'DM Sans', sans-serif", size: 11 }
        }
      }
    }
  };

  // Generate insights based on data
  const generateInsights = () => {
    if (!trendData) return [];
    
    const insights = [];
    
    // Temperature insight
    const tempTrend = calculateTrend(trendData.temperature?.values);
    if (tempTrend.direction === 'stable') {
      insights.push({
        type: 'success',
        icon: '✅',
        text: 'Temperature has remained stable within optimal range for the analysis period.'
      });
    } else if (tempTrend.direction === 'rising') {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        text: `Temperature shows an upward trend of ${tempTrend.change}%. Monitor your heater settings.`
      });
    }
    
    // pH insight
    const phTrend = calculateTrend(trendData.ph?.values);
    if (phTrend.direction === 'falling') {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        text: 'pH shows a slight downward trend. Consider checking your substrate and water source.'
      });
    } else {
      insights.push({
        type: 'info',
        icon: '💧',
        text: 'pH levels are maintaining within acceptable parameters.'
      });
    }
    
    // Maintenance prediction
    insights.push({
      type: 'info',
      icon: '📅',
      text: 'Based on current trends, next water change recommended in 3-4 days.'
    });
    
    return insights;
  };

  if (loading && !trendData) {
    return (
      <div className={styles.trendsPage}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analyzing trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.trendsPage}>
      <header className={styles.header}>
        <h1><FaChartLine /> Trends & Analysis</h1>
        <p>Track parameter changes and understand long-term patterns</p>
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
      </div>

      {/* Trend Summary Cards */}
      <div className={styles.trendCards}>
        {metrics.map(metric => {
          const data = trendData?.[metric.key];
          const trend = data ? calculateTrend(data.values) : { direction: 'stable', change: 0 };
          const currentValue = data?.values?.[data.values.length - 1]?.toFixed(1) || '--';
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
                <span className={styles.metricLabel}>{metric.label}</span>
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
        <h2>30-Day Trend: {metrics.find(m => m.key === selectedMetric)?.label}</h2>
        <div className={styles.chartContainer}>
          {getChartData() && <Line data={getChartData()} options={chartOptions} />}
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
