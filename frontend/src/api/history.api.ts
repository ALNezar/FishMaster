import { apiRequest } from './client';
import { getFeedingHistory } from './feeding.api';
import { fetchRecentPh, fetchRecentTemperature, fetchRecentTurbidity } from './telemetry.api';
import { getTank } from './tank.api';
import {
  FeedingHistoryEntry,
  HistoryEvent,
  HistoryEventStatus,
  HistoryEventType,
  PhReading,
  TemperatureReading,
  TurbidityReading,
} from './types';

type RawHistoryEvent = Partial<HistoryEvent> & Record<string, any>;

const historyEndpointCandidates = [
  (tankId: number | string, limit: number) => `/history?tankId=${encodeURIComponent(String(tankId))}&limit=${limit}`,
  (tankId: number | string, limit: number) => `/history/${encodeURIComponent(String(tankId))}?limit=${limit}`,
  (tankId: number | string, limit: number) => `/tanks/${encodeURIComponent(String(tankId))}/history?limit=${limit}`,
  (tankId: number | string, limit: number) => `/device/history?tankId=${encodeURIComponent(String(tankId))}&limit=${limit}`,
];

const resolveHistoryTimestamp = (value: any): string => {
  const candidates = [value?.timestamp, value?.time, value?.createdAt, value?.serverTimestamp, value?.deviceTimestamp];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
};

const normalizeStatus = (status: any, type: HistoryEventType): HistoryEventStatus => {
  const value = String(status || '').toLowerCase();

  if (value === 'warning' || value === 'warn') return 'warning';
  if (value === 'critical' || value === 'error') return 'critical';
  if (value === 'info' || value === 'information') return 'info';
  if (value === 'success' || value === 'completed' || value === 'done' || value === 'ok') return 'success';

  return type === 'alert' ? 'warning' : 'info';
};

const normalizeType = (type: any): HistoryEventType => {
  const value = String(type || '').toLowerCase();

  if (value === 'feeding' || value === 'feed' || value === 'manual-feeding' || value === 'scheduled-feeding') return 'feeding';
  if (value === 'alert' || value === 'warning' || value === 'alarm') return 'alert';
  if (value === 'maintenance' || value === 'service' || value === 'cleaning' || value === 'filter') return 'maintenance';
  if (value === 'parameter' || value === 'reading' || value === 'telemetry' || value === 'sensor') return 'parameter';

  return 'system';
};

const getTelemetryReadingValue = (
  entry: TemperatureReading | PhReading | TurbidityReading,
  kind: 'temperature' | 'ph' | 'turbidity'
): number => {
  switch (kind) {
    case 'temperature':
      return Number((entry as TemperatureReading).temperature);
    case 'ph':
      return Number((entry as PhReading).ph);
    default:
      return Number((entry as TurbidityReading).ntu);
  }
};

const normalizeHistoryEvent = (
  value: RawHistoryEvent,
  fallback: { tankId: number | string; source: HistoryEvent['source']; index: number }
): HistoryEvent => {
  const type = normalizeType(value.type ?? value.eventType ?? value.kind ?? value.category);
  const title = String(
    value.title ||
      value.name ||
      value.label ||
      value.message ||
      (type === 'feeding' ? 'Feeding event' : type === 'alert' ? 'Alert' : 'Tank update')
  );
  const description = String(value.description || value.details || value.message || value.note || '');

  return {
    id: String(value.id ?? value.eventId ?? `${fallback.source}-${fallback.index}`),
    tankId: value.tankId ?? fallback.tankId,
    type,
    status: normalizeStatus(value.status, type),
    title,
    description: description || title,
    timestamp: resolveHistoryTimestamp(value),
    source: fallback.source,
  };
};

const mapFeedingHistory = (entries: FeedingHistoryEntry[], tankId: number | string): HistoryEvent[] => {
  return entries.map((entry) => ({
    id: `feeding-${entry.id}`,
    tankId,
    type: 'feeding',
    status: entry.status === 'completed' ? 'success' : 'warning',
    title: entry.type === 'manual' ? 'Manual feeding' : 'Scheduled feeding',
    description: `${entry.portionSize} portion${entry.scheduleName ? ` via ${entry.scheduleName}` : ''}`,
    timestamp: resolveHistoryTimestamp({ timestamp: entry.time }),
    source: 'feeding',
  }));
};

const mapTelemetryHistory = <T extends TemperatureReading | PhReading | TurbidityReading>(
  entries: T[],
  tankId: number | string,
  kind: 'temperature' | 'ph' | 'turbidity',
  tankTargets?: { targetTemperature?: number; targetPh?: number }
): HistoryEvent[] => {
  return entries.map((entry) => {
    const numericValue = getTelemetryReadingValue(entry, kind);
    const isWarning =
      kind === 'temperature'
        ? numericValue < 22 || numericValue > 28
        : kind === 'ph'
          ? numericValue < 6.5 || numericValue > 7.5
          : numericValue > 5;

    const title = kind === 'temperature' ? 'Temperature reading' : kind === 'ph' ? 'pH reading' : 'Turbidity reading';
    const unit = kind === 'temperature' ? '°C' : kind === 'ph' ? 'pH' : 'NTU';

    return {
      id: `${kind}-${entry.id}`,
      tankId,
      type: 'parameter',
      status: isWarning ? 'warning' : 'success',
      title,
      description:
        `${Number.isFinite(numericValue) ? numericValue.toFixed(kind === 'ph' ? 2 : 1) : '0'} ${unit} recorded` +
        (kind === 'temperature' && tankTargets?.targetTemperature ? ` (target ${tankTargets.targetTemperature}°C)` : '') +
        (kind === 'ph' && tankTargets?.targetPh ? ` (target ${tankTargets.targetPh})` : ''),
      timestamp: resolveHistoryTimestamp(entry),
      source: 'telemetry',
    };
  });
};

const fetchRemoteHistoryFeed = async (
  tankId: number | string,
  limit: number
): Promise<HistoryEvent[] | null> => {
  for (const buildEndpoint of historyEndpointCandidates) {
    try {
      const response = await apiRequest(buildEndpoint(tankId, limit));

      if (Array.isArray(response)) {
        return response.map((item, index) => normalizeHistoryEvent(item, { tankId, source: 'history', index }));
      }

      if (response && Array.isArray(response.items)) {
        return response.items.map((item: RawHistoryEvent, index: number) =>
          normalizeHistoryEvent(item, { tankId, source: 'history', index })
        );
      }
    } catch {
      continue;
    }
  }

  return null;
};

export const getTankHistoryTimeline = async (
  tankId: number | string,
  limit: number = 25
): Promise<HistoryEvent[]> => {
  const numericTankId = typeof tankId === 'number' ? tankId : Number(String(tankId).replace(/\D/g, ''));
  const resolvedTankId = Number.isFinite(numericTankId) && numericTankId > 0 ? numericTankId : 1;
  const telemetryTankId = `tank${resolvedTankId}`;

  const tankPromise = getTank(resolvedTankId).catch(() => null);
  const remoteHistoryPromise = fetchRemoteHistoryFeed(tankId, limit);
  const feedingHistoryPromise = getFeedingHistory(limit, tankId).catch(() => []);
  const temperaturePromise = fetchRecentTemperature(telemetryTankId, limit).catch(() => []);
  const phPromise = fetchRecentPh(telemetryTankId, limit).catch(() => []);
  const turbidityPromise = fetchRecentTurbidity(telemetryTankId, limit).catch(() => []);

  const [tank, remoteHistory, feedingHistory, temperatureHistory, phHistory, turbidityHistory] = await Promise.all([
    tankPromise,
    remoteHistoryPromise,
    feedingHistoryPromise,
    temperaturePromise,
    phPromise,
    turbidityPromise,
  ]);

  if (remoteHistory && remoteHistory.length > 0) {
    return remoteHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  const combined = [
    ...mapFeedingHistory(feedingHistory, tankId),
    ...mapTelemetryHistory(temperatureHistory, tankId, 'temperature', tank?.waterParameters),
    ...mapTelemetryHistory(phHistory, tankId, 'ph', tank?.waterParameters),
    ...mapTelemetryHistory(turbidityHistory, tankId, 'turbidity', tank?.waterParameters),
  ];

  return combined
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};