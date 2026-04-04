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
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: `Temperature Readings - ${timeRange}`,
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
        min: data?.min || 20,
        max: data?.max || 30,
        title: {
          display: true,
          text: '°C',
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
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: `pH Level - ${timeRange}`,
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
        min: 6,
        max: 9,
        title: {
          display: true,
          text: 'pH',
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
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: `Water Turbidity - ${timeRange}`,
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
        max: 10,
        title: {
          display: true,
          text: 'NTU',
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

/**
 * Ammonia Trend Chart
 */
export function AmmoniaChart({ data, timeRange }) {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Ammonia (ppm)',
        data: data?.values || [],
        borderColor: COLORS.purple,
        backgroundColor: COLORS.purpleLight,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: COLORS.purple,
      },
      {
        label: 'Safe Threshold',
        data: Array(data?.labels?.length || 0).fill(0.25),
        borderColor: COLORS.danger,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: `Ammonia Levels - ${timeRange}`,
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
        max: 1,
        title: {
          display: true,
          text: 'ppm',
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
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Temperature (normalized)',
        data: data?.temperature || [],
        borderColor: COLORS.danger,
        backgroundColor: 'transparent',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'pH (normalized)',
        data: data?.ph || [],
        borderColor: COLORS.success,
        backgroundColor: 'transparent',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Ammonia (normalized)',
        data: data?.ammonia || [],
        borderColor: COLORS.purple,
        backgroundColor: 'transparent',
        tension: 0.4,
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
        text: `All Parameters Overview - ${timeRange}`,
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
          text: 'Normalized %',
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
  AmmoniaChart,
  WaterQualitySummary,
  MultiParameterChart,
};
