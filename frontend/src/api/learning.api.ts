// Learning hub API endpoints

import {
  LearningSectionPreview,
  LearningSection,
  LearningProgress,
  LearningSectionPreview as SectionPreview,
} from '../types';
import { LEARNING_PROGRESS_KEY } from './config';

// Learning sections data
const learningSections: LearningSection[] = [
  {
    id: 'temperature',
    title: 'Temperature Sensor',
    icon: 'temperature',
    sensorImage: '/sensor-temp.png',
    summary: 'Measures tank water warmth in °C or °F',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description:
          'Thermometers (usually a probe submerged in the tank) measure how warm or cold the water is. Fish are cold-blooded—their metabolism, immunity, and digestion all depend on stable temperature. Most tropical freshwater fish need 24-26°C (75-79°F).',
        images: [
          { src: '/temp-probe-full.png', caption: 'Complete temperature probe assembly' },
          { src: '/temp-sensor-close.png', caption: 'Close-up of sensor tip' },
          { src: '/temp-reading-display.png', caption: 'How readings appear on FishMaster' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description:
          'Look at the current value in Analytics or on the Dashboard card. Check the trend line—steady line = stable (good), wandering up or down = drifting (investigate heater or environment). Compare against your target range set during onboarding.',
        images: [
          { src: '/temp-reading-stable.png', caption: 'A stable, steady temperature line' },
          { src: '/temp-reading-drift.png', caption: 'Temperature drifting upward (action needed)' },
          { src: '/temp-dashboard-card.png', caption: 'Quick glance at current temp on Dashboard' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description:
          'Most tropical fish: 24-26°C (75-79°F). Coldwater fish: 18-22°C (64-72°F). Discus: 26-28°C (79-82°F). Check your fish species in the app—safe range is shown to help.',
        images: [
          { src: '/temp-range-tropical.png', caption: 'Tropical fish Safe Zone' },
          { src: '/temp-range-coldwater.png', caption: 'Coldwater fish Safe Zone' },
          { src: '/temp-range-chart.png', caption: 'Full temperature range guide' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description:
          'Heater stuck ON, broken thermostat, room is too warm, direct sunlight on tank, or electrical issue. High temp speeds up fish metabolism (fish breathe faster, need more oxygen). Stress, disease, and algae blooms follow quickly.',
        images: [
          { src: '/temp-high-heater.png', caption: 'Broken heater causing spike' },
          { src: '/temp-high-sunlight.png', caption: 'Window sunlight warming tank' },
          { src: '/temp-high-stress.png', caption: 'Fish stress symptoms from high temp' },
          { src: '/temp-high-fix-steps.png', caption: 'Quick steps to lower temperature' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low?',
        description:
          'Heater off or malfunctioning, room is cold, AC is too strong, or water change with unheated water added. Low temp slows everything—less feed uptake, weaker immunity, lethargy. Fish may pile at the surface or huddle on the bottom.',
        images: [
          { src: '/temp-low-heater-off.png', caption: 'Heater powered off or unplugged' },
          { src: '/temp-low-cold-room.png', caption: 'Cold room temperature impact' },
          { src: '/temp-low-behavior.png', caption: 'Fish behavior during low temp stress' },
          { src: '/temp-low-fix-steps.png', caption: 'How to safely warm the tank' },
        ],
      },
    ],
  },
  {
    id: 'ph',
    title: 'pH Sensor',
    icon: 'ph',
    sensorImage: '/sensor-ph.png',
    summary: 'Measures how acidic or alkaline your water is (0–14 scale)',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description:
          'pH is the measure of acidity vs. alkalinity (0 = most acidic, 7 = neutral, 14 = most alkaline). Fish are sensitive to shifts. Most freshwater fish prefer neutral to slightly acidic (6.5–7.5). Small pH swings stress fish and damage gills.',
        images: [
          { src: '/ph-probe.png', caption: 'pH electrode probe' },
          { src: '/ph-scale.png', caption: 'pH scale explained (0–14)' },
          { src: '/ph-reading.png', caption: 'pH reading displayed in-app' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description:
          'Check the numeric value (e.g., 7.2). Compare to your species target range (usually 6.5–7.5). If the trend line is climbing or dropping, your water is shifting—investigate decay (ammonia build-up), driftwood, or tap water changes.',
        images: [
          { src: '/ph-reading-safe.png', caption: 'Stable pH in Safe Zone' },
          { src: '/ph-reading-climbing.png', caption: 'pH trending upward (investigate)' },
          { src: '/ph-trend-7-day.png', caption: '7-day pH trend showing drift' },
          { src: '/ph-alert-high.png', caption: 'pH alert notification' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description:
          'Neutral community fish: 6.8–7.2. Acidic-loving: 5.8–6.8 (e.g., tetras, discus). Alkaline-loving: 7.5–8.5 (e.g., cichlids). Check your tank profile to see your target range.',
        images: [
          { src: '/ph-range-acidic.png', caption: 'Acidic zone (5.5–6.5)' },
          { src: '/ph-range-neutral.png', caption: 'Neutral zone (6.8–7.2)' },
          { src: '/ph-range-alkaline.png', caption: 'Alkaline zone (7.5–8.5)' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description:
          'Tap water is alkaline, gravel/rockwork leaches minerals, bacterial load is low (new tank), or water hasn\'t cycled properly. High pH stresses acidophilic fish and can cause gill burns, gasping behavior, and poor appetite.',
        images: [
          { src: '/ph-high-gravel.png', caption: 'Alkaline gravel raising pH' },
          { src: '/ph-high-tap-water.png', caption: 'Alkaline tap water impact' },
          { src: '/ph-high-fish-stress.png', caption: 'Fish showing stress from high pH' },
          { src: '/ph-high-fix-directions.png', caption: 'Lowering pH: natural methods' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low?',
        description:
          'Driftwood or peat in substrate releasing tannins, decaying plant matter, bacterial urea accumulation, or acidic substrate. Low pH stresses alkaliphilic fish, reduces immune response, and can cause erosion of fish slime coat.',
        images: [
          { src: '/ph-low-driftwood.png', caption: 'Driftwood lowering pH (tannins)' },
          { src: '/ph-low-decay.png', caption: 'Decaying plants releasing acids' },
          { src: '/ph-low-buildup.png', caption: 'Bacterial waste acidifying water' },
          { src: '/ph-low-fix-directions.png', caption: 'Raising pH: rock additions, water change' },
        ],
      },
    ],
  },
  {
    id: 'turbidity',
    title: 'Turbidity Sensor',
    icon: 'turbidity',
    sensorImage: '/sensor-turbidity.png',
    summary: 'Measures water clarity (how cloudy or clear it is)',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description:
          'Turbidity is water cloudiness caused by suspended particles (algae spores, bacteria, uneaten food, dead material). Lower turbidity = clearer water = healthier. High turbidity can reduce light penetration and oxygen, and strains fish gills. Measured in NTU (Nephelometric Turbidity Units).',
        images: [
          { src: '/turbidity-sensor.png', caption: 'Turbidity sensor probe' },
          { src: '/turbidity-clear.png', caption: 'Crystal-clear water (low turbidity)' },
          { src: '/turbidity-cloudy.png', caption: 'Cloudy water (high turbidity)' },
          { src: '/turbidity-reading.png', caption: 'Turbidity reading in app (NTU)' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description:
          'Lower values = clearer water (better). Typical ranges: <1 NTU = crystal clear, 1–5 NTU = slightly hazy, >5 NTU = noticeably cloudy. Check if turbidity is creeping up—early sign of filter clogging, overfeeding, or bacterial bloom.',
        images: [
          { src: '/turbidity-reading-clear.png', caption: 'Low turbidity (good)' },
          { src: '/turbidity-reading-hazy.png', caption: 'Moderate turbidity (marginal)' },
          { src: '/turbidity-reading-cloudy.png', caption: 'High turbidity (action needed)' },
          { src: '/turbidity-trend-rising.png', caption: 'Turbidity trend climbing over 7 days' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description:
          'Target: <1–2 NTU. Acceptable: 1–4 NTU. Concerning: >4 NTU (indicates filter stress or overload). Brand-new tank (first week) may be 3–5 NTU as cycle establishes, then clears within 1–2 weeks.',
        images: [
          { src: '/turbidity-range-excellent.png', caption: 'Excellent clarity zone' },
          { src: '/turbidity-range-acceptable.png', caption: 'Acceptable range' },
          { src: '/turbidity-range-concerning.png', caption: 'Concerning turbidity levels' },
          { src: '/turbidity-new-tank-timeline.png', caption: 'How clarity improves over 2 weeks' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description:
          'Overfeeding (uneaten particles decay), bacterial or algae bloom, filter clogged or needs priming, gravel stirred up during maintenance, new tank cycling, or excess decor waste.',
        images: [
          { src: '/turbidity-high-overfeeding.png', caption: 'Cloudiness from overfeeding' },
          { src: '/turbidity-high-bloom.png', caption: 'Bacterial/algae bloom example' },
          { src: '/turbidity-high-clogged-filter.png', caption: 'Clogged filter causing cloudiness' },
          { src: '/turbidity-high-fix-steps.png', caption: 'Steps to clear cloudy water' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low',
        description:
          'Excellent! Filter is working well, feeding quantity is right, no algae or bacterial bloom, and water changes are regular. Maintain it by feeding carefully, cleaning the filter periodically, and doing weekly water changes.',
        images: [
          { src: '/turbidity-low-perfect.png', caption: 'Ideal crystal-clear tank' },
          { src: '/turbidity-low-maintenance.png', caption: 'Maintenance routine that keeps it clear' },
          { src: '/turbidity-low-comparison.png', caption: 'Before/after filter cleaning' },
          { src: '/turbidity-low-tips.png', caption: 'Tips to maintain low turbidity' },
        ],
      },
    ],
  },
];

// Helper: get learning progress from localStorage
function getStoredLearningProgress(): LearningProgress {
  const fallback: LearningProgress = {
    viewedSectionIds: [],
    lastViewedSection: null,
    totalSections: 0,
    viewedCount: 0,
    completionRate: 0,
  };

  try {
    const raw = localStorage.getItem(LEARNING_PROGRESS_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

// Helper: save learning progress to localStorage
function saveStoredLearningProgress(progress: Partial<LearningProgress>): LearningProgress {
  const current = getStoredLearningProgress();
  const updated = { ...current, ...progress };
  localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(updated));
  return updated;
}

// Get all learning sections as previews
export const getLearningSections = async (): Promise<LearningSectionPreview[]> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return learningSections.map((section) => ({
    id: section.id,
    title: section.title,
    icon: section.icon,
    sensorImage: section.sensorImage,
    summary: section.summary,
    subsectionCount: section.subsections.length,
  }));
};

// Get full learning section details
export const getLearningSection = async (
  sectionId: string
): Promise<LearningSection | null> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const section = learningSections.find((s) => s.id === sectionId);
  if (!section) return null;

  // Track viewing progress
  const progress = getStoredLearningProgress();
  if (!progress.viewedSectionIds.includes(sectionId)) {
    progress.viewedSectionIds.push(sectionId);
  }
  progress.lastViewedSection = sectionId;
  saveStoredLearningProgress(progress);

  return section;
};

// Get overall learning progress
export const getLearningProgress = async (): Promise<LearningProgress> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const progress = getStoredLearningProgress();
  const totalSections = learningSections.length;
  const viewedCount = progress.viewedSectionIds.length;
  const completionRate =
    totalSections === 0 ? 0 : Math.round((viewedCount / totalSections) * 100);

  return { ...progress, totalSections, viewedCount, completionRate };
};

// Get learning paths (same as sections for this version)
export const getLearningPaths = async (): Promise<LearningSectionPreview[]> => {
  return getLearningSections();
};

// Lesson stub endpoints (for future expansion)
export const getLessons = async (pathId?: string): Promise<any[]> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return [];
};

export const getLesson = async (lessonId: string): Promise<any> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return null;
};

export const completeLesson = async (lessonId: string): Promise<LearningProgress> => {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return getLearningProgress();
};

export const getRecommendedLessons = async (): Promise<any[]> => {
  return [];
};
