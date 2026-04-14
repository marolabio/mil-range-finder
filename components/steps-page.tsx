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
  const strideLength =
    calibrationSteps !== null && calibrationMeters !== null
      ? calibrationMeters / calibrationSteps
      : null;
  const hasValidResult = estimatedDistance !== null && Object.keys(errors).length === 0;

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
  }, [isCalibrationModalOpen]);

  function resetToDefaultProfile() {
    const defaults = getDefaultStepRangeInputs();
    setStepsInput(defaults.stepsInput);
    setCalibrationStepsInput(defaults.calibrationStepsInput);
    setCalibrationMetersInput(defaults.calibrationMetersInput);
    setCalibrationDistanceUnit(defaults.calibrationDistanceUnit);
  }

  return (
    <main className="flex-1 pt-0 pb-6 sm:pb-10">
      <div className="app-shell space-y-4 sm:space-y-5">
        <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-5 lg:space-y-0">
          <div className="space-y-4">
            <Card
              title="Step Counter"
              subtitle="Count your pace and see the estimated distance together."
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.95fr)]">
                <div className="space-y-4">
                  <label className="block">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                        Steps Counted
                      </span>
                      <span className="rounded-md bg-white/6 px-2 py-1 text-[11px] font-medium text-white/56">
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
                      className="min-h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base outline-none transition focus:border-emerald-300/60"
                      placeholder=""
                    />
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                      Estimated Distance
                    </p>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-accent md:text-5xl">
                      {hasValidResult && estimatedDistance !== null
                        ? formatExactMeters(estimatedDistance)
                        : "0 m"}
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-white/72">
                      <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>Your pace</span>
                        <span className="mono text-accent">
                          {strideLength !== null ? `${strideLength.toFixed(2)} m/step` : "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                        onClick={() => setIsCalibrationModalOpen(true)}
                        className="min-h-10 w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 sm:w-auto"
                      >
                        Edit
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
                    className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
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
            className="field-card w-full max-w-md overflow-hidden rounded-[1.5rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-0 sm:px-5 sm:py-0">
              <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-white/8 bg-[var(--surface-strong)] px-4 pb-3 pt-3 sm:-mx-5 sm:px-5 sm:pb-4 sm:pt-4">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/18 sm:hidden" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-wide">Calibration</h2>
                    <p className="mt-1 text-sm leading-5 text-white/68">
                      Set your known pace so step counts convert cleanly into meters.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalibrationModalOpen(false)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/72 transition active:bg-white/10"
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

              <div className="space-y-4 pb-4 sm:pb-5">
                <label className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                      Calibration Steps
                    </span>
                    <span className="rounded-md bg-white/6 px-2 py-1 text-[11px] font-medium text-white/56">
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
                    className="min-h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base outline-none transition focus:border-emerald-300/60"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                      Calibration Distance
                    </span>
                  </div>
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={calibrationMetersInput}
                    onChange={(event) => setCalibrationMetersInput(event.target.value)}
                    className="min-h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base outline-none transition focus:border-emerald-300/60"
                  />
                </label>

                <div className="grid grid-cols-1 gap-2 rounded-2xl bg-black/18 p-2 sm:grid-cols-3">
                  {([
                    { label: "cm", value: "cm" },
                    { label: "Meters", value: "m" },
                    { label: "Inches", value: "in" },
                  ] as const).map((unit) => {
                    const isActive = calibrationDistanceUnit === unit.value;

                    return (
                      <button
                        key={unit.value}
                        type="button"
                        onClick={() => setCalibrationDistanceUnit(unit.value)}
                        className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition ${
                          isActive ? "bg-accent text-[#182015]" : "text-white/72"
                        }`}
                      >
                        {unit.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={resetToDefaultProfile}
                    className="min-h-11 w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 sm:w-auto"
                  >
                    Reset to 8 steps = 5 m
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalibrationModalOpen(false)}
                    className="min-h-11 w-full rounded-xl bg-accent px-4 py-2 text-sm font-medium text-[#182015] sm:w-auto"
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
