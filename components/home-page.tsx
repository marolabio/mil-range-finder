"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Card } from "@/components/card";
import {
  calculateDistanceMeters,
  convertDistanceToMeters,
  DEFAULT_ANGULAR_UNIT,
  getDefaultStepRangeInputs,
  type AngularUnit,
  type HomePageInputs,
  formatMeters,
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  LAST_ANGULAR_READING_STORAGE_KEY,
  LAST_PRESET_STORAGE_KEY,
  LAST_TARGET_SIZE_STORAGE_KEY,
  MOA_DISTANCE_FACTOR,
  MOA_DISTANCE_FACTOR_STORAGE_KEY,
  parsePositiveNumber,
  presetGroups,
  readStoredJson,
  readStoredMoaDistanceFactorInput,
  STEP_CALIBRATION_STORAGE_KEY,
  type HistoryItem,
  type StepRangeInputs,
} from "@/lib/range-finder";

type FieldErrors = {
  angularReading?: string;
  size?: string;
};

type HomePageProps = {
  initialInputs: HomePageInputs;
};

type StepCalibrationInputs = Pick<
  StepRangeInputs,
  "calibrationDistanceUnit" | "calibrationMetersInput" | "calibrationStepsInput"
>;

const presetByLabel = new Map(
  presetGroups.flatMap((group) =>
    group.presets.map((preset) => [preset.label, preset.sizeCm] as const),
  ),
);

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
  };
}

function readStoredHistoryRaw() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]";
}

function readStoredStepCalibration(): StepCalibrationInputs {
  const defaults = getDefaultStepRangeInputs();
  return readStoredJson<StepCalibrationInputs | null>(STEP_CALIBRATION_STORAGE_KEY, null) ?? {
    calibrationStepsInput: defaults.calibrationStepsInput,
    calibrationMetersInput: defaults.calibrationMetersInput,
    calibrationDistanceUnit: defaults.calibrationDistanceUnit,
  };
}

function formatStepCount(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value))} steps`;
}

function formatReticleValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

function ReticleReadingPreview({
  reading,
  unit,
}: {
  reading: number | null;
  unit: AngularUnit;
}) {
  const validReading = reading !== null && Number.isFinite(reading) && reading > 0 ? reading : null;
  const baseMax = unit === "moa" ? 50 : 10;
  const majorStepValue = unit === "moa" ? 10 : 1;
  const scaleMax =
    validReading !== null && validReading > baseMax
      ? Math.ceil(validReading / majorStepValue) * majorStepValue
      : baseMax;
  const width = 640;
  const height = 150;
  const padding = 28;
  const scaleWidth = width - padding * 2;
  const markerX =
    validReading !== null ? padding + (validReading / scaleMax) * scaleWidth : padding;
  const majorCount = Math.max(1, Math.round(scaleMax / majorStepValue));
  const unitLabel = unit.toUpperCase();

  return (
    <div className="rounded-[1.25rem] border border-white/8 bg-black/24 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-white/55">Reticle preview</p>
        <p className="mono text-xs text-accent">
          {validReading !== null ? `${formatReticleValue(validReading)} ${unitLabel}` : `-- ${unitLabel}`}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${unitLabel} reticle reading preview`}
      >
        <line
          x1={padding}
          y1={62}
          x2={width - padding}
          y2={62}
          stroke="rgba(240,245,234,0.88)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {Array.from({ length: majorCount + 1 }, (_, index) => {
          const x = padding + (index / majorCount) * scaleWidth;
          const label = index * majorStepValue;

          return (
            <g key={`major-${label}`}>
              <line
                x1={x}
                y1={30}
                x2={x}
                y2={98}
                stroke="rgba(159,194,103,0.95)"
                strokeWidth="2.6"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={x}
                y={128}
                fill="rgba(236,241,230,0.82)"
                fontSize="16"
                fontFamily="IBM Plex Mono, monospace"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
        {Array.from({ length: majorCount }, (_, index) => {
          const x = padding + ((index + 0.5) / majorCount) * scaleWidth;

          return (
            <line
              key={`half-${index}`}
              x1={x}
              y1={42}
              x2={x}
              y2={86}
              stroke="rgba(240,245,234,0.55)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {validReading !== null ? (
          <g>
            <line
              x1={markerX}
              y1={16}
              x2={markerX}
              y2={110}
              stroke="rgba(251,191,36,1)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M ${markerX - 8} 16 L ${markerX + 8} 16 L ${markerX} 28 Z`}
              fill="rgba(251,191,36,1)"
            />
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function normalizeHistoryItem(item: HistoryItem): HistoryItem {
  return {
    ...item,
    angularUnit: item.angularUnit ?? DEFAULT_ANGULAR_UNIT,
  };
}

function createErrors(angularReadingValue: string, sizeValue: string, angularUnit: AngularUnit): FieldErrors {
  const angularReadingNumber = Number(angularReadingValue);
  const sizeNumber = Number(sizeValue);
  const errors: FieldErrors = {};

  if (angularReadingValue.trim() === "") {
    errors.angularReading = `Enter a ${angularUnit.toUpperCase()} reading greater than 0.`;
  } else if (!Number.isFinite(angularReadingNumber) || angularReadingNumber <= 0) {
    errors.angularReading = `${angularUnit.toUpperCase()} reading must be a valid number above 0.`;
  }

  if (sizeValue.trim() === "") {
    errors.size = "Enter a target size greater than 0 cm.";
  } else if (!Number.isFinite(sizeNumber) || sizeNumber <= 0) {
    errors.size = "Target size must be a valid number above 0 cm.";
  }

  return errors;
}

export function HomePage({ initialInputs }: HomePageProps) {
  const [angularUnit, setAngularUnit] = useState<AngularUnit>(initialInputs.angularUnit);
  const [milInput, setMilInput] = useState(() =>
    readStoredJson<string | null>(LAST_ANGULAR_READING_STORAGE_KEY, null) ?? initialInputs.milInput,
  );
  const [sizeInput, setSizeInput] = useState(() =>
    readStoredJson<string | null>(LAST_TARGET_SIZE_STORAGE_KEY, null) ?? initialInputs.sizeInput,
  );
  const [selectedPreset, setSelectedPreset] = useState(() =>
    readStoredJson<string | null>(LAST_PRESET_STORAGE_KEY, null) ?? initialInputs.selectedPreset,
  );
  const storedHistoryRaw = useSyncExternalStore(subscribeToStorage, readStoredHistoryRaw, () => "[]");
  const [historyOverride, setHistoryOverride] = useState<HistoryItem[] | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isMoaSettingsModalOpen, setIsMoaSettingsModalOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<HistoryItem | null>(null);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [saveNameError, setSaveNameError] = useState("");
  const [lastSavedKey, setLastSavedKey] = useState("");
  const [moaDistanceFactorInput, setMoaDistanceFactorInput] = useState(() =>
    readStoredMoaDistanceFactorInput(),
  );
  const [stepCalibration] = useState(readStoredStepCalibration);
  const storedHistory = useMemo(() => {
    try {
      const parsed = JSON.parse(storedHistoryRaw) as HistoryItem[];
      return Array.isArray(parsed)
        ? parsed.map(normalizeHistoryItem).slice(0, HISTORY_LIMIT)
        : [];
    } catch {
      return [];
    }
  }, [storedHistoryRaw]);
  const history = historyOverride ?? storedHistory;

  const errors = useMemo(
    () => createErrors(milInput, sizeInput, angularUnit),
    [angularUnit, milInput, sizeInput],
  );
  const milNumber = parsePositiveNumber(milInput);
  const sizeNumber = parsePositiveNumber(sizeInput);
  const moaDistanceFactor = parsePositiveNumber(moaDistanceFactorInput) ?? MOA_DISTANCE_FACTOR;
  const distance =
    milNumber && sizeNumber
      ? calculateDistanceMeters(sizeNumber, milNumber, angularUnit, moaDistanceFactor)
      : null;
  const calibrationSteps = parsePositiveNumber(stepCalibration.calibrationStepsInput);
  const calibrationDistanceValue = parsePositiveNumber(stepCalibration.calibrationMetersInput);
  const calibrationMeters =
    calibrationDistanceValue !== null
      ? convertDistanceToMeters(calibrationDistanceValue, stepCalibration.calibrationDistanceUnit)
      : null;
  const estimatedSteps =
    distance !== null && calibrationMeters !== null && calibrationSteps !== null
      ? (distance / calibrationMeters) * calibrationSteps
      : null;
  const hasValidResult = distance !== null && Object.keys(errors).length === 0;
  const angularUnitLabel = angularUnit.toUpperCase();
  const rangeTitle = `${angularUnitLabel} Range`;
  const guideHref = angularUnit === "moa" ? "/moa-guide" : "/guide";
  const guideLabel = `Open ${angularUnitLabel} guide`;
  useEffect(() => {
    if (!isPresetModalOpen && !isSaveModalOpen && !isMoaSettingsModalOpen && !pendingDeleteItem) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPresetModalOpen(false);
        setIsSaveModalOpen(false);
        setIsMoaSettingsModalOpen(false);
        setPendingDeleteItem(null);
        setSaveNameError("");
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isPresetModalOpen, isSaveModalOpen, isMoaSettingsModalOpen, pendingDeleteItem]);

  useEffect(() => {
    const storedHistory = readStoredJson<HistoryItem[]>(HISTORY_STORAGE_KEY, []).map(
      normalizeHistoryItem,
    );
    if (storedHistory.length > HISTORY_LIMIT) {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(storedHistory.slice(0, HISTORY_LIMIT)),
      );
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      MOA_DISTANCE_FACTOR_STORAGE_KEY,
      JSON.stringify(moaDistanceFactorInput),
    );
  }, [moaDistanceFactorInput]);

  useEffect(() => {
    window.localStorage.setItem(LAST_TARGET_SIZE_STORAGE_KEY, JSON.stringify(sizeInput));
  }, [sizeInput]);

  useEffect(() => {
    window.localStorage.setItem(LAST_ANGULAR_READING_STORAGE_KEY, JSON.stringify(milInput));
  }, [milInput]);

  useEffect(() => {
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify(selectedPreset));
  }, [selectedPreset]);

  function openSaveModal() {
    if (!hasValidResult || milNumber === null || sizeNumber === null || distance === null) {
      return;
    }

    setSaveNameInput(selectedPreset || "Custom");
    setSaveNameError("");
    setIsSaveModalOpen(true);
  }

  function saveCurrentResult() {
    if (!hasValidResult || milNumber === null || sizeNumber === null || distance === null) {
      return;
    }

    const trimmedSaveName = saveNameInput.trim();
    if (trimmedSaveName === "") {
      setSaveNameError("Enter a name for this saved calculation.");
      return;
    }

    const saveKey = `${angularUnit}|${selectedPreset}|${trimmedSaveName}|${sizeNumber}|${milNumber}|${distance.toFixed(4)}`;
    if (saveKey === lastSavedKey) {
      setIsSaveModalOpen(false);
      return;
    }

    const isDuplicate = history.some(
      (entry) =>
        (entry.savedName ?? entry.label) === trimmedSaveName &&
        entry.angularUnit === angularUnit &&
        entry.label === (selectedPreset || "Custom") &&
        entry.targetSizeCm === sizeNumber &&
        entry.milReading === milNumber,
    );
    if (isDuplicate) {
      setSaveNameError("A saved calculation with that name and values already exists.");
      return;
    }

    const item: HistoryItem = {
      angularUnit,
      label: selectedPreset || "Custom",
      savedName: trimmedSaveName,
      targetSizeCm: sizeNumber,
      milReading: milNumber,
      resultMeters: distance,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [item, ...history].slice(0, HISTORY_LIMIT);

    setHistoryOverride(nextHistory);
    setLastSavedKey(saveKey);
    setIsSaveModalOpen(false);
    setSaveNameError("");
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  }

  function onAngularUnitChange(nextUnit: AngularUnit) {
    setAngularUnit(nextUnit);
    setLastSavedKey("");
  }

  function selectPreset(label: string, sizeCm: number) {
    setSelectedPreset(label);
    setSizeInput(sizeCm.toString());
    setIsPresetModalOpen(false);
  }

  function onTargetSizeChange(value: string) {
    setSizeInput(value);
    if (selectedPreset !== "Custom") {
      setSelectedPreset("Custom");
    }
  }

  function clearAll() {
    setMilInput("");
    setSizeInput("");
    setSelectedPreset("Custom");
    setLastSavedKey("");
    setSaveNameError("");
  }

  function resetMoaCalibration() {
    setMoaDistanceFactorInput(MOA_DISTANCE_FACTOR.toString());
  }

  function loadHistoryItem(item: HistoryItem) {
    const presetSizeFromLabel = presetByLabel.get(item.label);
    const normalizedItem = normalizeHistoryItem(item);
    const saveKey = `${normalizedItem.angularUnit}|${normalizedItem.label}|${normalizedItem.targetSizeCm}|${normalizedItem.milReading}|${normalizedItem.resultMeters.toFixed(4)}`;

    setAngularUnit(normalizedItem.angularUnit);
    setMilInput(normalizedItem.milReading.toString());
    setSizeInput((presetSizeFromLabel ?? normalizedItem.targetSizeCm).toString());
    setSelectedPreset(normalizedItem.label);
    setLastSavedKey(saveKey);
  }

  function deleteHistoryItem(itemToDelete: HistoryItem) {
    const nextHistory = history.filter(
      (item) =>
        !(
          item.createdAt === itemToDelete.createdAt &&
          item.label === itemToDelete.label &&
          item.targetSizeCm === itemToDelete.targetSizeCm &&
          item.milReading === itemToDelete.milReading
        ),
    );

    setHistoryOverride(nextHistory);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  }

  function confirmDeleteHistoryItem() {
    if (!pendingDeleteItem) {
      return;
    }

    deleteHistoryItem(pendingDeleteItem);
    setPendingDeleteItem(null);
  }

  return (
    <main className="flex-1 pt-0 pb-3 sm:pb-10">
      <div className="app-shell space-y-3 sm:space-y-4">
        <div className="space-y-3">
          <div className="ui-panel p-2" aria-label="Angular unit">
            <div className="grid grid-cols-2 gap-1.5">
              {(["moa", "mil"] as const).map((unit) => {
                const isSelected = angularUnit === unit;

                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => onAngularUnitChange(unit)}
                    className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${
                      isSelected ? "bg-accent text-[#182015]" : "ui-button-secondary"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {unit.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <Card
            title={rangeTitle}
            subtitle="Enter target size and an angular reading to estimate distance in meters."
          >
            <div className="space-y-4">
              <div className="space-y-4">
                <label className="block">
                  <div className="mb-2 space-y-2 gap-2 md:space-y-0">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 space-y-2">
                        <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                          Target Size
                        </span>
                        <span className="ui-chip">
                          cm
                        </span>
                      </div>
                      <span className="max-w-[52%] truncate text-right text-white/52 md:max-w-none md:text-left">
                        Preset: <span className="font-medium text-white/72">{selectedPreset}</span>
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs md:flex-row md:items-center md:justify-end md:gap-3">
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={sizeInput}
                        onChange={(event) => {
                          onTargetSizeChange(event.target.value);
                        }}
                        className="ui-input min-w-0 flex-1 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPresetModalOpen(true)}
                        className="ui-button ui-button-secondary inline-flex min-h-9 w-10 items-center justify-center rounded-lg px-0 py-1.5 md:min-h-0"
                        aria-label="Choose target size preset"
                        title="Choose preset"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4.5 w-4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 5h16" />
                          <path d="M4 12h16" />
                          <path d="M4 19h16" />
                          <circle cx="8" cy="5" r="1.8" fill="currentColor" stroke="none" />
                          <circle cx="14" cy="12" r="1.8" fill="currentColor" stroke="none" />
                          <circle cx="10" cy="19" r="1.8" fill="currentColor" stroke="none" />
                        </svg>
                      </button>

                    </div>
                  </div>

                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                        {angularUnitLabel} Reading
                      </span>
                      <span className="ui-chip">
                        {angularUnit}
                      </span>
                    </div>
                    {angularUnit === "moa" ? (
                      <span className="text-right text-[11px] text-white/52">
                        1 MOA = <span className="mono text-white/72">{moaDistanceFactor}</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-2 text-xs md:flex-row md:items-center md:justify-end md:gap-3">
                    <input
                      inputMode="decimal"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={milInput}
                      onChange={(event) => {
                        setMilInput(event.target.value);
                      }}
                      className="ui-input min-w-0 flex-1 text-base"
                    />
                    {angularUnit === "moa" ? (
                      <button
                        type="button"
                        onClick={() => setIsMoaSettingsModalOpen(true)}
                        className="ui-button ui-button-secondary inline-flex min-h-9 w-10 items-center justify-center rounded-lg px-0 py-1.5 md:min-h-0"
                        aria-label="Open MOA settings"
                        title="Settings"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4.5 w-4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82-.33h.01a1.65 1.65 0 0 0 .99-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 .99 1.51h.01a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51.99H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51.99Z" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  {errors.angularReading ? (
                    <p className="mt-2 text-sm text-rose-300">{errors.angularReading}</p>
                  ) : null}
                  <div className="mt-3">
                    <ReticleReadingPreview reading={milNumber} unit={angularUnit} />
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="ui-panel p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                      Estimated distance
                    </p>
                    <p
                      className={`mt-2 text-4xl font-bold tracking-tight md:text-5xl lg:text-4xl xl:text-5xl ${
                        hasValidResult && distance !== null ? "text-accent" : "text-white/35"
                      }`}
                    >
                      {hasValidResult && distance !== null ? formatMeters(distance, 1) : "0 m"}
                    </p>
                    <p
                      className={`mt-2 text-sm ${
                        hasValidResult && estimatedSteps !== null ? "text-white/72" : "text-white/35"
                      }`}
                    >
                      {hasValidResult && estimatedSteps !== null
                        ? `${formatStepCount(estimatedSteps)} to target`
                        : "-- steps to target"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:flex md:justify-end lg:justify-stretch">
                  <button
                    type="button"
                    onClick={openSaveModal}
                    disabled={!hasValidResult}
                    className={`ui-button min-h-11 rounded-lg px-3 text-sm md:min-h-0 lg:flex-1 ${hasValidResult
                      ? "bg-accent text-[#182015]"
                      : "cursor-not-allowed bg-white/[0.04] text-white/35"
                      }`}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="ui-button ui-button-secondary min-h-11 rounded-lg px-3 text-sm md:min-h-0 lg:flex-1"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Saved Calculations" className="lg:sticky lg:top-6">
            <div className="space-y-2">
              {history.length > 0 ? (
                history.map((item) => (
                  <div
                    key={`${item.createdAt}-${item.label}`}
                    className="ui-panel p-2"
                  >
                    <div className="rounded-lg px-2 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 flex-1 truncate text-base font-semibold text-white">
                          {item.savedName || item.label || "Custom"}
                        </p>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteItem(item)}
                          className="shrink-0 rounded-lg border border-white/8 bg-white/[0.035] p-2 text-white/72 transition active:bg-white/[0.06]"
                          aria-label={`Delete ${item.label || "Custom"} saved calculation`}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 7h16" />
                            <path d="M9 7V5h6v2" />
                            <path d="M7 7l1 12h8l1-12" />
                            <path d="M10 11v5" />
                            <path d="M14 11v5" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadHistoryItem(item)}
                        className="mt-1 flex min-w-0 w-full items-end justify-between gap-3 text-left transition active:bg-white/8"
                      >
                        <div className="min-w-0 flex-1 text-sm text-white/60">
                          <p>Target Size: {item.targetSizeCm} cm</p>
                          <p className="mt-1">
                            {normalizeHistoryItem(item).angularUnit.toUpperCase()}: {item.milReading}
                          </p>
                        </div>
                        <p className="mono shrink-0 text-sm text-accent">
                          {formatMeters(item.resultMeters, 1)}
                        </p>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/58">
                  No saved calculation yet.
                </div>
              )}
            </div>
          </Card>

          <Link
            href={guideHref}
            className="ui-button ui-button-secondary flex min-h-11 items-center justify-center rounded-[1.5rem] px-4 py-3 text-sm"
          >
            {guideLabel}
          </Link>
          <Link
            href="/slingshot-setup"
            className="ui-button ui-button-secondary flex min-h-11 items-center justify-center rounded-[1.5rem] px-4 py-3 text-sm"
          >
            Open slingshot setup
          </Link>
        </div>
      </div>

      {isPresetModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-2 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Preset picker"
          onClick={() => setIsPresetModalOpen(false)}
        >
          <div
            className="field-card w-full max-w-xl overflow-hidden rounded-[1.5rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="max-h-[min(88dvh,44rem)] overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-0 sm:max-h-[80vh] sm:px-5 sm:py-0">
              <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-white/8 bg-[var(--surface-strong)] px-4 pb-3 pt-3 sm:-mx-5 sm:px-5 sm:pb-4 sm:pt-4">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/18 sm:hidden" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-wide">Choose Preset</h2>
                    <p className="mt-1 text-sm leading-5 text-white/68">
                      Select a target size preset to fill the form quickly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPresetModalOpen(false)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/72 transition active:bg-white/10"
                    aria-label="Close preset picker"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {presetGroups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-white/60">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                      {group.presets.map((preset) => {
                        const isSelected =
                          selectedPreset === preset.label && Number(sizeInput) === preset.sizeCm;

                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => selectPreset(preset.label, preset.sizeCm)}
                            className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm transition sm:min-h-0 sm:rounded-full sm:px-3 sm:py-2 ${isSelected
                              ? "border-transparent bg-accent text-[#182015]"
                              : "border-white/10 bg-white/4 text-white/84 active:bg-white/10"
                              }`}
                          >
                            <span>{preset.label}</span>
                            <span className="ml-2 mono text-xs opacity-75">{preset.sizeCm} cm</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isSaveModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-2 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Save calculation"
          onClick={() => {
            setIsSaveModalOpen(false);
            setSaveNameError("");
          }}
        >
          <div
            className="field-card w-full max-w-md overflow-hidden rounded-[1.5rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-0 sm:px-5 sm:py-0">
              <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-white/8 bg-[var(--surface-strong)] px-4 pb-3 pt-3 sm:-mx-5 sm:px-5 sm:pb-4 sm:pt-4">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/18 sm:hidden" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-wide">Save Calculation</h2>
                    <p className="mt-1 text-sm leading-5 text-white/68">
                      Choose a name so you can recognize this saved result later.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSaveModalOpen(false);
                      setSaveNameError("");
                    }}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/72 transition active:bg-white/10"
                    aria-label="Close save dialog"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <form
                className="space-y-4 pb-4 sm:pb-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveCurrentResult();
                }}
              >
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                    Saved Name
                  </span>
                  <input
                    autoFocus
                    type="text"
                    maxLength={40}
                    value={saveNameInput}
                    onChange={(event) => {
                      setSaveNameInput(event.target.value);
                      if (saveNameError) {
                        setSaveNameError("");
                      }
                    }}
                    className="min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-base outline-none transition focus:border-emerald-300/60"
                    placeholder="Enter a name"
                  />
                </label>

                {saveNameError ? (
                  <p className="text-sm text-rose-300">{saveNameError}</p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSaveModalOpen(false);
                      setSaveNameError("");
                    }}
                    className="min-h-11 rounded-lg border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#182015]"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {isMoaSettingsModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-2 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="MOA settings"
          onClick={() => setIsMoaSettingsModalOpen(false)}
        >
          <div
            className="field-card w-full max-w-md overflow-hidden rounded-[1.5rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-0 sm:px-5 sm:py-0">
              <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-white/8 bg-[var(--surface-strong)] px-4 pb-3 pt-3 sm:-mx-5 sm:px-5 sm:pb-4 sm:pt-4">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/18 sm:hidden" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-wide">MOA Settings</h2>
                    <p className="mt-1 text-sm leading-5 text-white/68">
                      Saved in local storage and shared with the MOA guide.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMoaSettingsModalOpen(false)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/72 transition active:bg-white/10"
                    aria-label="Close MOA settings"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4 pb-4 sm:pb-5">
                <label className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                      1 MOA Equivalent
                    </span>
                    <span className="ui-chip">factor</span>
                  </div>
                  <input
                    autoFocus
                    inputMode="decimal"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={moaDistanceFactorInput}
                    onChange={(event) => setMoaDistanceFactorInput(event.target.value)}
                    className="ui-input text-base"
                  />
                </label>

                <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/74">
                  <p className="font-medium text-accent">
                    Distance (m) = Size (cm) x {moaDistanceFactor} / MOA
                  </p>
                  <p className="mt-1">
                    Example: if a `10 cm` target at `10 m` reads `8 MOA`, set this to `8`.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={resetMoaCalibration}
                    className="ui-button ui-button-secondary min-h-11 rounded-lg px-3 text-sm"
                  >
                    Reset to {MOA_DISTANCE_FACTOR}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMoaSettingsModalOpen(false)}
                    className="ui-button min-h-11 rounded-lg px-3 text-sm bg-accent text-[#182015]"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteItem ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-2 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete saved calculation"
          onClick={() => setPendingDeleteItem(null)}
        >
          <div
            className="field-card w-full max-w-md overflow-hidden rounded-[1.5rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-0 sm:px-5 sm:py-0">
              <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-white/8 bg-[var(--surface-strong)] px-4 pb-3 pt-3 sm:-mx-5 sm:px-5 sm:pb-4 sm:pt-4">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/18 sm:hidden" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-wide">Delete Saved Calculation</h2>
                    <p className="mt-1 text-sm leading-5 text-white/68">
                      Remove
                      {" "}
                      &quot;{pendingDeleteItem.savedName || pendingDeleteItem.label || "Custom"}&quot;
                      {" "}
                      from your saved calculations?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteItem(null)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/72 transition active:bg-white/10"
                    aria-label="Close delete confirmation"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4 pb-4 sm:pb-5">
                <div className="rounded-2xl border border-white/10 bg-black/18 p-4 text-sm text-white/70">
                  <p>Target Size: {pendingDeleteItem.targetSizeCm} cm</p>
                  <p className="mt-1">
                    {normalizeHistoryItem(pendingDeleteItem).angularUnit.toUpperCase()}: {pendingDeleteItem.milReading}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteItem(null)}
                    className="min-h-11 rounded-lg border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteHistoryItem}
                    className="min-h-11 rounded-lg bg-[var(--danger)] px-4 py-2 text-sm font-medium text-[#201513]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
