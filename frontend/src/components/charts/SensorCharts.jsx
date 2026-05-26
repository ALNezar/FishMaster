import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import styles from './SensorCharts.module.scss';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// Color palette matching the app theme
const COLORS = {
  primary: '#1277b0',
  primaryLight: 'rgba(18, 119, 176, 0.2)',
  success: '#16a34a',
  successLight: 'rgba(22, 163, 74, 0.2)',
  warning: '#ca8a04',
  warningLight: 'rgba(202, 138, 4, 0.2)',
  danger: '#dc2626',
  dangerLight: 'rgba(220, 38, 38, 0.2)',
  purple: '#7c3aed',
  purpleLight: 'rgba(124, 58, 237, 0.2)',
};

const DEFAULT_RANGES = {
  temperature: {
    safeMin: 24,
    safeMax: 26,
    warningMin: 22,
    warningMax: 28,
    min: 18,
    max: 30,
    unit: '°C',
  },
  ph: {
    safeMin: 6.8,
    safeMax: 7.4,
    warningMin: 6.5,
    warningMax: 7.5,
    min: 6,
    max: 8.5,
    unit: 'pH',
  },
  turbidity: {
    safeMin: 0,
    safeMax: 3,
    warningMin: 3,
    warningMax: 5,
    min: 0,
    max: 10,
    unit: 'NTU',
  },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeMetric = (value, metricKey) => {
  const range = DEFAULT_RANGES[metricKey];
  if (!range) return value;

  const { min, max, safeMin, safeMax } = range;
  const safeMid = (safeMin + safeMax) / 2;
  const span = max - min || 1;
  const distance = Math.abs(value - safeMid);
  const normalized = 100 - (distance / (span / 2)) * 100;
  return clamp(Math.round(normalized), 0, 100);
};

const createRangeBandsPlugin = (metricKey) => ({
  id: `rangeBands-${metricKey}`,
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.y) return;

    const { left, right } = chartArea;
    const yScale = scales.y;
    const { safeMin, safeMax, warningMin, warningMax, min, max } = DEFAULT_RANGES[metricKey];

    const drawBand = (fromValue, toValue, color) => {
      const top = yScale.getPixelForValue(toValue);
      const bottom = yScale.getPixelForValue(fromValue);
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(left, top, right - left, bottom - top);
      ctx.restore();
    };

    drawBand(min, warningMin, 'rgba(220, 38, 38, 0.06)');
    drawBand(warningMin, safeMin, 'rgba(202, 138, 4, 0.08)');
    drawBand(safeMin, safeMax, 'rgba(22, 163, 74, 0.10)');
    drawBand(safeMax, warningMax, 'rgba(202, 138, 4, 0.08)');
    drawBand(warningMax, max, 'rgba(220, 38, 38, 0.06)');
  },
});

const chartCommonOptions = (metricKey, title, min, max, unit) => ({
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: true,
      text: title,
      font: {
        family: "'Special Elite', cursive",
        size: 16,
      },
    },
    subtitle: {
      display: true,
      text: `Safe zone: ${DEFAULT_RANGES[metricKey].safeMin}–${DEFAULT_RANGES[metricKey].safeMax} ${unit}`,
      font: {
        family: "'DM Sans', sans-serif",
        size: 11,
      },
      color: '#666',
      padding: { bottom: 8 },
    },
  },
  scales: {
    ...commonOptions.scales,
    x: {
      ...commonOptions.scales.x,
      ticks: {
        ...commonOptions.scales.x.ticks,
        maxTicksLimit: 8,
        autoSkip: true,
      },
    },
    y: {
      ...commonOptions.scales.y,
      min,
      max,
      title: {
        display: true,
        text: unit,
      },
    },
  },
});

// Common chart options for consistent styling
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: "'DM Sans', sans-serif",
          size: 12,
        },
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(61, 48, 33, 0.9)',
      titleFont: {
        family: "'Special Elite', cursive",
        size: 14,
      },
      bodyFont: {
        family: "'DM Sans', sans-serif",
        size: 13,
      },
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: "'DM Sans', sans-serif",
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          family: "'DM Sans', sans-serif",
          size: 11,
        },
      },
    },
  },
};

/**
 * Temperature Line Chart
 */
export function TemperatureChart({ data, timeRange }) {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: data?.values || [],
        borderColor: COLORS.danger,
        backgroundColor: COLORS.dangerLight,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: COLORS.danger,
      },
      ...(data?.target ? [{
        label: 'Target',
        data: Array(data.labels?.length || 0).fill(data.target),
        borderColor: 'rgba(0,0,0,0.2)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }] : []),
    ],
  };

  const options = {
    ...chartCommonOptions('temperature', `Temperature Readings - ${timeRange}`, data?.min || 18, data?.max || 30, '°C'),
    plugins: {
      ...chartCommonOptions('temperature', `Temperature Readings - ${timeRange}`, data?.min || 18, data?.max || 30, '°C').plugins,
    },
    scales: {
      ...chartCommonOptions('temperature', `Temperature Readings - ${timeRange}`, data?.min || 18, data?.max || 30, '°C').scales,
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Line data={chartData} options={options} plugins={[createRangeBandsPlugin('temperature')]} />
    </div>
  );
}

/**
 * pH Level Chart
 */
export function PhChart({ data, timeRange }) {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'pH Level',
        data: data?.values || [],
        borderColor: COLORS.success,
        backgroundColor: COLORS.successLight,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: COLORS.success,
      },
      ...(data?.target ? [{
        label: 'Target',
        data: Array(data.labels?.length || 0).fill(data.target),
        borderColor: 'rgba(0,0,0,0.2)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }] : []),
    ],
  };

  const options = {
    ...chartCommonOptions('ph', `pH Level - ${timeRange}`, 6, 8.5, 'pH'),
  };

  return (
    <div className={styles.chartContainer}>
      <Line data={chartData} options={options} plugins={[createRangeBandsPlugin('ph')]} />
    </div>
  );
}

/**
 * Turbidity Chart (Bar)
 */
export function TurbidityChart({ data, timeRange }) {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Turbidity (NTU)',
        data: data?.values || [],
        backgroundColor: data?.values?.map(v => 
          v > 5 ? COLORS.danger : v > 3 ? COLORS.warning : COLORS.primary
        ) || [],
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    ...chartCommonOptions('turbidity', `Water Turbidity - ${timeRange}`, 0, 10, 'NTU'),
  };

  return (
    <div className={styles.chartContainer}>
      <Bar data={chartData} options={options} plugins={[createRangeBandsPlugin('turbidity')]} />
    </div>
  );
}

/**
 * Water Clarity Trend Chart
 */
export function WaterClarityChart({ data, timeRange }) {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Turbidity (NTU)',
        data: data?.values || [],
        borderColor: COLORS.warning,
        backgroundColor: COLORS.warningLight,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: COLORS.warning,
      },
      {
        label: 'Alert Threshold',
        data: Array(data?.labels?.length || 0).fill(5),
        borderColor: COLORS.danger,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    ...chartCommonOptions('turbidity', `Water Clarity - ${timeRange}`, 0, 10, 'NTU'),
  };

  return (
    <div className={styles.chartContainer}>
      <Line data={chartData} options={options} plugins={[createRangeBandsPlugin('turbidity')]} />
    </div>
  );
}

/**
 * Water Quality Summary Doughnut
 */
export function WaterQualitySummary({ data }) {
  const chartData = {
    labels: ['Optimal', 'Warning', 'Critical'],
    datasets: [
      {
        data: [data?.optimal || 0, data?.warning || 0, data?.critical || 0],
        backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: "'DM Sans', sans-serif",
            size: 12,
          },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(61, 48, 33, 0.9)',
        bodyFont: {
          family: "'DM Sans', sans-serif",
        },
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`,
        },
      },
    },
  };

  return (
    <div className={styles.doughnutContainer}>
      <Doughnut data={chartData} options={options} />
      <div className={styles.doughnutCenter}>
        <span className={styles.percentage}>{data?.optimal || 0}%</span>
        <span className={styles.label}>Healthy</span>
      </div>
    </div>
  );
}

/**
 * Combined Multi-Parameter Chart
 */
export function MultiParameterChart({ data, timeRange }) {
  const normalizedTemperature = (data?.temperature || []).map((value) => normalizeMetric(Number(value), 'temperature'));
  const normalizedPh = (data?.ph || []).map((value) => normalizeMetric(Number(value), 'ph'));
  const normalizedTurbidity = (data?.turbidity || []).map((value) => normalizeMetric(Number(value), 'turbidity'));

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Temperature health',
        data: normalizedTemperature,
        borderColor: COLORS.danger,
        backgroundColor: COLORS.dangerLight,
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'pH health',
        data: normalizedPh,
        borderColor: COLORS.success,
        backgroundColor: COLORS.successLight,
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Turbidity health',
        data: normalizedTurbidity,
        borderColor: COLORS.warning,
        backgroundColor: COLORS.warningLight,
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        yAxisID: 'y',
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: `Normalized Health Overview - ${timeRange}`,
        font: {
          family: "'Special Elite', cursive",
          size: 16,
        },
      },
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Health score',
        },
        ticks: {
          ...commonOptions.scales.y.ticks,
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Line data={chartData} options={options} />
    </div>
  );
}

export default {
  TemperatureChart,
  PhChart,
  TurbidityChart,
  WaterClarityChart,
  WaterQualitySummary,
  MultiParameterChart,
};
