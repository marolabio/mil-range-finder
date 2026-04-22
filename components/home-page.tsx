"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Card } from "@/components/card";
import {
  calculateDistanceMeters,
  DEFAULT_ANGULAR_UNIT,
  type AngularUnit,
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
  angularReading?: string;
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
  const [milInput, setMilInput] = useState(initialInputs.milInput);
  const [sizeInput, setSizeInput] = useState(initialInputs.sizeInput);
  const [selectedPreset, setSelectedPreset] = useState(initialInputs.selectedPreset);
  const storedHistoryRaw = useSyncExternalStore(subscribeToStorage, readStoredHistoryRaw, () => "[]");
  const [historyOverride, setHistoryOverride] = useState<HistoryItem[] | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<HistoryItem | null>(null);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [saveNameError, setSaveNameError] = useState("");
  const [lastSavedKey, setLastSavedKey] = useState("");
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
  const distance =
    milNumber && sizeNumber ? calculateDistanceMeters(sizeNumber, milNumber, angularUnit) : null;
  const hasValidResult = distance !== null && Object.keys(errors).length === 0;
  const angularUnitLabel = angularUnit.toUpperCase();
  const rangeTitle = `${angularUnitLabel} Range`;
  const guideHref = angularUnit === "moa" ? "/moa-guide" : "/guide";
  const guideLabel = `Open ${angularUnitLabel} guide`;
  useEffect(() => {
    if (!isPresetModalOpen && !isSaveModalOpen && !pendingDeleteItem) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPresetModalOpen(false);
        setIsSaveModalOpen(false);
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
  }, [isPresetModalOpen, isSaveModalOpen, pendingDeleteItem]);

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
    setSaveNameError("");
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify("Custom"));
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
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify(normalizedItem.label));
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
          <div className="ui-panel space-y-2 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                Angular Unit
              </span>
              <span className="ui-chip">meters</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["moa", "mil"] as const).map((unit) => {
                const isSelected = angularUnit === unit;

                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => onAngularUnitChange(unit)}
                    className={`ui-button min-h-11 rounded-lg px-3 text-sm ${
                      isSelected ? "bg-accent text-[#182015]" : "ui-button-secondary"
                    }`}
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
                        className="ui-button ui-button-secondary min-h-9 rounded-lg px-2.5 py-1.5 text-center text-xs md:min-h-0 md:w-auto"
                      >
                        Choose
                      </button>

                    </div>
                  </div>

                </label>

                <label className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="ui-field-label text-xs font-semibold uppercase tracking-[0.18em]">
                      {angularUnitLabel} Reading
                    </span>
                    <span className="ui-chip">
                      {angularUnit}
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
                    className="ui-input text-base"
                  />
                  {errors.angularReading ? (
                    <p className="mt-2 text-sm text-rose-300">{errors.angularReading}</p>
                  ) : null}
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  {hasValidResult && distance !== null ? (
                    <div className="ui-panel p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/55">Estimated distance</p>
                      <p className="mt-2 text-4xl font-bold tracking-tight text-accent md:text-5xl lg:text-4xl xl:text-5xl">
                        {formatMeters(distance, 1)}
                      </p>
                    </div>
                  ) : (
                    <div className="ui-panel p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/55">Estimated distance</p>
                      <p className="mt-2 text-4xl font-bold tracking-tight text-white/35 md:text-5xl lg:text-4xl xl:text-5xl">
                        0 m
                      </p>
                    </div>
                  )}
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
