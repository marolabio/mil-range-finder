export const HISTORY_LIMIT = 5;
export const GUIDE_MODE_STORAGE_KEY = "mil-guide-helper-mode";
export const HISTORY_STORAGE_KEY = "mil-range-history";
export const LAST_PRESET_STORAGE_KEY = "mil-last-preset";
export const LAST_TARGET_SIZE_STORAGE_KEY = "mil-last-target-size";
export const LAST_ANGULAR_READING_STORAGE_KEY = "mil-last-angular-reading";
export const LAST_STEP_COUNT_STORAGE_KEY = "mil-last-step-count";
export const STEP_CALIBRATION_STORAGE_KEY = "mil-step-calibration";
export const MOA_DISTANCE_FACTOR_STORAGE_KEY = "mil-moa-distance-factor";
export const DEFAULT_PRESET_LABEL = "4 cm target";
export const DEFAULT_SIZE_INPUT = "4";
export const DEFAULT_ANGULAR_UNIT = "moa";
export const MOA_DISTANCE_FACTOR = 8;
export const DEFAULT_STEP_COUNT_INPUT = "";
export const DEFAULT_CALIBRATION_STEPS_INPUT = "8";
export const DEFAULT_CALIBRATION_METERS_INPUT = "5";
export const DEFAULT_CALIBRATION_DISTANCE_UNIT = "m";
export const DEFAULT_DRAW_LENGTH_INPUT = "65";
export const DEFAULT_DRAW_LENGTH_UNIT = "cm";
export const DEFAULT_BAND_PROFILE_ID = "flat-20-12-045";

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
  angularUnit: AngularUnit;
  label: string;
  savedName?: string;
  targetSizeCm: number;
  milReading: number;
  resultMeters: number;
  createdAt: string;
};

export type AngularUnit = "mil" | "moa";

export type HelperMode = "1.0" | "0.5" | "0.2";

export type HomePageInputs = {
  angularUnit: AngularUnit;
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

export type DrawLengthUnit = "cm" | "in";

export type BandProfile = {
  id: string;
  label: string;
  bandSize: string;
  latexThicknessMm: number;
  taper: string;
  stretchRatio: number;
  recommendedAmmo: string;
  backupAmmo: string;
  feel: string;
  note: string;
};

export type SlingshotSetupInputs = {
  drawLengthInput: string;
  drawLengthUnit: DrawLengthUnit;
  selectedBandProfileId: string;
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
      { label: "4 cm at 2.7 mil", result: "15 m" },
      { label: "4 cm at 2 mil", result: "20 m" },
      { label: "4 cm at 1.6 mil", result: "25 m" },
      { label: "4 cm at 1.3 mil", result: "30 m" },
      { label: "4 cm at 1.1 mil", result: "35 m" },
      { label: "4 cm at 1 mil", result: "40 m" },
      { label: "4 cm at 0.9 mil", result: "45 m" },
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
      { label: "6 cm at 1.7 mil", result: "35 m" },
      { label: "6 cm at 1.5 mil", result: "40 m" },
      { label: "6 cm at 1.3 mil", result: "45 m" },
      { label: "6 cm at 1.2 mil", result: "50 m" },
    ],
  },
  {
    id: "size-8",
    label: "8 cm",
    rows: [
      { label: "8 cm at 8 mil", result: "10 m" },
      { label: "8 cm at 5.3 mil", result: "15 m" },
      { label: "8 cm at 4 mil", result: "20 m" },
      { label: "8 cm at 3.2 mil", result: "25 m" },
      { label: "8 cm at 2.7 mil", result: "30 m" },
      { label: "8 cm at 2.3 mil", result: "35 m" },
      { label: "8 cm at 2 mil", result: "40 m" },
      { label: "8 cm at 1.8 mil", result: "45 m" },
      { label: "8 cm at 1.6 mil", result: "50 m" },
    ],
  },
  {
    id: "size-10",
    label: "10 cm",
    rows: [
      { label: "10 cm at 10 mil", result: "10 m" },
      { label: "10 cm at 6.7 mil", result: "15 m" },
      { label: "10 cm at 5 mil", result: "20 m" },
      { label: "10 cm at 4 mil", result: "25 m" },
      { label: "10 cm at 3.3 mil", result: "30 m" },
      { label: "10 cm at 2.9 mil", result: "35 m" },
      { label: "10 cm at 2.5 mil", result: "40 m" },
      { label: "10 cm at 2.2 mil", result: "45 m" },
      { label: "10 cm at 2 mil", result: "50 m" },
    ],
  },
  {
    id: "size-20",
    label: "20 cm",
    rows: [
      { label: "20 cm at 10 mil", result: "20 m" },
      { label: "20 cm at 8 mil", result: "25 m" },
      { label: "20 cm at 6.7 mil", result: "30 m" },
      { label: "20 cm at 5.7 mil", result: "35 m" },
      { label: "20 cm at 5 mil", result: "40 m" },
      { label: "20 cm at 4.4 mil", result: "45 m" },
      { label: "20 cm at 4 mil", result: "50 m" },
    ],
  },
  {
    id: "size-30",
    label: "30 cm",
    rows: [
      { label: "30 cm at 10 mil", result: "30 m" },
      { label: "30 cm at 8.6 mil", result: "35 m" },
      { label: "30 cm at 7.5 mil", result: "40 m" },
      { label: "30 cm at 6.7 mil", result: "45 m" },
      { label: "30 cm at 6 mil", result: "50 m" },
    ],
  },
];

export function getMoaQuickReferenceTabs(
  moaDistanceFactor: number = MOA_DISTANCE_FACTOR,
): QuickReferenceTab[] {
  return [
  {
    id: "size-4",
    label: "4 cm",
    rows: [
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 10)} MOA`, result: "10 m" },
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 15)} MOA`, result: "15 m" },
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 20)} MOA`, result: "20 m" },
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 25)} MOA`, result: "25 m" },
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 30)} MOA`, result: "30 m" },
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 35)} MOA`, result: "35 m" },
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 40)} MOA`, result: "40 m" },
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 45)} MOA`, result: "45 m" },
      { label: `4 cm at ${formatAngularReading((4 * moaDistanceFactor) / 50)} MOA`, result: "50 m" },
    ],
  },
  {
    id: "size-6",
    label: "6 cm",
    rows: [
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 10)} MOA`, result: "10 m" },
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 15)} MOA`, result: "15 m" },
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 20)} MOA`, result: "20 m" },
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 25)} MOA`, result: "25 m" },
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 30)} MOA`, result: "30 m" },
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 35)} MOA`, result: "35 m" },
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 40)} MOA`, result: "40 m" },
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 45)} MOA`, result: "45 m" },
      { label: `6 cm at ${formatAngularReading((6 * moaDistanceFactor) / 50)} MOA`, result: "50 m" },
    ],
  },
  {
    id: "size-8",
    label: "8 cm",
    rows: [
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 10)} MOA`, result: "10 m" },
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 15)} MOA`, result: "15 m" },
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 20)} MOA`, result: "20 m" },
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 25)} MOA`, result: "25 m" },
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 30)} MOA`, result: "30 m" },
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 35)} MOA`, result: "35 m" },
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 40)} MOA`, result: "40 m" },
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 45)} MOA`, result: "45 m" },
      { label: `8 cm at ${formatAngularReading((8 * moaDistanceFactor) / 50)} MOA`, result: "50 m" },
    ],
  },
  {
    id: "size-10",
    label: "10 cm",
    rows: [
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 10)} MOA`, result: "10 m" },
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 15)} MOA`, result: "15 m" },
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 20)} MOA`, result: "20 m" },
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 25)} MOA`, result: "25 m" },
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 30)} MOA`, result: "30 m" },
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 35)} MOA`, result: "35 m" },
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 40)} MOA`, result: "40 m" },
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 45)} MOA`, result: "45 m" },
      { label: `10 cm at ${formatAngularReading((10 * moaDistanceFactor) / 50)} MOA`, result: "50 m" },
    ],
  },
  {
    id: "size-20",
    label: "20 cm",
    rows: [
      { label: `20 cm at ${formatAngularReading((20 * moaDistanceFactor) / 20)} MOA`, result: "20 m" },
      { label: `20 cm at ${formatAngularReading((20 * moaDistanceFactor) / 25)} MOA`, result: "25 m" },
      { label: `20 cm at ${formatAngularReading((20 * moaDistanceFactor) / 30)} MOA`, result: "30 m" },
      { label: `20 cm at ${formatAngularReading((20 * moaDistanceFactor) / 35)} MOA`, result: "35 m" },
      { label: `20 cm at ${formatAngularReading((20 * moaDistanceFactor) / 40)} MOA`, result: "40 m" },
      { label: `20 cm at ${formatAngularReading((20 * moaDistanceFactor) / 45)} MOA`, result: "45 m" },
      { label: `20 cm at ${formatAngularReading((20 * moaDistanceFactor) / 50)} MOA`, result: "50 m" },
    ],
  },
  {
    id: "size-30",
    label: "30 cm",
    rows: [
      { label: `30 cm at ${formatAngularReading((30 * moaDistanceFactor) / 30)} MOA`, result: "30 m" },
      { label: `30 cm at ${formatAngularReading((30 * moaDistanceFactor) / 35)} MOA`, result: "35 m" },
      { label: `30 cm at ${formatAngularReading((30 * moaDistanceFactor) / 40)} MOA`, result: "40 m" },
      { label: `30 cm at ${formatAngularReading((30 * moaDistanceFactor) / 45)} MOA`, result: "45 m" },
      { label: `30 cm at ${formatAngularReading((30 * moaDistanceFactor) / 50)} MOA`, result: "50 m" },
    ],
  },
  ];
}

export const bandProfiles: BandProfile[] = [
  {
    id: "flat-18-12-040",
    label: "Light Target",
    bandSize: "18-12 mm",
    latexThicknessMm: 0.4,
    taper: "18 mm to 12 mm",
    stretchRatio: 5.5,
    recommendedAmmo: "7 mm steel or 8 mm clay",
    backupAmmo: "6.35 mm steel",
    feel: "Fast draw, light recoil",
    note: "Good starting point for short sessions and lighter ammo.",
  },
  {
    id: "flat-20-12-045",
    label: "Balanced Setup",
    bandSize: "20-12 mm",
    latexThicknessMm: 0.45,
    taper: "20 mm to 12 mm",
    stretchRatio: 5.3,
    recommendedAmmo: "8 mm steel",
    backupAmmo: "9 mm clay",
    feel: "Balanced speed and control",
    note: "A versatile setup for general target use.",
  },
  {
    id: "flat-22-12-050",
    label: "Medium Power",
    bandSize: "22-12 mm",
    latexThicknessMm: 0.5,
    taper: "22 mm to 12 mm",
    stretchRatio: 5,
    recommendedAmmo: "8.5 to 9 mm steel",
    backupAmmo: "10 mm clay",
    feel: "More punch with moderate snap",
    note: "Useful when you want more carry without going overly heavy.",
  },
  {
    id: "flat-22-12-060",
    label: "Heavy Hunting",
    bandSize: "22-12 mm",
    latexThicknessMm: 0.6,
    taper: "22 mm to 12 mm",
    stretchRatio: 4.7,
    recommendedAmmo: "9.5 to 10 mm steel",
    backupAmmo: "11 mm clay",
    feel: "Heavy pull, solid impact",
    note: "Best with a strong draw and a slower, steadier release.",
  },
  {
    id: "flat-25-15-070",
    label: "Max Power",
    bandSize: "25-15 mm",
    latexThicknessMm: 0.7,
    taper: "25 mm to 15 mm",
    stretchRatio: 4.4,
    recommendedAmmo: "10 to 11 mm steel",
    backupAmmo: "12 mm clay",
    feel: "Strong pull, high energy",
    note: "Only makes sense if your form and fork can handle a heavy setup.",
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
  const unitValue = searchParams.unit;
  const selectedPreset =
    (Array.isArray(labelValue) ? labelValue[0] : labelValue) ?? DEFAULT_PRESET_LABEL;
  const presetSize = presetByLabel.get(selectedPreset);
  const milInput = Array.isArray(milValue) ? milValue[0] ?? "" : milValue ?? "";
  const sizeInput =
    (Array.isArray(sizeValue) ? sizeValue[0] : sizeValue) ??
    presetSize?.toString() ??
    DEFAULT_SIZE_INPUT;
  const angularUnitValue = Array.isArray(unitValue) ? unitValue[0] : unitValue;
  const angularUnit =
    angularUnitValue === "mil" || angularUnitValue === "moa"
      ? angularUnitValue
      : DEFAULT_ANGULAR_UNIT;

  return {
    angularUnit,
    milInput,
    selectedPreset,
    sizeInput,
  };
}

export function calculateDistanceMeters(
  sizeCm: number,
  angularReading: number,
  angularUnit: AngularUnit = DEFAULT_ANGULAR_UNIT,
  moaDistanceFactor: number = MOA_DISTANCE_FACTOR,
) {
  if (
    !Number.isFinite(sizeCm) ||
    !Number.isFinite(angularReading) ||
    sizeCm <= 0 ||
    angularReading <= 0
  ) {
    return null;
  }

  const distance =
    angularUnit === "moa"
      ? (sizeCm * moaDistanceFactor) / angularReading
      : (sizeCm * 10) / angularReading;

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

export function getDefaultSlingshotSetupInputs(): SlingshotSetupInputs {
  return {
    drawLengthInput: DEFAULT_DRAW_LENGTH_INPUT,
    drawLengthUnit: DEFAULT_DRAW_LENGTH_UNIT,
    selectedBandProfileId: DEFAULT_BAND_PROFILE_ID,
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

export function convertLengthToCentimeters(value: number, unit: DrawLengthUnit) {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (unit === "in") {
    return value * 2.54;
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

export function calculateActiveBandLengthCm(drawLengthCm: number, stretchRatio: number) {
  if (
    !Number.isFinite(drawLengthCm) ||
    !Number.isFinite(stretchRatio) ||
    drawLengthCm <= 0 ||
    stretchRatio <= 0
  ) {
    return null;
  }

  const activeLength = drawLengthCm / stretchRatio;
  return Number.isFinite(activeLength) ? activeLength : null;
}

export function formatInchesFromCentimeters(value: number) {
  return `${(value / 2.54).toFixed(1)} in`;
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

export function readStoredMoaDistanceFactor() {
  const storedValue = readStoredJson<number | string | null>(MOA_DISTANCE_FACTOR_STORAGE_KEY, null);
  const parsed =
    typeof storedValue === "number"
      ? storedValue
      : typeof storedValue === "string"
        ? Number(storedValue)
        : null;

  if (!parsed || !Number.isFinite(parsed) || parsed <= 0) {
    return MOA_DISTANCE_FACTOR;
  }

  return parsed;
}

export function readStoredMoaDistanceFactorInput() {
  const storedValue = readStoredJson<number | string | null>(MOA_DISTANCE_FACTOR_STORAGE_KEY, null);

  if (typeof storedValue === "string") {
    return storedValue;
  }

  if (typeof storedValue === "number" && Number.isFinite(storedValue) && storedValue > 0) {
    return storedValue.toString();
  }

  return MOA_DISTANCE_FACTOR.toString();
}

function formatAngularReading(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}
