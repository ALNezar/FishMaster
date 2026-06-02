import { apiRequest } from './client';

export interface AdvisorAlertCard {
  id: string;
  iconKey: string;
  tone: string;
  message: string;
  metric?: string;
}

export interface AdvisorQuest {
  key: string;
  title: string;
  iconKey: string;
  status: 'done' | 'todo';
  source?: string | null;
  manual: boolean;
}

export interface AdvisorSpeciesWarning {
  title: string;
  message: string;
  fishNames: string[];
}

export interface AdvisorSnapshot {
  tankId: number;
  tankName: string;
  healthPercent: number;
  mood: 'happy' | 'okay' | 'stressed';
  moodLabel: string;
  alertCards: AdvisorAlertCard[];
  quests: AdvisorQuest[];
  speciesWarnings: AdvisorSpeciesWarning[];
  weeklyReport: string[];
  recommendedActions: string[];
  sizeLiters?: number;
  fishCount?: number;
  compatibilityLabel?: string;
  currentTemperature?: number | null;
  idealTempMin?: number | null;
  idealTempMax?: number | null;
  temperatureStatus?: string;
  stockingPercent?: number;
}

export const getAdvisorSnapshot = async (tankId: number): Promise<AdvisorSnapshot> => {
  return apiRequest(`/api/advisor/tanks/${tankId}`);
};

export const completeAdvisorQuest = async (
  tankId: number,
  questKey: string
): Promise<AdvisorSnapshot> => {
  return apiRequest(`/api/advisor/tanks/${tankId}/quests/${questKey}/complete`, {
    method: 'POST',
  });
};
