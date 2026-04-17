"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import {
  calculateDistanceFromSteps,
  convertDistanceToMeters,
  formatExactMeters,
  getDefaultStepRangeInputs,
  parsePositiveNumber,
  readStoredJson,
  STEP_CALIBRATION_STORAGE_KEY,
  type StepRangeInputs,
} from "@/lib/range-finder";

type FieldErrors = {
  calibrationMetersInput?: string;
  calibrationStepsInput?: string;
  stepsInput?: string;
};

type StepsPageProps = {
  initialInputs: StepRangeInputs;
};

const calibrationDistanceUnits = [
  { label: "Centimeters (cm)", value: "cm" },
  { label: "Meters (m)", value: "m" },
  { label: "Inches (in)", value: "in" },
] as const;

function createErrors(
  stepsInput: string,
  calibrationStepsInput: string,
  calibrationMetersInput: string,
): FieldErrors {
  const errors: FieldErrors = {};

  if (stepsInput.trim() === "") {
    errors.stepsInput = "Enter the number of steps you counted.";
  } else if (parsePositiveNumber(stepsInput) === null) {
    errors.stepsInput = "Step count must be a number above 0.";
  }

  if (calibrationStepsInput.trim() === "") {
    errors.calibrationStepsInput = "Enter your known step count.";
  } else if (parsePositiveNumber(calibrationStepsInput) === null) {
    errors.calibrationStepsInput = "Calibration steps must be a number above 0.";
  }

  if (calibrationMetersInput.trim() === "") {
    errors.calibrationMetersInput = "Enter your known calibration distance.";
  } else if (parsePositiveNumber(calibrationMetersInput) === null) {
    errors.calibrationMetersInput = "Calibration distance must be a number above 0.";
  }

  return errors;
}

export function StepsPage({ initialInputs }: StepsPageProps) {
  const storedCalibration = readStoredJson<Pick<
    StepRangeInputs,
    "calibrationDistanceUnit" | "calibrationMetersInput" | "calibrationStepsInput"
  > | null>(STEP_CALIBRATION_STORAGE_KEY, null);
  const [stepsInput, setStepsInput] = useState(initialInputs.stepsInput);
  const [calibrationStepsInput, setCalibrationStepsInput] = useState(
    storedCalibration?.calibrationStepsInput ?? initialInputs.calibrationStepsInput,
  );
  const [calibrationMetersInput, setCalibrationMetersInput] = useState(
    storedCalibration?.calibrationMetersInput ?? initialInputs.calibrationMetersInput,
  );
  const [calibrationDistanceUnit, setCalibrationDistanceUnit] = useState(
    storedCalibration?.calibrationDistanceUnit ?? initialInputs.calibrationDistanceUnit,
  );
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [isUnitMenuOpen, setIsUnitMenuOpen] = useState(false);

  const errors = useMemo(
    () => createErrors(stepsInput, calibrationStepsInput, calibrationMetersInput),
    [stepsInput, calibrationMetersInput, calibrationStepsInput],
  );

  const stepCount = parsePositiveNumber(stepsInput);
  const calibrationSteps = parsePositiveNumber(calibrationStepsInput);
  const calibrationDistanceValue = parsePositiveNumber(calibrationMetersInput);
  const calibrationMeters =
    calibrationDistanceValue !== null
      ? convertDistanceToMeters(calibrationDistanceValue, calibrationDistanceUnit)
      : null;
  const estimatedDistance =
    stepCount !== null && calibrationSteps !== null && calibrationMeters !== null
      ? calculateDistanceFromSteps(stepCount, calibrationSteps, calibrationMeters)
      : null;
  const hasValidResult = estimatedDistance !== null && Object.keys(errors).length === 0;
  const selectedCalibrationUnit =
    calibrationDistanceUnits.find((unit) => unit.value === calibrationDistanceUnit) ??
    calibrationDistanceUnits[0];

  useEffect(() => {
    window.localStorage.setItem(
      STEP_CALIBRATION_STORAGE_KEY,
      JSON.stringify({
        calibrationStepsInput,
        calibrationMetersInput,
        calibrationDistanceUnit,
      }),
    );
  }, [calibrationDistanceUnit, calibrationMetersInput, calibrationStepsInput]);

  useEffect(() => {
    if (!isCalibrationModalOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isUnitMenuOpen) {
          setIsUnitMenuOpen(false);
          return;
        }

        setIsUnitMenuOpen(false);
        setIsCalibrationModalOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isCalibrationModalOpen, isUnitMenuOpen]);

  function resetToDefaultProfile() {
    const defaults = getDefaultStepRangeInputs();
    setStepsInput(defaults.stepsInput);
    setCalibrationStepsInput(defaults.calibrationStepsInput);
    setCalibrationMetersInput(defaults.calibrationMetersInput);
    setCalibrationDistanceUnit(defaults.calibrationDistanceUnit);
    setIsUnitMenuOpen(false);
  }

  return (
    <main className="flex-1 pt-0 pb-6 sm:pb-10">
      <div className="app-shell space-y-4 sm:space-y-5">
        <div className="space-y-4">
          <div className="space-y-4">
            <Card title="Step Range" subtitle="Count steps and use your calibration to estimate distance.">
              <div className="grid gap-4">
                <div className="space-y-4">
                  <label className="block">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                        Steps Counted
                      </span>
                      <span className="ui-chip">
                        steps
                      </span>
                    </div>
                    <input
                      inputMode="decimal"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={stepsInput}
                      onChange={(event) => setStepsInput(event.target.value)}
                      className="ui-input rounded-xl text-base"
                      placeholder=""
                    />
                  </label>

                  <div className="ui-panel p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                      Estimated Distance
                    </p>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-accent md:text-5xl">
                      {hasValidResult && estimatedDistance !== null
                        ? formatExactMeters(estimatedDistance)
                        : "0 m"}
                    </p>
                  </div>

                  <div className="ui-panel px-4 py-3">
                    <div className="flex gap-3 sm:items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                          Calibration
                        </p>
                        <p className="mt-1 break-words text-sm text-white/72">
                          {calibrationStepsInput || "--"} steps = {calibrationMetersInput || "--"}{" "}
                          {calibrationDistanceUnit}
                        </p>

                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUnitMenuOpen(false);
                          setIsCalibrationModalOpen(true);
                        }}
                        className="ui-button ui-button-secondary inline-flex h-11 w-11 items-center justify-center rounded-xl px-0"
                        aria-label="Edit calibration"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 .99-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 .99 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51.99H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51.99Z" />
                        </svg>
                      </button>

                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Quick Reads" subtitle="Based on your saved profile">
              <div className="space-y-2">
                  <div className="hidden items-center justify-between px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:flex">
                  <span>Distance</span>
                  <span>Estimated Steps</span>
                </div>
                {[5, 10, 15, 20, 25, 30].map((sampleMeters) => (
                  <div
                    key={sampleMeters}
                    className="ui-panel flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="text-sm text-white/76">
                      <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:hidden">
                        Distance
                      </span>
                      {sampleMeters} m
                    </p>
                    <p className="mono text-sm text-accent">
                      <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:hidden">
                        Estimated
                      </span>
                      {`${Math.round(
                        calibrationMeters !== null && calibrationSteps !== null
                          ? (sampleMeters / calibrationMeters) * calibrationSteps
                          : 0,
                      )} steps`}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {isCalibrationModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-2 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Calibration settings"
          onClick={() => setIsCalibrationModalOpen(false)}
        >
          <div
            className="field-card w-full max-w-md overflow-visible rounded-[1.5rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-0 sm:px-5 sm:py-0">
              <div className="sticky top-0 z-10 -mx-4 mb-4 rounded-t-[1.5rem] border-b border-white/8 bg-[var(--surface-strong)] px-4 pb-3 pt-3 sm:-mx-5 sm:px-5 sm:pb-4 sm:pt-4">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/18 sm:hidden" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-wide">Calibration</h2>
                    <p className="mt-1 text-sm leading-5 text-white/68">
                      Count your steps over a known distance to get a more accurate pace and estimate.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalibrationModalOpen(false)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.035] text-white/72 transition active:bg-white/[0.06]"
                    aria-label="Close calibration dialog"
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

              <div className="space-y-4 overflow-visible pb-4 sm:pb-5">
                {isUnitMenuOpen ? (
                  <button
                    type="button"
                    aria-label="Close unit menu"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setIsUnitMenuOpen(false)}
                  />
                ) : null}
                <label className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                      Calibration Steps
                    </span>
                    <span className="ui-chip">
                      steps
                    </span>
                  </div>
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={calibrationStepsInput}
                    onChange={(event) => setCalibrationStepsInput(event.target.value)}
                    className="ui-input rounded-xl text-base"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                      Calibration Distance
                    </span>
                    <span className="ui-chip">
                      {selectedCalibrationUnit.value}
                    </span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_5.75rem] gap-2">
                    <input
                      inputMode="decimal"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={calibrationMetersInput}
                      onChange={(event) => setCalibrationMetersInput(event.target.value)}
                      className="ui-input min-w-0 flex-1 rounded-xl text-base"
                    />
                    <div className="relative z-20">
                      <button
                        type="button"
                        onClick={() => setIsUnitMenuOpen((current) => !current)}
                        className="ui-input flex min-h-10 w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm font-semibold"
                        aria-expanded={isUnitMenuOpen}
                        aria-haspopup="listbox"
                        aria-label="Calibration distance unit"
                      >
                        <span className="truncate uppercase">{selectedCalibrationUnit.value}</span>
                        <span className="mx-1.5 h-5 w-px bg-white/10" aria-hidden="true" />
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          className={`h-3.5 w-3.5 shrink-0 text-white/58 transition ${isUnitMenuOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 8l4 4 4-4" />
                        </svg>
                      </button>
                      {isUnitMenuOpen ? (
                        <div
                          className="absolute right-0 top-[calc(100%+0.35rem)] w-40 rounded-xl border border-white/8 bg-[rgba(28,35,31,0.98)] p-1 shadow-[0_18px_34px_rgba(0,0,0,0.28)]"
                          role="listbox"
                          aria-label="Calibration distance unit options"
                        >
                          {calibrationDistanceUnits.map((unit) => {
                            const isSelected = unit.value === calibrationDistanceUnit;

                            return (
                              <button
                                key={unit.value}
                                type="button"
                                onClick={() => {
                                  setCalibrationDistanceUnit(unit.value);
                                  setIsUnitMenuOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${isSelected
                                  ? "bg-white/8 text-white"
                                  : "text-white/72 active:bg-white/6"
                                  }`}
                                role="option"
                                aria-selected={isSelected}
                              >
                                <span className="pr-2 leading-4">{unit.label}</span>
                                <span className="shrink-0 rounded-md bg-black/22 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/58">
                                  {unit.value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-2 border-t border-white/8 pt-3">
                  <button
                    type="button"
                    onClick={resetToDefaultProfile}
                    className="ui-button ui-button-secondary min-h-9 w-full rounded-xl px-3 py-1.5 text-xs"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnitMenuOpen(false);
                      setIsCalibrationModalOpen(false);
                    }}
                    className="ui-button ui-button-primary min-h-9 w-full rounded-xl px-3 py-1.5 text-xs"
                  >
                    Save
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
