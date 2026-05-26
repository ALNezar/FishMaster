// Learning hub API endpoints

import {
  LearningSectionPreview,
  LearningSection,
  LearningProgress,
} from './types';
import { LEARNING_PROGRESS_KEY } from './config';
import tempProbeImage from '../assets/images/learning/temperature-probe.svg';
import phSensorImage from '../assets/images/learning/ph-sensor.svg';
import turbiditySensorImage from '../assets/images/learning/turbidity-sensor.svg';
import placeholderImage from '../assets/images/learning/placeholder.svg';
import { API_BASE_URL } from './config';

type LearningLesson = {
  id: string;
  sectionId: string;
  topic: string;
  title: string;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMin: number;
  why: string;
  checks: string[];
  actions: string[];
  cta: {
    label: string;
    route: string;
  };
  images: Array<{
    src: string;
    caption: string;
  }>;
};

function createSvgDataUri(title: string, accent: string, subtitle: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f7fbfd" />
          <stop offset="100%" stop-color="#e8f3fa" />
        </linearGradient>
      </defs>
      <rect width="960" height="640" rx="40" fill="url(#bg)" />
      <circle cx="810" cy="120" r="110" fill="${accent}" fill-opacity="0.12" />
      <circle cx="130" cy="500" r="150" fill="${accent}" fill-opacity="0.09" />
      <rect x="90" y="90" width="780" height="460" rx="32" fill="#ffffff" stroke="${accent}" stroke-opacity="0.14" stroke-width="4" />
      <rect x="132" y="132" width="240" height="34" rx="17" fill="${accent}" fill-opacity="0.12" />
      <text x="150" y="325" fill="#203345" font-family="Arial, sans-serif" font-size="54" font-weight="700">${title}</text>
      <text x="150" y="385" fill="#4d6575" font-family="Arial, sans-serif" font-size="30">${subtitle}</text>
      <g transform="translate(150 440)">
        <rect width="170" height="18" rx="9" fill="${accent}" fill-opacity="0.78" />
        <rect x="190" width="250" height="18" rx="9" fill="${accent}" fill-opacity="0.34" />
        <rect x="460" width="140" height="18" rx="9" fill="${accent}" fill-opacity="0.18" />
      </g>
      <g transform="translate(630 210)">
        <circle cx="80" cy="80" r="72" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-width="8" />
        <rect x="70" y="30" width="20" height="100" rx="10" fill="${accent}" />
        <rect x="35" y="74" width="90" height="20" rx="10" fill="${accent}" />
      </g>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createLessonEntry({ sectionId, topic, title, summary, difficulty, durationMin, why, checks, actions, cta, images }: Omit<LearningLesson, 'id'>): LearningLesson {
  return {
    id: `${sectionId}:${topic.toLowerCase().replace(/\s+/g, '-')}`,
    sectionId,
    topic,
    title,
    summary,
    difficulty,
    durationMin,
    why,
    checks,
    actions,
    cta,
    images,
  };
}

// Learning sections data
const learningSections: LearningSection[] = [
  {
    id: 'temperature',
    title: 'Temperature Sensor',
    icon: 'temperature',
    sensorImage: tempProbeImage,
    summary: 'Tracks tank warmth so you can keep fish in their comfort zone.',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description:
          'The temperature probe measures water warmth in real time. Fish depend on stable heat for breathing, feeding, and immunity, so even small swings matter.',
        images: [
          { src: tempProbeImage, caption: 'Probe placement for accurate readings' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description:
          'Read the live value and the trend together. A flat line means your tank is steady. A climb or drop means the heater or room conditions need attention.',
        images: [
          { src: createSvgDataUri('Stable reading', '#16a34a', 'Flat line, healthy water temperature'), caption: 'Stable temperature line' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description:
          'Most tropical fish stay comfortable at 24–26°C. Coldwater species need less heat, while discus and other specialist fish prefer slightly warmer water.',
        images: [
          { src: createSvgDataUri('Safe range', '#0e5a85', 'Comfort zone for fish species'), caption: 'Recommended range guide' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description:
          'Heat spikes usually come from a stuck heater, bright sunlight, or a room that is too warm. High temperatures raise stress and reduce oxygen.',
        images: [
          { src: createSvgDataUri('Heat spike', '#dc2626', 'Too much heat pushes fish out of range'), caption: 'How a temperature spike looks' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low?',
        description:
          'Low temperature usually means the heater is off, the room is cold, or cool water was added too quickly during a change.',
        images: [
          { src: createSvgDataUri('Low heat', '#1277b0', 'Cold water slows fish activity'), caption: 'Low temperature warning' },
        ],
      },
    ],
  },
  {
    id: 'ph',
    title: 'pH Sensor',
    icon: 'ph',
    sensorImage: phSensorImage,
    summary: 'Shows how acidic or alkaline the water is and whether the probe needs care.',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description:
          'A glass pH probe measures acidity and alkalinity on a 0–14 scale. Fish usually need a stable, near-neutral range, and the probe needs a wet gel layer to work correctly.',
        images: [
          { src: phSensorImage, caption: 'pH range overview' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description:
          'Read the number and watch the trend. A calm line means the tank is stable. Drift means something changed in the water or the probe needs recalibration.',
        images: [
          { src: createSvgDataUri('Calibrated reading', '#16a34a', 'Stable pH value on the dashboard'), caption: 'Healthy pH reading' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description:
          'Most community fish do well around 6.8–7.4. Some species prefer softer acidic water, while others need a little more alkalinity.',
        images: [
          { src: createSvgDataUri('pH target zone', '#0e5a85', 'Neutral water band'), caption: 'Target pH band' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description:
          'pH rises when tap water is alkaline, rocks release minerals, or the tank is still stabilizing after setup.',
        images: [
          { src: createSvgDataUri('High pH', '#ca8a04', 'Alkaline drift from substrate or tap water'), caption: 'Why pH climbs' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low?',
        description:
          'pH drops when driftwood, peat, or decaying waste releases acids into the water.',
        images: [
          { src: createSvgDataUri('Low pH', '#dc2626', 'Acidic drift from organic buildup'), caption: 'Why pH falls' },
        ],
      },
    ],
  },
  {
    id: 'turbidity',
    title: 'Turbidity Sensor',
    icon: 'turbidity',
    sensorImage: turbiditySensorImage,
    summary: 'Shows how clear the water is and whether the filter is keeping up.',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description:
          'Turbidity measures cloudiness caused by particles, food waste, and blooms. Lower numbers mean clearer water and less stress on fish gills.',
        images: [
          { src: turbiditySensorImage, caption: 'Clear tank example' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description:
          'Lower values are better. A small increase means the filter or feeding routine may need a check before the water gets cloudy.',
        images: [
          { src: createSvgDataUri('Trend up', '#ca8a04', 'Cloudiness creeping upward'), caption: 'Rising turbidity trend' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description:
          'Under 1–2 NTU is excellent. A reading above 4 NTU usually means the filter is under pressure or the tank has extra waste.',
        images: [
          { src: createSvgDataUri('Safe clarity', '#16a34a', 'Recommended turbidity band'), caption: 'Healthy clarity range' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description:
          'Cloudy water usually comes from overfeeding, a clogged filter, a bloom, or debris stirred up during maintenance.',
        images: [
          { src: createSvgDataUri('Cloudy water', '#dc2626', 'Particles and blooms reduce clarity'), caption: 'Cloudy water warning' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low?',
        description:
          'Low turbidity means the filter is working and the tank is being fed and cleaned in a controlled way.',
        images: [
          { src: createSvgDataUri('Crystal clear', '#1277b0', 'Low turbidity and healthy filter action'), caption: 'Excellent clarity' },
        ],
      },
    ],
  },
];

const lessonPlans: LearningLesson[] = [
  createLessonEntry({
    sectionId: 'temperature',
    topic: 'Temperature',
    title: 'Keep Heat Stable',
    summary: 'Learn how to read the temperature probe and keep the tank in the safe comfort zone.',
    difficulty: 'Beginner',
    durationMin: 5,
    why: 'Temperature swings can make fish stressed, sluggish, or oxygen-starved.',
    checks: [
      'Confirm the probe is fully submerged but away from heater output.',
      'Compare the live reading to your species target range.',
      'Watch the trend for sudden spikes or dips after water changes.',
    ],
    actions: [
      'Move heaters or lights if the tank is being warmed unevenly.',
      'Raise or lower temperature slowly in small steps.',
      'Recheck after the water has stabilized.',
    ],
    cta: { label: 'Open Temperature Dashboard', route: '/dashboard' },
    images: [
        { src: tempProbeImage, caption: 'Temperature overview' },
        { src: tempProbeImage, caption: 'Safe range band' },
    ],
  }),
  createLessonEntry({
    sectionId: 'ph',
    topic: 'pH',
    title: 'Handle the Glass Probe Carefully',
    summary: 'Learn the activation soak, dry connector rule, and buffer rinse routine that keeps pH readings trustworthy.',
    difficulty: 'Intermediate',
    durationMin: 7,
    why: 'A dry bulb, wet connector, or dirty buffer cup can make the probe read wildly wrong.',
    checks: [
      'If the probe is new or dry, soak it in the storage solution before calibration.',
      'Keep the BNC connector dry at all times.',
      'Rinse with distilled water between buffers and blot gently.',
    ],
    actions: [
      'Return the storage cap with liquid when the probe is out of the tank.',
      'Use clean pH 4.0, 7.0, or 9.18 solutions without cross-contamination.',
      'Recalibrate if the reading drifts after handling.',
    ],
    cta: { label: 'Open pH Maintenance', route: '/education/progress' },
    images: [
      { src: phSensorImage, caption: 'Probe care reminder' },
      { src: phSensorImage, caption: 'Calibration flow' },
    ],
  }),
  createLessonEntry({
    sectionId: 'turbidity',
    topic: 'Turbidity',
    title: 'Read Water Clarity Early',
    summary: 'Spot rising cloudiness before it becomes a filter or feeding problem.',
    difficulty: 'Beginner',
    durationMin: 5,
    why: 'Cloudiness often shows up before bigger water quality issues do.',
    checks: [
      'Check whether the water looks clear or hazy in the glass and the app.',
      'See if the trend is climbing after feeding or cleaning.',
      'Inspect the filter for clogging or low flow.',
    ],
    actions: [
      'Reduce feeding if particles are building up.',
      'Clean the filter or do a partial water change.',
      'Watch the trend over the next day.',
    ],
    cta: { label: 'Open Water Clarity', route: '/dashboard' },
    images: [
      { src: turbiditySensorImage, caption: 'Clear water' },
      { src: turbiditySensorImage, caption: 'Cloudiness warning' },
    ],
  }),
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
// Learning content is local-first for reliability. Toggle this to true only when
// backend learning endpoints are stable and publicly accessible.
const ENABLE_REMOTE_LEARNING = false;
let learningForbidden = !ENABLE_REMOTE_LEARNING;

export const getLearningSections = async (): Promise<LearningSectionPreview[]> => {
  // If we've already seen the backend forbid learning, skip network attempts
  if (!learningForbidden) {
    try {
      const resp = await fetch(`${API_BASE_URL}/learning`, { method: 'GET' });
      if (resp) {
        if (resp.status === 403) {
          learningForbidden = true;
        } else if (resp.ok) {
          const json = await resp.json();
          if (Array.isArray(json)) return json;
        }
      }
    } catch (e) {
      // network failed — we'll continue to return local preview data
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 120));
  const previewMeta: Record<string, { level: string; description: string; lessonsCount: number; durationMin: number }> = {
    temperature: {
      level: 'Core',
      description: 'Learn how to keep water warmth stable and fish comfortable.',
      lessonsCount: 5,
      durationMin: 25,
    },
    ph: {
      level: 'Precision',
      description: 'Understand probe care, calibration, and safe pH ranges.',
      lessonsCount: 5,
      durationMin: 35,
    },
    turbidity: {
      level: 'Observation',
      description: 'Spot cloudiness early and keep water clarity under control.',
      lessonsCount: 5,
      durationMin: 25,
    },
  };

  return learningSections.map((section) => ({
    id: section.id,
    title: section.title,
    icon: section.icon,
    sensorImage: section.sensorImage,
    summary: section.summary,
    subsectionCount: section.subsections.length,
    level: previewMeta[section.id]?.level || 'Core',
    description: previewMeta[section.id]?.description || section.summary,
    lessonsCount: previewMeta[section.id]?.lessonsCount || section.subsections.length,
    durationMin: previewMeta[section.id]?.durationMin || section.subsections.length * 5,
  }));
};

// Get full learning section details
export const getLearningSection = async (
  sectionId: string
): Promise<LearningSection | null> => {
  // Try backend for section details first, short-circuit if forbidden
  if (!learningForbidden) {
    try {
      const resp = await fetch(`${API_BASE_URL}/learning/${encodeURIComponent(sectionId)}`, { method: 'GET' });
      if (resp) {
        if (resp.status === 403) {
          learningForbidden = true;
        } else if (resp.ok) {
          const json = await resp.json();
          return json as LearningSection;
        }
      }
    } catch (e) {
      // network error — fallback to local below
    }
  }
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

export const getLessons = async (pathId?: string): Promise<any[]> => {
  // Try backend lessons endpoint first unless we've seen a 403; fall back to local lesson plans
  if (!learningForbidden) {
    try {
      const url = pathId ? `${API_BASE_URL}/learning/lessons?section=${encodeURIComponent(pathId)}` : `${API_BASE_URL}/learning/lessons`;
      const resp = await fetch(url, { method: 'GET' });
      if (resp) {
        if (resp.status === 403) {
          learningForbidden = true;
        } else if (resp.ok) {
          const json = await resp.json();
          if (Array.isArray(json)) return json;
        }
      }
    } catch (e) {
      // network failure, use local lessons
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 120));
  const lessons = pathId
    ? lessonPlans.filter((lesson) => lesson.sectionId === pathId)
    : lessonPlans;

  return lessons.map((lesson) => ({
    id: lesson.id,
    topic: lesson.topic,
    title: lesson.title,
    summary: lesson.summary,
    durationMin: lesson.durationMin,
    difficulty: lesson.difficulty,
    image: lesson.images[0]?.src || placeholderImage,
  }));
};

export const getLesson = async (lessonId: string): Promise<any> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return lessonPlans.find((lesson) => lesson.id === lessonId) || null;
};

export const completeLesson = async (lessonId: string): Promise<LearningProgress> => {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return getLearningProgress();
};

export const getRecommendedLessons = async (): Promise<any[]> => {
  return [];
};
