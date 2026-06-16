import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { FaCompress, FaExpand, FaTint, FaThermometerHalf, FaWater } from 'react-icons/fa';
import styles from './TelemetryAnalyticsChart.module.scss';

const MOBILE_MAX_WIDTH = 600;

const COLORS = {
  temperature: '#b01222',
  temperatureSoft: 'rgba(176, 18, 34, 0.14)',
  ph: '#16a34a',
  phSoft: 'rgba(22, 163, 74, 0.14)',
  turbidity: '#ca8a04',
  turbiditySoft: 'rgba(202, 138, 4, 0.14)',
};

const metricMeta = {
  temperature: { label: 'Temperature', icon: FaThermometerHalf, unit: '°C', yMin: 20, yMax: 32, ideal: 25 },
  ph: { label: 'pH', icon: FaTint, unit: 'pH', yMin: 6, yMax: 8.5, ideal: 7 },
  turbidity: { label: 'Turbidity', icon: FaWater, unit: 'NTU', yMin: 0, yMax: 15, ideal: 3 },
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const getVisibleMetrics = (visibleMetrics) =>
  Object.entries(visibleMetrics || {})
    .filter(([, visible]) => Boolean(visible))
    .map(([key]) => key);

function buildYAxes(visible, isMobile) {
  return visible.map((metricKey, index) => {
    const meta = metricMeta[metricKey];
    const color = COLORS[metricKey];
    const useSingleAxis = visible.length === 1;
    return {
      type: 'value',
      name: meta.unit,
      show: true,
      position: useSingleAxis ? 'left' : index === 0 ? 'left' : 'right',
      offset: !useSingleAxis && index === 2 ? 48 : 0,
      nameLocation: 'end',
      nameGap: 8,
      nameTextStyle: { color: '#7b6b5b', fontSize: 11 },
      axisLine: { show: true, lineStyle: { color } },
      axisLabel: { color: '#7b6b5b', fontSize: 10 },
      splitLine: {
        show: index === 0,
        lineStyle: { color: 'rgba(61, 48, 33, 0.08)' },
      },
      min: meta.yMin,
      max: meta.yMax,
    };
  });
}

function buildSeries({ labels, temperature, ph, turbidity, visibleMetrics, chartMode }) {
  const visible = getVisibleMetrics(visibleMetrics);
  const count = labels.length;

  return visible.map((metricKey, axisIndex) => {
    const meta = metricMeta[metricKey];
    const color = COLORS[metricKey];
    const soft = COLORS[`${metricKey}Soft`];
    const source = metricKey === 'temperature' ? temperature : metricKey === 'ph' ? ph : turbidity;
    const values = asArray(source);
    const data = Array.from({ length: count }, (_, index) => safeNumber(values[index]));

    const baseSeries = {
      name: meta.label,
      type: 'line',
      smooth: 0.35,
      showSymbol: false,
      data,
      yAxisIndex: axisIndex,
      connectNulls: true,
      lineStyle: { width: 2.5, color },
      itemStyle: { color },
      emphasis: { focus: 'series', lineStyle: { width: 3 } },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', color: 'rgba(61, 48, 33, 0.22)' },
        label: { show: false },
        data: [{ yAxis: meta.ideal }],
      },
    };

    if (chartMode === 'area' || chartMode === 'combined') {
      return {
        ...baseSeries,
        areaStyle: chartMode === 'combined' && metricKey !== 'temperature' ? undefined : { color: soft },
      };
    }

    return baseSeries;
  });
}

export default function TelemetryAnalyticsChart({
  labels = [],
  temperature = [],
  ph = [],
  turbidity = [],
  visibleMetrics = { temperature: true, ph: true, turbidity: true },
  chartMode = 'area',
  timeRangeLabel = '',
  onToggleMetric,
  onSetChartMode,
  onToggleFullscreen,
  fullscreen = false,
  compact = true,
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const chartHeight = fullscreen ? '70vh' : isMobile ? 300 : 380;

  const option = useMemo(() => {
    const visible = getVisibleMetrics(visibleMetrics);
    const series = buildSeries({ labels, temperature, ph, turbidity, visibleMetrics, chartMode });
    const hasRenderableData = series.some((item) => item.data?.some((v) => v != null));
    const yAxis = buildYAxes(visible, isMobile);
    const gridRight = visible.length <= 1 ? 16 : visible.length === 2 ? 48 : 72;
    const gridBottom = isMobile ? 36 : 52;

    return {
      backgroundColor: 'transparent',
      animation: false,
      animationDurationUpdate: 0,
      grid: {
        left: 12,
        right: gridRight,
        top: compact ? 12 : 48,
        bottom: gridBottom,
        containLabel: true,
      },
      legend: {
        show: !compact && !isMobile,
        top: 8,
        left: 8,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#7b6b5b', fontSize: 11 },
      },
      tooltip: {
        show: hasRenderableData,
        trigger: 'axis',
        confine: true,
        backgroundColor: 'rgba(61, 48, 33, 0.94)',
        borderWidth: 0,
        textStyle: { color: '#fbf8ef', fontSize: 12 },
        axisPointer: { type: isMobile ? 'line' : 'cross' },
        formatter: (params = []) => {
          const lines = Array.isArray(params) ? params : [params];
          const validLines = lines.filter((item) => item && item.seriesName);
          if (!validLines.length) return '';
          const header = `<div style="font-weight:700;margin-bottom:6px">${validLines[0]?.axisValueLabel ?? ''}</div>`;
          const body = validLines
            .map((item) => {
              const seriesName = item.seriesName || '';
              const metricKey = seriesName.includes('Turbidity')
                ? 'turbidity'
                : seriesName.includes('pH')
                  ? 'ph'
                  : 'temperature';
              const unit = metricMeta[metricKey].unit;
              const raw = Array.isArray(item.value) ? item.value[1] : item.value;
              const digits = metricKey === 'ph' ? 2 : 1;
              const valueText = Number.isFinite(Number(raw)) ? Number(raw).toFixed(digits) : '--';
              return `<div style="display:flex;justify-content:space-between;gap:12px;margin:3px 0"><span>${item.marker || ''}${seriesName}</span><strong>${valueText} ${unit}</strong></div>`;
            })
            .join('');
          return `<div style="min-width:160px">${header}${body}</div>`;
        },
      },
      toolbox: isMobile
        ? undefined
        : {
            right: 8,
            top: 4,
            itemSize: 13,
            feature: {
              restore: {},
              saveAsImage: { name: `fishmaster-${timeRangeLabel || 'analytics'}` },
            },
          },
      dataZoom: isMobile
        ? []
        : [
            {
              type: 'inside',
              xAxisIndex: 0,
              filterMode: 'none',
              zoomOnMouseWheel: 'shift',
              moveOnMouseMove: false,
              disabled: !hasRenderableData,
            },
          ],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels,
        axisLabel: {
          color: '#7b6b5b',
          hideOverlap: true,
          interval: isMobile ? 'auto' : 0,
          fontSize: 10,
          rotate: isMobile ? 0 : 30,
        },
        axisLine: { lineStyle: { color: 'rgba(61, 48, 33, 0.2)' } },
      },
      yAxis,
      series,
    };
  }, [chartMode, compact, isMobile, labels, ph, temperature, timeRangeLabel, turbidity, visibleMetrics]);

  return (
    <div className={`${styles.chartShell} ${fullscreen ? styles.chartShellFullscreen : ''}`}>
      <div className={styles.chartHeader}>
        {!compact && (
          <div>
            <h3 className={styles.chartTitle}>Sensor trends</h3>
            {timeRangeLabel ? <p className={styles.chartRange}>{timeRangeLabel}</p> : null}
          </div>
        )}

        <div className={styles.chartActions}>
          <div className={styles.segmentedControl} role="tablist" aria-label="Chart mode">
            {['area', 'line'].map((mode) => (
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

          <button
            type="button"
            className={styles.iconButton}
            onClick={onToggleFullscreen}
            aria-label="Toggle fullscreen chart"
          >
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
              style={active ? { '--metric-color': COLORS[key] } : undefined}
            >
              <Icon />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.chartCanvasWrapper}>
        <div className={styles.chartCanvas} style={{ height: chartHeight }}>
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge
            lazyUpdate={false}
          />
        </div>
      </div>
    </div>
  );
}
