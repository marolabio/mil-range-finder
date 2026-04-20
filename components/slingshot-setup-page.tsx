"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import {
  bandProfiles,
  calculateActiveBandLengthCm,
  convertLengthToCentimeters,
  parsePositiveNumber,
  type DrawLengthUnit,
  type SlingshotSetupInputs,
} from "@/lib/range-finder";

type SlingshotSetupPageProps = {
  initialInputs: SlingshotSetupInputs;
};

type FieldErrors = {
  drawLengthInput?: string;
};

type PreferenceMode = "control" | "fast";

const drawLengthUnits: Array<{ label: string; value: DrawLengthUnit }> = [
  { label: "Centimeters (cm)", value: "cm" },
  { label: "Inches (in)", value: "in" },
];

const ammoOptions = bandProfiles.map((profile) => ({
  id: profile.id,
  shortAmmo:
    profile.id === "flat-18-12-040"
      ? "7"
      : profile.id === "flat-20-12-045"
        ? "8"
        : profile.id === "flat-22-12-050"
          ? "9"
          : profile.id === "flat-22-12-060"
            ? "10"
            : "11",
}));

const researchedRecommendations: Record<
  string,
  {
    control: { taper: string; thickness: string };
    speed: { taper: string; thickness: string };
  }
> = {
  "7": {
    control: { taper: "18-09", thickness: "0.4-0.5 mm" },
    speed: { taper: "20-12", thickness: "0.4-0.5 mm" },
  },
  "8": {
    control: { taper: "20-12", thickness: "0.5-0.6 mm" },
    speed: { taper: "22-14", thickness: "0.5-0.6 mm" },
  },
  "9": {
    control: { taper: "20-12", thickness: "0.5-0.6 mm" },
    speed: { taper: "22-14", thickness: "0.5-0.6 mm" },
  },
  "10": {
    control: { taper: "20-12", thickness: "0.5-0.6 mm" },
    speed: { taper: "22-14", thickness: "0.6-0.7 mm" },
  },
  "11": {
    control: { taper: "22-14", thickness: "0.6-0.7 mm" },
    speed: { taper: "30-15", thickness: "0.6-0.7 mm" },
  },
};

function createErrors(drawLengthInput: string): FieldErrors {
  const errors: FieldErrors = {};

  if (drawLengthInput.trim() === "") {
    errors.drawLengthInput = "Enter your draw length.";
  } else if (parsePositiveNumber(drawLengthInput) === null) {
    errors.drawLengthInput = "Draw length must be a number above 0.";
  }

  return errors;
}

export function SlingshotSetupPage({ initialInputs }: SlingshotSetupPageProps) {
  const [drawLengthInput, setDrawLengthInput] = useState(initialInputs.drawLengthInput);
  const [drawLengthUnit, setDrawLengthUnit] = useState(initialInputs.drawLengthUnit);
  const [selectedBandProfileId, setSelectedBandProfileId] = useState(initialInputs.selectedBandProfileId);
  const [isUnitMenuOpen, setIsUnitMenuOpen] = useState(false);
  const [isAmmoMenuOpen, setIsAmmoMenuOpen] = useState(false);
  const [preferenceMode, setPreferenceMode] = useState<PreferenceMode>("control");

  const errors = useMemo(() => createErrors(drawLengthInput), [drawLengthInput]);
  const drawLengthValue = parsePositiveNumber(drawLengthInput);
  const selectedBandProfile =
    ammoOptions.find((profile) => profile.id === selectedBandProfileId) ?? ammoOptions[0];
  const drawLengthCm =
    drawLengthValue !== null ? convertLengthToCentimeters(drawLengthValue, drawLengthUnit) : null;
  const selectedStretchRatio = preferenceMode === "control" ? 5 : 5.5;
  const activeBandLengthCm =
    drawLengthCm !== null ? calculateActiveBandLengthCm(drawLengthCm, selectedStretchRatio) : null;
  const hasValidResult = activeBandLengthCm !== null && Object.keys(errors).length === 0;
  const selectedDrawLengthUnit =
    drawLengthUnits.find((unit) => unit.value === drawLengthUnit) ?? drawLengthUnits[0];
  const selectedRecommendation =
    researchedRecommendations[selectedBandProfile.shortAmmo] ?? researchedRecommendations["8"];
  const displayedRecommendation =
    preferenceMode === "control" ? selectedRecommendation.control : selectedRecommendation.speed;
  useEffect(() => {
    if (!isUnitMenuOpen && !isAmmoMenuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isAmmoMenuOpen) {
          setIsAmmoMenuOpen(false);
          return;
        }

        setIsUnitMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAmmoMenuOpen, isUnitMenuOpen]);

  return (
    <main className="flex-1 pt-0 pb-6 sm:pb-10">
      <div className="app-shell space-y-4 sm:space-y-5">
        <Card title="Slingshot Setup" subtitle="Enter draw length, ammo size and choose your setup style.">
          <div className="space-y-4">
            {isUnitMenuOpen || isAmmoMenuOpen ? (
              <button
                type="button"
                aria-label="Close open menu"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => {
                  setIsUnitMenuOpen(false);
                  setIsAmmoMenuOpen(false);
                }}
              />
            ) : null}

            <div className="grid grid-cols-[minmax(0,1fr)_5.75rem] gap-2 sm:gap-3">
              <label className="block min-w-0">
                <div className="mb-2 flex min-h-6 items-center gap-2">
                  <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                    Draw Length
                  </span>
                  <span className="ui-chip">
                    {selectedDrawLengthUnit.value}
                  </span>
                </div>
                <input
                  inputMode="decimal"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={drawLengthInput}
                  onChange={(event) => setDrawLengthInput(event.target.value)}
                  className="ui-input min-w-0 text-base"
                />
                {errors.drawLengthInput ? (
                  <p className="mt-2 text-sm text-rose-300">{errors.drawLengthInput}</p>
                ) : null}
              </label>

              <div className="relative z-30">
                <div className="mb-2 flex min-h-6 items-center gap-2">
                  <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                    Unit
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAmmoMenuOpen(false);
                    setIsUnitMenuOpen((current) => !current);
                  }}
                  className="ui-input flex min-h-10 w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm font-semibold"
                  aria-expanded={isUnitMenuOpen}
                  aria-haspopup="listbox"
                  aria-label="Draw length unit"
                >
                  <span className="truncate uppercase">{selectedDrawLengthUnit.value}</span>
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
                    className="absolute right-0 top-[calc(100%+0.35rem)] z-40 w-40 rounded-xl border border-white/8 bg-[rgba(28,35,31,0.98)] p-1 shadow-[0_18px_34px_rgba(0,0,0,0.28)]"
                    role="listbox"
                    aria-label="Draw length unit options"
                  >
                    {drawLengthUnits.map((unit) => {
                      const isSelected = unit.value === drawLengthUnit;

                      return (
                        <button
                          key={unit.value}
                          type="button"
                          onClick={() => {
                            setDrawLengthUnit(unit.value);
                            setIsUnitMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                            isSelected ? "bg-white/8 text-white" : "text-white/72 active:bg-white/6"
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

            <div className="relative z-20">
              <div className="mb-2 flex items-center gap-2">
                <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                  Steel Ball
                </span>
                <span className="ui-chip">
                  mm
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUnitMenuOpen(false);
                  setIsAmmoMenuOpen((current) => !current);
                }}
                className="ui-input flex min-h-10 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold"
                aria-expanded={isAmmoMenuOpen}
                aria-haspopup="listbox"
                aria-label="Steel ball size"
              >
                <span className="truncate pr-2">{selectedBandProfile.shortAmmo} mm</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className={`h-3.5 w-3.5 shrink-0 text-white/58 transition ${isAmmoMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8l4 4 4-4" />
                </svg>
              </button>
              {isAmmoMenuOpen ? (
                <div
                  className="absolute left-0 top-[calc(100%+0.35rem)] z-30 max-h-64 w-full overflow-y-auto rounded-xl border border-white/8 bg-[rgba(28,35,31,0.98)] p-1 shadow-[0_18px_34px_rgba(0,0,0,0.28)]"
                  role="listbox"
                  aria-label="Ammo size options"
                >
                  {ammoOptions.map((profile) => {
                    const isSelected = profile.id === selectedBandProfileId;

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          setSelectedBandProfileId(profile.id);
                          setIsAmmoMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                          isSelected ? "bg-white/8 text-white" : "text-white/72 active:bg-white/6"
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="min-w-0 flex-1 leading-5">{profile.shortAmmo} mm</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

          </div>
        </Card>

        <div className="rounded-[1.5rem] border border-[rgba(168,199,119,0.28)] bg-[linear-gradient(180deg,rgba(62,78,53,0.92),rgba(29,37,31,0.96))] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.22)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Recommended Band Setup</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreferenceMode("control")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  preferenceMode === "control"
                    ? "bg-accent text-[#182015]"
                    : "border border-white/10 bg-white/[0.04] text-white/76"
                }`}
              >
                Control
              </button>
              <button
                type="button"
                onClick={() => setPreferenceMode("fast")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  preferenceMode === "fast"
                    ? "bg-accent text-[#182015]"
                    : "border border-white/10 bg-white/[0.04] text-white/76"
                }`}
              >
                Speed
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/50">Active Band Length</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-accent md:text-5xl">
            {hasValidResult && activeBandLengthCm !== null ? `${activeBandLengthCm.toFixed(1)} cm` : "0 cm"}
          </p>
          <p className="mt-3 text-sm text-white/64">
            Ratio: {selectedStretchRatio}:1
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Band Size</p>
              <p className="mt-2 text-lg font-semibold text-white/88">{displayedRecommendation.thickness}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Taper</p>
              <p className="mt-2 text-lg font-semibold text-white/88">{displayedRecommendation.taper}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
