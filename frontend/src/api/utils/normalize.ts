// Response normalization utilities

import { FishType, Fish } from '../types';

// Helper to convert various types to numbers safely
const toNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null) return parseFloat(val) || 0;
  return parseFloat(val) || 0;
};

// Normalize fish type data
const normalizeFishType = (fishType: any): FishType => {
  if (!fishType) {
    return {
      id: 0,
      name: 'Unknown',
      careLevel: 'Easy',
      phMin: 6.5,
      phMax: 7.5,
      temperatureMin: 22,
      temperatureMax: 28,
      minTankSize: 40,
    };
  }

  let estimatedMinTankSize = 40;
  if (fishType.careLevel) {
    const level = fishType.careLevel.toLowerCase();
    if (level === 'beginner' || level === 'easy') estimatedMinTankSize = 20;
    else if (level === 'intermediate' || level === 'moderate' || level === 'medium')
      estimatedMinTankSize = 40;
    else if (level === 'advanced' || level === 'hard' || level === 'expert')
      estimatedMinTankSize = 75;
  }

  return {
    id: fishType.id ?? 0,
    name: fishType.name || 'Unknown',
    careLevel: fishType.careLevel || 'Easy',
    phMin: toNumber(fishType.phMin ?? fishType.minPh),
    phMax: toNumber(fishType.phMax ?? fishType.maxPh),
    temperatureMin: toNumber(fishType.temperatureMin ?? fishType.minTemp),
    temperatureMax: toNumber(fishType.temperatureMax ?? fishType.maxTemp),
    minTankSize: toNumber(fishType.minTankSize ?? estimatedMinTankSize),
    description: fishType.description || '',
  };
};

// Main normalization function
export const normalizeResponse = (data: any, endpoint: string): any => {
  if (!data || typeof data !== 'object') return data;

  // Normalize tank detail with fish
  if (endpoint.match(/^\/tanks\/\d+$/) && data.fish) {
    data.fish = data.fish.map((fish: any) => ({
      id: fish.id,
      name: fish.name || 'Unnamed Fish',
      fishType: normalizeFishType(fish.fishType),
      createdAt: fish.createdAt,
    }));

    if (!data.waterParameters) {
      data.waterParameters = {
        targetPh: 7.0,
        targetTemperature: 25,
        ph: 7.0,
        temperature: 25,
      };
    }
  }

  // Normalize fish types array
  if (endpoint.includes('/fish-types') && Array.isArray(data)) {
    return data.map((fishType: any) => normalizeFishType(fishType));
  }

  // Normalize single fish with type
  if (endpoint.match(/^\/tanks\/\d+\/fish$/) && data.id && data.fishType) {
    return {
      id: data.id,
      name: data.name || 'Unnamed Fish',
      fishType: normalizeFishType(data.fishType),
      createdAt: data.createdAt,
    };
  }

  // Log warning for fish without type
  if (endpoint.match(/^\/tanks\/\d+\/fish$/) && data.id && !data.fishType) {
    console.warn('Backend returned fish without fishType, fetching tank to get full data');
    return data;
  }

  return data;
};
