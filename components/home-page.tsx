"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import {
  calculateDistanceMeters,
  formatExactMeters,
  formatMeters,
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  LAST_PRESET_STORAGE_KEY,
  parsePositiveNumber,
  presetGroups,
  readStoredJson,
  type HistoryItem,
} from "@/lib/range-finder";

type FieldErrors = {
  mil?: string;
  size?: string;
};

const presetByLabel = new Map(
  presetGroups.flatMap((group) =>
    group.presets.map((preset) => [preset.label, preset.sizeCm] as const),
  ),
);

function createErrors(milValue: string, sizeValue: string): FieldErrors {
  const milNumber = Number(milValue);
  const sizeNumber = Number(sizeValue);
  const errors: FieldErrors = {};

  if (milValue.trim() === "") {
    errors.mil = "Enter a mil reading greater than 0.";
  } else if (!Number.isFinite(milNumber) || milNumber <= 0) {
    errors.mil = "Mil reading must be a valid number above 0.";
  }

  if (sizeValue.trim() === "") {
    errors.size = "Enter a target size greater than 0 cm.";
  } else if (!Number.isFinite(sizeNumber) || sizeNumber <= 0) {
    errors.size = "Target size must be a valid number above 0 cm.";
  }

  return errors;
}

export function HomePage() {
  const defaultPresetLabel = "20 cm target";
  const [milInput, setMilInput] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("mil") ?? "";
  });
  const [sizeInput, setSizeInput] = useState(() => {
    if (typeof window === "undefined") {
      return presetByLabel.get(defaultPresetLabel)?.toString() ?? "20";
    }

    return (
      new URLSearchParams(window.location.search).get("size") ??
      presetByLabel.get(defaultPresetLabel)?.toString() ??
      "20"
    );
  });
  const [selectedPreset, setSelectedPreset] = useState(() => {
    if (typeof window === "undefined") {
      return defaultPresetLabel;
    }

    const params = new URLSearchParams(window.location.search);
    return (
      params.get("label") ??
      readStoredJson<string>(LAST_PRESET_STORAGE_KEY, defaultPresetLabel)
    );
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return readStoredJson<HistoryItem[]>(HISTORY_STORAGE_KEY, []);
  });
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [lastSavedKey, setLastSavedKey] = useState("");
  const presetSize = presetByLabel.get(selectedPreset);
  const inputMode = presetSize === undefined ? "manual" : "preset";
  const isTargetSizeLocked = inputMode === "preset";

  const errors = useMemo(() => createErrors(milInput, sizeInput), [milInput, sizeInput]);
  const milNumber = parsePositiveNumber(milInput);
  const sizeNumber = parsePositiveNumber(sizeInput);
  const distance = milNumber && sizeNumber ? calculateDistanceMeters(sizeNumber, milNumber) : null;
  const hasValidResult = distance !== null && Object.keys(errors).length === 0;

  useEffect(() => {
    if (!isPresetModalOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPresetModalOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isPresetModalOpen]);

  useEffect(() => {
    if (presetSize === undefined) {
      return;
    }

    const presetValue = presetSize.toString();
    if (sizeInput !== presetValue) {
      setSizeInput(presetValue);
    }
  }, [presetSize, sizeInput]);

  useEffect(() => {
    if (!hasValidResult || milNumber === null || sizeNumber === null || distance === null) {
      return;
    }

    const saveKey = `${selectedPreset}|${sizeNumber}|${milNumber}|${distance.toFixed(4)}`;
    if (saveKey === lastSavedKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      const item: HistoryItem = {
        label: selectedPreset || "Custom",
        targetSizeCm: sizeNumber,
        milReading: milNumber,
        resultMeters: distance,
        createdAt: new Date().toISOString(),
      };

      const nextHistory = [item, ...history]
        .filter(
          (entry, index, entries) =>
            entries.findIndex(
              (candidate) =>
                candidate.label === entry.label &&
                candidate.targetSizeCm === entry.targetSizeCm &&
                candidate.milReading === entry.milReading,
            ) === index,
        )
        .slice(0, HISTORY_LIMIT);

      setHistory(nextHistory);
      setLastSavedKey(saveKey);
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    distance,
    hasValidResult,
    history,
    lastSavedKey,
    milNumber,
    selectedPreset,
    sizeNumber,
  ]);

  function selectPreset(label: string, sizeCm: number) {
    setSelectedPreset(label);
    setSizeInput(sizeCm.toString());
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify(label));
    setIsPresetModalOpen(false);
  }

  function onTargetSizeChange(value: string) {
    setSizeInput(value);
    if (selectedPreset !== "Custom") {
      setSelectedPreset("Custom");
      window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify("Custom"));
    }
  }

  function clearAll() {
    setMilInput("");
    setSizeInput("");
    setSelectedPreset("Custom");
    setShowErrors(false);
    setLastSavedKey("");
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify("Custom"));
  }

  function clearPresetSelection() {
    setSelectedPreset("Custom");
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify("Custom"));
    setIsPresetModalOpen(false);
  }

  function loadHistoryItem(item: HistoryItem) {
    setMilInput(item.milReading.toString());
    setSizeInput(item.targetSizeCm.toString());
    setSelectedPreset(item.label);
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify(item.label));
  }

  return (
    <main className="flex-1 py-3 sm:py-10">
      <div className="app-shell space-y-3 sm:space-y-4">
        <Card title="Result" subtitle="Distance (m) = Size (cm) x 10 / mil">
          {hasValidResult && distance !== null ? (
            <div className="space-y-3">
              <div className="rounded-2xl bg-black/24 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Estimated distance</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-accent">
                  {formatMeters(distance, 1)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-2xl surface-soft p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">Exact</p>
                  <p className="mt-2 mono text-base">{formatExactMeters(distance)}</p>
                </div>
                <div className="rounded-2xl surface-soft p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">Whole meter</p>
                  <p className="mt-2 mono text-base">{Math.round(distance)} m</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-black/14 p-4 text-sm leading-6 text-white/64">
              Enter a valid mil reading and target size above zero to show the distance result.
            </div>
          )}
        </Card>

        <Card
          title="MIL Range Finder"
          subtitle="Preset or manual size. Distance in meters."
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/18 p-2">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(true)}
                  className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    inputMode === "preset"
                      ? "bg-accent text-[#182015]"
                      : "bg-transparent text-white/72"
                  }`}
                >
                  Select Preset
                </button>
                <button
                  type="button"
                  onClick={clearPresetSelection}
                  className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    inputMode === "manual"
                      ? "bg-accent text-[#182015]"
                      : "bg-transparent text-white/72"
                  }`}
                >
                  Manual
                </button>
              </div>

              <div className="rounded-2xl bg-black/18 px-4 py-3 text-sm text-white/62">
                {inputMode === "preset" ? (
                  <>
                    Preset: <span className="font-medium text-white">{selectedPreset}</span>
                  </>
                ) : (
                  <>Manual target size</>
                )}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white/82">Mil reading</span>
              <input
                inputMode="decimal"
                type="number"
                min="0.1"
                step="0.1"
                value={milInput}
                onChange={(event) => {
                  setMilInput(event.target.value);
                  setShowErrors(false);
                }}
                placeholder="Example: 2.4"
                className="min-h-13 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-lg outline-none transition focus:border-emerald-300/60"
              />
              {showErrors && errors.mil ? <p className="mt-2 text-sm danger">{errors.mil}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white/82">
                Target size (cm)
              </span>
              <input
                inputMode="decimal"
                type="number"
                min="0.1"
                step="0.1"
                value={sizeInput}
                readOnly={isTargetSizeLocked}
                disabled={isTargetSizeLocked}
                onChange={(event) => {
                  onTargetSizeChange(event.target.value);
                  setShowErrors(false);
                }}
                placeholder={isTargetSizeLocked ? "Preset selected" : "Example: 30"}
                className={`min-h-13 w-full rounded-2xl border px-4 py-3 text-lg outline-none transition ${
                  isTargetSizeLocked
                    ? "cursor-not-allowed border-white/6 bg-white/6 text-white/45"
                    : "border-white/10 bg-black/20 focus:border-emerald-300/60"
                }`}
              />
              {isTargetSizeLocked ? (
                <p className="mt-2 text-sm text-white/52">Switch to Manual to edit target size.</p>
              ) : null}
              {showErrors && errors.size ? <p className="mt-2 text-sm danger">{errors.size}</p> : null}
            </label>

            <div>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-medium text-white/80"
              >
                Clear All
              </button>
            </div>
            {!hasValidResult && (milInput.trim() !== "" || sizeInput.trim() !== "") ? (
              <button
                type="button"
                onClick={() => setShowErrors(true)}
                className="text-sm text-white/60 underline underline-offset-4"
              >
                Show input errors
              </button>
            ) : null}
          </div>
        </Card>

        <Card title="Field Note">
          <div className="space-y-2 text-sm leading-6 text-white/76">
            <p className="font-medium text-accent">Standard MIL</p>
            <p className="mono">1 major line = 1 mil</p>
            <p>Do not assume 5 mil per line unless your binocular specifically says so.</p>
          </div>
        </Card>

        <Card title="Recent History" subtitle="Last 5 saved calculations are stored on this device.">
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map((item) => (
                <button
                  key={`${item.createdAt}-${item.label}`}
                  type="button"
                  onClick={() => loadHistoryItem(item)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-left transition active:bg-white/8"
                >
                  <div>
                    <p className="font-medium text-white">{item.label || "Custom"}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {item.targetSizeCm} cm at {item.milReading} mil
                    </p>
                  </div>
                  <p className="mono text-sm text-accent">{formatMeters(item.resultMeters, 1)}</p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-black/14 p-4 text-sm text-white/58">
                No saved calculations yet. Use Calculate to keep the last five results.
              </div>
            )}
          </div>
        </Card>

        <Link
          href="/guide"
          className="flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-base font-semibold text-white"
        >
          Open Guide
        </Link>
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
            className="field-card w-full max-w-xl overflow-hidden rounded-t-[1.8rem] sm:rounded-[2rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="max-h-[min(88dvh,44rem)] overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:max-h-[80vh] sm:px-5 sm:py-5">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/18 sm:hidden" />
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-wide">Choose Preset</h2>
                  <p className="mt-1 text-sm leading-5 text-white/68">
                    Select a target size preset to fill the form quickly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="min-h-11 shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/72"
                >
                  Close
                </button>
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
                            className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm transition sm:min-h-0 sm:rounded-full sm:px-3 sm:py-2 ${
                              isSelected
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
    </main>
  );
}
