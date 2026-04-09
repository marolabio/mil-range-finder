"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Card } from "@/components/card";
import {
  calculateDistanceMeters,
  type HomePageInputs,
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

type HomePageProps = {
  initialInputs: HomePageInputs;
};

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

export function HomePage({ initialInputs }: HomePageProps) {
  const [milInput, setMilInput] = useState(initialInputs.milInput);
  const [sizeInput, setSizeInput] = useState(initialInputs.sizeInput);
  const [selectedPreset, setSelectedPreset] = useState(initialInputs.selectedPreset);
  const storedHistoryRaw = useSyncExternalStore(subscribeToStorage, readStoredHistoryRaw, () => "[]");
  const [historyOverride, setHistoryOverride] = useState<HistoryItem[] | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [lastSavedKey, setLastSavedKey] = useState("");
  const storedHistory = useMemo(() => {
    try {
      const parsed = JSON.parse(storedHistoryRaw) as HistoryItem[];
      return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
    } catch {
      return [];
    }
  }, [storedHistoryRaw]);
  const history = historyOverride ?? storedHistory;
  const presetSize = presetByLabel.get(selectedPreset);
  const inputMode = presetSize === undefined ? "manual" : "preset";
  const isTargetSizeLocked = inputMode === "preset";

  const errors = useMemo(() => createErrors(milInput, sizeInput), [milInput, sizeInput]);
  const milNumber = parsePositiveNumber(milInput);
  const sizeNumber = parsePositiveNumber(sizeInput);
  const distance = milNumber && sizeNumber ? calculateDistanceMeters(sizeNumber, milNumber) : null;
  const hasValidResult = distance !== null && Object.keys(errors).length === 0;
  const isEntryAlreadySaved =
    hasValidResult && milNumber !== null && sizeNumber !== null
      ? history.some(
          (item) =>
            item.label === (selectedPreset || "Custom") &&
            item.targetSizeCm === sizeNumber &&
            item.milReading === milNumber,
        )
      : false;

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
    const storedHistory = readStoredJson<HistoryItem[]>(HISTORY_STORAGE_KEY, []);
    if (storedHistory.length > HISTORY_LIMIT) {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(storedHistory.slice(0, HISTORY_LIMIT)),
      );
    }
  }, []);

  function saveCurrentResult() {
    if (!hasValidResult || milNumber === null || sizeNumber === null || distance === null) {
      return;
    }

    const saveKey = `${selectedPreset}|${sizeNumber}|${milNumber}|${distance.toFixed(4)}`;
    if (saveKey === lastSavedKey) {
      return;
    }

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

    setHistoryOverride(nextHistory);
    setLastSavedKey(saveKey);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  }

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
    setLastSavedKey("");
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify("Custom"));
  }

  function clearPresetSelection() {
    setSelectedPreset("Custom");
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify("Custom"));
    setIsPresetModalOpen(false);
  }

  function loadHistoryItem(item: HistoryItem) {
    const presetSizeFromLabel = presetByLabel.get(item.label);
    const saveKey = `${item.label}|${item.targetSizeCm}|${item.milReading}|${item.resultMeters.toFixed(4)}`;

    setMilInput(item.milReading.toString());
    setSizeInput((presetSizeFromLabel ?? item.targetSizeCm).toString());
    setSelectedPreset(item.label);
    setLastSavedKey(saveKey);
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify(item.label));
  }

  return (
    <main className="flex-1 py-3 sm:py-10">
      <div className="app-shell space-y-3 sm:space-y-4">
        <Card
          title="MIL Range Finder"
          subtitle="Distance in meters."
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white/82">Target size (cm)</span>
                <span className="text-xs text-white/62">
                  Preset: <span className="font-medium text-white">{selectedPreset}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-black/18 p-1.5">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(true)}
                  className={`min-h-10 rounded-xl px-3 py-2 text-xs font-medium transition ${
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
                  className={`min-h-10 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    inputMode === "manual"
                      ? "bg-accent text-[#182015]"
                      : "bg-transparent text-white/72"
                  }`}
                >
                  Custom
                </button>
              </div>
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
                }}
                placeholder={isTargetSizeLocked ? "Preset selected" : ""}
                className={`min-h-10 w-full rounded-xl border px-3 py-2 text-base outline-none transition ${
                  isTargetSizeLocked
                    ? "cursor-not-allowed border-white/6 bg-white/6 text-white/45"
                    : "border-white/10 bg-black/20 focus:border-emerald-300/60"
                }`}
              />
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
                }}
                placeholder=""
                className="min-h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base outline-none transition focus:border-emerald-300/60"
              />
            </label>

            <div className="space-y-2">
              {hasValidResult && distance !== null ? (
                <div className="rounded-2xl bg-black/24 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">Estimated distance</p>
                  <p className="mt-2 text-4xl font-bold tracking-tight text-accent">
                    {formatMeters(distance, 1)}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-black/24 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">Estimated distance</p>
                  <p className="mt-2 text-4xl font-bold tracking-tight text-white/35">0 m</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={saveCurrentResult}
                disabled={!hasValidResult || isEntryAlreadySaved}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  hasValidResult && !isEntryAlreadySaved
                    ? "bg-accent text-[#182015]"
                    : "cursor-not-allowed bg-white/6 text-white/35"
                }`}
              >
                Save
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-medium text-white/80"
              >
                Clear All
              </button>
            </div>
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
                No saved calculation yet.
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
