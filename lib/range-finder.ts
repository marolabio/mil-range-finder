export const HISTORY_LIMIT = 5;
export const GUIDE_MODE_STORAGE_KEY = "mil-guide-helper-mode";
export const HISTORY_STORAGE_KEY = "mil-range-history";
export const LAST_PRESET_STORAGE_KEY = "mil-last-preset";
export const STEP_CALIBRATION_STORAGE_KEY = "mil-step-calibration";
export const DEFAULT_PRESET_LABEL = "4 cm target";
export const DEFAULT_SIZE_INPUT = "4";
export const DEFAULT_STEP_COUNT_INPUT = "";
export const DEFAULT_CALIBRATION_STEPS_INPUT = "8";
export const DEFAULT_CALIBRATION_METERS_INPUT = "5";
export const DEFAULT_CALIBRATION_DISTANCE_UNIT = "m";

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
  savedName?: string;
  targetSizeCm: number;
  milReading: number;
  resultMeters: number;
  createdAt: string;
};

export type HelperMode = "1.0" | "0.5" | "0.2";

export type HomePageInputs = {
  milInput: string;
  selectedPreset: string;
  sizeInput: string;
};

export type StepRangeInputs = {
  stepsInput: string;
  calibrationStepsInput: string;
  calibrationMetersInput: string;
  calibrationDistanceUnit: "m" | "cm" | "in";
};

export type QuickReferenceTab = {
  id: string;
  label: string;
  rows: Array<{
    label: string;
    result: string;
  }>;
};

export const presetGroups: PresetGroup[] = [
  {
    id: "birds",
    title: "Bird Body Size",
    presets: [
      { label: "Small Bird", sizeCm: 15 },
      { label: "Medium Bird", sizeCm: 20 },
      { label: "Large Bird", sizeCm: 30 },
      { label: "Chicken", sizeCm: 35 },
      { label: "Crow", sizeCm: 40 },
    ],
  },
  {
    id: "targets",
    title: "Target Practice",
    presets: [
      { label: "2 cm target", sizeCm: 2 },
      { label: "4 cm target", sizeCm: 4 },
      { label: "6 cm target", sizeCm: 6 },
      { label: "8 cm target", sizeCm: 8 },
      { label: "10 cm target", sizeCm: 10 },
      { label: "12 cm target", sizeCm: 12 },
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

export const quickReferenceTabs: QuickReferenceTab[] = [
  {
    id: "size-4",
    label: "4 cm",
    rows: [
      { label: "4 cm at 4 mil", result: "10 m" },
      { label: "4 cm at 2.67 mil", result: "15 m" },
      { label: "4 cm at 2 mil", result: "20 m" },
      { label: "4 cm at 1.6 mil", result: "25 m" },
      { label: "4 cm at 1.33 mil", result: "30 m" },
      { label: "4 cm at 1.14 mil", result: "35 m" },
      { label: "4 cm at 1 mil", result: "40 m" },
      { label: "4 cm at 0.89 mil", result: "45 m" },
      { label: "4 cm at 0.8 mil", result: "50 m" },
    ],
  },
  {
    id: "size-6",
    label: "6 cm",
    rows: [
      { label: "6 cm at 6 mil", result: "10 m" },
      { label: "6 cm at 4 mil", result: "15 m" },
      { label: "6 cm at 3 mil", result: "20 m" },
      { label: "6 cm at 2.4 mil", result: "25 m" },
      { label: "6 cm at 2 mil", result: "30 m" },
      { label: "6 cm at 1.71 mil", result: "35 m" },
      { label: "6 cm at 1.5 mil", result: "40 m" },
      { label: "6 cm at 1.33 mil", result: "45 m" },
      { label: "6 cm at 1.2 mil", result: "50 m" },
    ],
  },
  {
    id: "size-8",
    label: "8 cm",
    rows: [
      { label: "8 cm at 8 mil", result: "10 m" },
      { label: "8 cm at 5.33 mil", result: "15 m" },
      { label: "8 cm at 4 mil", result: "20 m" },
      { label: "8 cm at 3.2 mil", result: "25 m" },
      { label: "8 cm at 2.67 mil", result: "30 m" },
      { label: "8 cm at 2.29 mil", result: "35 m" },
      { label: "8 cm at 2 mil", result: "40 m" },
      { label: "8 cm at 1.78 mil", result: "45 m" },
      { label: "8 cm at 1.6 mil", result: "50 m" },
    ],
  },
  {
    id: "size-10",
    label: "10 cm",
    rows: [
      { label: "10 cm at 10 mil", result: "10 m" },
      { label: "10 cm at 6.67 mil", result: "15 m" },
      { label: "10 cm at 5 mil", result: "20 m" },
      { label: "10 cm at 4 mil", result: "25 m" },
      { label: "10 cm at 3.33 mil", result: "30 m" },
      { label: "10 cm at 2.86 mil", result: "35 m" },
      { label: "10 cm at 2.5 mil", result: "40 m" },
      { label: "10 cm at 2.22 mil", result: "45 m" },
      { label: "10 cm at 2 mil", result: "50 m" },
    ],
  },
  {
    id: "size-20",
    label: "20 cm",
    rows: [
      { label: "20 cm at 10 mil", result: "20 m" },
      { label: "20 cm at 8 mil", result: "25 m" },
      { label: "20 cm at 6.67 mil", result: "30 m" },
      { label: "20 cm at 5.71 mil", result: "35 m" },
      { label: "20 cm at 5 mil", result: "40 m" },
      { label: "20 cm at 4.44 mil", result: "45 m" },
      { label: "20 cm at 4 mil", result: "50 m" },
    ],
  },
  {
    id: "size-30",
    label: "30 cm",
    rows: [
      { label: "30 cm at 10 mil", result: "30 m" },
      { label: "30 cm at 8.57 mil", result: "35 m" },
      { label: "30 cm at 7.5 mil", result: "40 m" },
      { label: "30 cm at 6.67 mil", result: "45 m" },
      { label: "30 cm at 6 mil", result: "50 m" },
    ],
  },
];

const presetByLabel = new Map(
  presetGroups.flatMap((group) =>
    group.presets.map((preset) => [preset.label, preset.sizeCm] as const),
  ),
);

export function getHomePageInputs(
  searchParams: Record<string, string | string[] | undefined>,
): HomePageInputs {
  const labelValue = searchParams.label;
  const milValue = searchParams.mil;
  const sizeValue = searchParams.size;
  const selectedPreset =
    (Array.isArray(labelValue) ? labelValue[0] : labelValue) ?? DEFAULT_PRESET_LABEL;
  const presetSize = presetByLabel.get(selectedPreset);
  const milInput = Array.isArray(milValue) ? milValue[0] ?? "" : milValue ?? "";
  const sizeInput =
    (Array.isArray(sizeValue) ? sizeValue[0] : sizeValue) ??
    presetSize?.toString() ??
    DEFAULT_SIZE_INPUT;

  return {
    milInput,
    selectedPreset,
    sizeInput,
  };
}

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

export function getDefaultStepRangeInputs(): StepRangeInputs {
  return {
    stepsInput: DEFAULT_STEP_COUNT_INPUT,
    calibrationStepsInput: DEFAULT_CALIBRATION_STEPS_INPUT,
    calibrationMetersInput: DEFAULT_CALIBRATION_METERS_INPUT,
    calibrationDistanceUnit: DEFAULT_CALIBRATION_DISTANCE_UNIT,
  };
}

export function convertDistanceToMeters(value: number, unit: "m" | "cm" | "in") {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (unit === "cm") {
    return value / 100;
  }

  if (unit === "in") {
    return value * 0.0254;
  }

  return value;
}

export function calculateDistanceFromSteps(
  stepCount: number,
  calibrationSteps: number,
  calibrationMeters: number,
) {
  if (
    !Number.isFinite(stepCount) ||
    !Number.isFinite(calibrationSteps) ||
    !Number.isFinite(calibrationMeters) ||
    stepCount <= 0 ||
    calibrationSteps <= 0 ||
    calibrationMeters <= 0
  ) {
    return null;
  }

  const distance = (stepCount / calibrationSteps) * calibrationMeters;
  return Number.isFinite(distance) ? distance : null;
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
