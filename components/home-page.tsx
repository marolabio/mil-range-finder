"use client";

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

  function loadHistoryItem(item: HistoryItem) {
    const presetSizeFromLabel = presetByLabel.get(item.label);
    const saveKey = `${item.label}|${item.targetSizeCm}|${item.milReading}|${item.resultMeters.toFixed(4)}`;

    setMilInput(item.milReading.toString());
    setSizeInput((presetSizeFromLabel ?? item.targetSizeCm).toString());
    setSelectedPreset(item.label);
    setLastSavedKey(saveKey);
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify(item.label));
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

  return (
    <main className="flex-1 pt-1 pb-3 sm:pt-1 sm:pb-10">
      <div className="app-shell space-y-3 sm:space-y-4">
        <Card title="MIL Range Finder">
          <div className="space-y-4">
            <label className="block">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                  MIL Reading
                </span>
                <span className="rounded-md bg-white/6 px-2 py-1 text-[11px] font-medium text-white/56">
                  mil
                </span>
              </div>
              <input
                inputMode="decimal"
                type="number"
                min="0.1"
                step="0.1"
                value={milInput}
                onChange={(event) => {
                  setMilInput(event.target.value);
                }}
                className="min-h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base outline-none transition focus:border-emerald-300/60"
              />
            </label>

            <label className="block">
              <div className="mb-2 space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                      Target Size
                    </span>
                    <span className="rounded-md bg-white/6 px-2 py-1 text-[11px] font-medium text-white/56">
                      cm
                    </span>
                  </div>
                  <span className="max-w-[52%] truncate text-right text-white/52 sm:max-w-none sm:text-left">
                    Preset: <span className="font-medium text-white/72">{selectedPreset}</span>
                  </span>
                </div>
                <div className="flex flex-col items-start gap-2 text-xs sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPresetModalOpen(true)}
                    className="min-h-10 w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-center font-medium text-white/80 transition active:bg-white/10 sm:min-h-0 sm:w-auto sm:py-1.5"
                  >
                    Choose preset
                  </button>
                </div>
              </div>
              <input
                inputMode="decimal"
                type="number"
                min="0.1"
                step="0.1"
                value={sizeInput}
                onChange={(event) => {
                  onTargetSizeChange(event.target.value);
                }}
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
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={saveCurrentResult}
                disabled={!hasValidResult || isEntryAlreadySaved}
                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition sm:min-h-0 ${
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
                className="min-h-11 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 sm:min-h-0"
              >
                Clear
              </button>
            </div>
          </div>
        </Card>

        <Card title="Saved Calculations">
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map((item) => (
                <div
                  key={`${item.createdAt}-${item.label}`}
                  className="rounded-2xl border border-white/10 bg-black/18 p-2"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => loadHistoryItem(item)}
                      className="flex min-w-0 flex-1 items-start justify-between gap-3 rounded-xl px-2 py-2 text-left transition active:bg-white/8 sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{item.label || "Custom"}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {item.targetSizeCm} cm at {item.milReading} mil
                        </p>
                      </div>
                      <p className="mono shrink-0 text-sm text-accent">
                        {formatMeters(item.resultMeters, 1)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHistoryItem(item)}
                      className="self-end rounded-lg border border-white/12 bg-white/5 p-2 text-white/72 transition active:bg-white/10 sm:self-auto"
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
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-black/14 p-4 text-sm text-white/58">
                No saved calculation yet.
              </div>
            )}
          </div>
        </Card>

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
