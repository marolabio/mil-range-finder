export const HISTORY_LIMIT = 5;
export const GUIDE_MODE_STORAGE_KEY = "mil-guide-helper-mode";
export const HISTORY_STORAGE_KEY = "mil-range-history";
export const LAST_PRESET_STORAGE_KEY = "mil-last-preset";

export type Preset = {
  label: string;
  sizeCm: number;
};

export type PresetGroup = {
  id: string;
  title: string;
  presets: Preset[];
};

export type HistoryItem = {
  label: string;
  targetSizeCm: number;
  milReading: number;
  resultMeters: number;
  createdAt: string;
};

export type HelperMode = "1.0" | "0.5" | "0.2";

export const presetGroups: PresetGroup[] = [
  {
    id: "birds",
    title: "Bird Body Size",
    presets: [
      { label: "Zebra Dove", sizeCm: 21 },
      { label: "Spotted Dove", sizeCm: 30 },
      { label: "Quail", sizeCm: 18 },
      { label: "Crow", sizeCm: 40 },
      { label: "Chicken", sizeCm: 35 },
      { label: "Small Dove", sizeCm: 20 },
      { label: "Medium Dove", sizeCm: 25 },
      { label: "Large Dove", sizeCm: 30 },
    ],
  },
  {
    id: "targets",
    title: "Target Practice",
    presets: [
      { label: "5 cm target", sizeCm: 5 },
      { label: "10 cm target", sizeCm: 10 },
      { label: "20 cm target", sizeCm: 20 },
      { label: "25 cm target", sizeCm: 25 },
      { label: "30 cm target", sizeCm: 30 },
      { label: "35 cm target", sizeCm: 35 },
      { label: "40 cm target", sizeCm: 40 },
    ],
  },
];

export const guideExamples = [
  { label: "5 cm head", sizeCm: 5, mil: 2, resultMeters: 25 },
  { label: "6 cm head", sizeCm: 6, mil: 1, resultMeters: 60 },
  { label: "10 cm target", sizeCm: 10, mil: 2, resultMeters: 50 },
  { label: "20 cm target", sizeCm: 20, mil: 4, resultMeters: 50 },
  { label: "30 cm bird", sizeCm: 30, mil: 3, resultMeters: 100 },
];

export const quickReferenceRows = [
  { label: "5 cm at 1 mil", result: "50 m" },
  { label: "5 cm at 2 mil", result: "25 m" },
  { label: "6 cm at 1 mil", result: "60 m" },
  { label: "10 cm at 1 mil", result: "100 m" },
  { label: "10 cm at 2 mil", result: "50 m" },
  { label: "20 cm at 4 mil", result: "50 m" },
];

export function calculateDistanceMeters(sizeCm: number, milReading: number) {
  if (!Number.isFinite(sizeCm) || !Number.isFinite(milReading) || sizeCm <= 0 || milReading <= 0) {
    return null;
  }

  const distance = (sizeCm * 10) / milReading;
  return Number.isFinite(distance) ? distance : null;
}

export function parsePositiveNumber(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function formatMeters(value: number, digits = 1) {
  return `${value.toFixed(digits)} m`;
}

export function formatExactMeters(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)} m`;
}

export function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
