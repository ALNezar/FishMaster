import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FaCompress, FaExpand, FaTint, FaThermometerHalf, FaWater } from 'react-icons/fa';
import styles from './TelemetryAnalyticsChart.module.scss';

const COLORS = {
  temperature: '#ef4444',
  temperatureSoft: 'rgba(239, 68, 68, 0.16)',
  ph: '#3b82f6',
  phSoft: 'rgba(59, 130, 246, 0.18)',
  turbidity: '#14b8a6',
  turbiditySoft: 'rgba(20, 184, 166, 0.18)',
};

const metricMeta = {
  temperature: { label: 'Temperature', icon: FaThermometerHalf, unit: '°C' },
  ph: { label: 'pH', icon: FaTint, unit: 'pH' },
  turbidity: { label: 'Turbidity', icon: FaWater, unit: 'NTU' },
};

const yAxisConfig = [
  {
    type: 'value',
    name: '°C',
    position: 'left',
    nameLocation: 'middle',
    nameGap: 30,
    axisLine: { lineStyle: { color: COLORS.temperature } },
    axisLabel: { color: '#6b7280' },
    splitLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.08)' } },
    min: 20,
    max: 32,
  },
  {
    type: 'value',
    name: 'pH',
    position: 'right',
    nameLocation: 'middle',
    nameGap: 30,
    axisLine: { lineStyle: { color: COLORS.ph } },
    axisLabel: { color: '#6b7280' },
    splitLine: { show: false },
    min: 6,
    max: 8.5,
  },
  {
    type: 'value',
    name: 'NTU',
    position: 'right',
    offset: 50,
    nameLocation: 'middle',
    nameGap: 30,
    axisLine: { lineStyle: { color: COLORS.turbidity } },
    axisLabel: { color: '#6b7280' },
    splitLine: { show: false },
    min: 0,
    max: 15,
  },
];

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getVisibleMetrics = (visibleMetrics) =>
  Object.entries(visibleMetrics || {})
    .filter(([, visible]) => Boolean(visible))
    .map(([key]) => key);

const buildSeries = ({ labels, temperature, ph, turbidity, visibleMetrics, chartMode }) => {
  const visible = getVisibleMetrics(visibleMetrics);

  return visible.map((metricKey) => {
    const meta = metricMeta[metricKey];
    const color = COLORS[metricKey];
    const soft = COLORS[`${metricKey}Soft`];
    const values = metricKey === 'temperature' ? temperature : metricKey === 'ph' ? ph : turbidity;

    const baseSeries = {
      name: meta.label,
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbol: 'circle',
      symbolSize: 8,
      data: values.map((value, index) => [labels[index], safeNumber(value)]),
      yAxisIndex: metricKey === 'temperature' ? 0 : metricKey === 'ph' ? 1 : 2,
      lineStyle: { width: 3, color },
      itemStyle: { color },
      emphasis: { focus: 'series' },
      markLine: {
        symbol: 'none',
        lineStyle: { type: 'dashed', color: 'rgba(15, 23, 42, 0.28)' },
        label: { color: '#64748b' },
        data:
          metricKey === 'temperature'
            ? [{ yAxis: 25 }]
            : metricKey === 'ph'
              ? [{ yAxis: 7 }]
              : [{ yAxis: 5 }],
      },
    };

    if (chartMode === 'line') {
      return baseSeries;
    }

    if (chartMode === 'area') {
      return {
        ...baseSeries,
        areaStyle: { color: soft },
      };
    }

    return {
      ...baseSeries,
      areaStyle: metricKey === 'temperature' ? { color: soft } : undefined,
      lineStyle: metricKey === 'temperature' ? { width: 3, color } : { width: 2.5, color },
      symbolSize: metricKey === 'temperature' ? 8 : 7,
    };
  });
};

export default function TelemetryAnalyticsChart({
  labels = [],
  temperature = [],
  ph = [],
  turbidity = [],
  visibleMetrics = { temperature: true, ph: true, turbidity: true },
  chartMode = 'combined',
  timeRangeLabel = '',
  onToggleMetric,
  onSetChartMode,
  onToggleFullscreen,
  fullscreen = false,
}) {
  const option = useMemo(() => {
    const visible = getVisibleMetrics(visibleMetrics);
    const series = buildSeries({ labels, temperature, ph, turbidity, visibleMetrics, chartMode });

    return {
      backgroundColor: 'transparent',
      animation: true,
      grid: {
        left: 56,
        right: 72,
        top: 88,
        bottom: 84,
        containLabel: true,
      },
      legend: {
        top: 20,
        left: 16,
        right: 16,
        itemWidth: 12,
        itemHeight: 12,
        icon: 'roundRect',
        textStyle: { color: '#475569', fontSize: 12, fontWeight: 600 },
        selected: {
          Temperature: visible.includes('temperature'),
          pH: visible.includes('ph'),
          Turbidity: visible.includes('turbidity'),
        },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc' },
        axisPointer: { type: 'cross' },
        formatter: (params = []) => {
          const lines = Array.isArray(params) ? params : [params];
          const header = `<div style="font-weight:700;margin-bottom:6px">${lines[0]?.axisValueLabel ?? ''}</div>`;
          const body = lines
            .map((item) => {
              const seriesName = item.seriesName || '';
              const metricKey = seriesName.includes('Turbidity') ? 'turbidity' : seriesName.includes('pH') ? 'ph' : 'temperature';
              const unit = metricMeta[metricKey].unit;
              const raw = Array.isArray(item.value) ? item.value[1] : item.value;
              const digits = metricKey === 'ph' ? 2 : 1;
              return `<div style="display:flex;justify-content:space-between;gap:12px;margin:3px 0"><span>${item.marker}${seriesName}</span><strong>${Number(raw ?? 0).toFixed(digits)} ${unit}</strong></div>`;
            })
            .join('');
          return `<div style="min-width:180px">${header}${body}</div>`;
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      toolbox: {
        right: 14,
        top: 12,
        itemSize: 14,
        iconStyle: { borderColor: '#64748b' },
        feature: {
          dataZoom: { yAxisIndex: 'none' },
          restore: {},
          saveAsImage: { name: `fishmaster-${timeRangeLabel || 'analytics'}` },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none',
          zoomOnMouseWheel: 'shift',
          moveOnMouseWheel: true,
          moveOnMouseMove: true,
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          height: 22,
          bottom: 18,
          borderColor: 'rgba(15, 23, 42, 0.12)',
          handleStyle: { color: '#3b82f6' },
          fillerColor: 'rgba(59, 130, 246, 0.18)',
          backgroundColor: 'rgba(148, 163, 184, 0.12)',
        },
      ],
      brush: {
        toolbox: ['rect', 'clear'],
        xAxisIndex: 0,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels,
        axisLabel: {
          color: '#64748b',
          hideOverlap: true,
          interval: 'auto',
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
        axisTick: { alignWithLabel: true },
      },
      yAxis: yAxisConfig,
      series,
    };
  }, [chartMode, labels, ph, temperature, turbidity, timeRangeLabel, visibleMetrics]);

  return (
    <div className={`${styles.chartShell} ${fullscreen ? styles.chartShellFullscreen : ''}`}>
      <div className={styles.chartHeader}>
        <div>
          <p className={styles.chartEyebrow}>Advanced analytics workspace</p>
          <h3>Live Aquarium Telemetry</h3>
          <p className={styles.chartCopy}>
            Smooth curves, range selection, crosshair inspection, and comparison mode in one panel.
          </p>
        </div>

        <div className={styles.chartActions}>
          <div className={styles.segmentedControl} role="tablist" aria-label="Chart mode">
            {['area', 'line', 'combined'].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`${styles.segmentedButton} ${chartMode === mode ? styles.segmentedButtonActive : ''}`}
                onClick={() => onSetChartMode?.(mode)}
                aria-selected={chartMode === mode}
              >
                {mode}
              </button>
            ))}
          </div>

          <button type="button" className={styles.iconButton} onClick={onToggleFullscreen} aria-label="Toggle fullscreen chart">
            {fullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      <div className={styles.metricToggleRow}>
        {Object.entries(metricMeta).map(([key, meta]) => {
          const Icon = meta.icon;
          const active = Boolean(visibleMetrics?.[key]);
          return (
            <button
              key={key}
              type="button"
              className={`${styles.metricToggle} ${active ? styles.metricToggleActive : ''}`}
              onClick={() => onToggleMetric?.(key)}
            >
              <Icon />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <ReactECharts option={option} style={{ height: fullscreen ? '70vh' : '100%', width: '100%' }} notMerge lazyUpdate />
    </div>
  );
}