"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  const [milInput, setMilInput] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("mil") ?? "";
  });
  const [sizeInput, setSizeInput] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("size") ?? "";
  });
  const [selectedPreset, setSelectedPreset] = useState(() => {
    if (typeof window === "undefined") {
      return "Custom";
    }

    const params = new URLSearchParams(window.location.search);
    return (
      params.get("label") ??
      readStoredJson<string>(LAST_PRESET_STORAGE_KEY, "Custom")
    );
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return readStoredJson<HistoryItem[]>(HISTORY_STORAGE_KEY, []);
  });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const errors = useMemo(() => createErrors(milInput, sizeInput), [milInput, sizeInput]);
  const milNumber = parsePositiveNumber(milInput);
  const sizeNumber = parsePositiveNumber(sizeInput);
  const distance = milNumber && sizeNumber ? calculateDistanceMeters(sizeNumber, milNumber) : null;
  const hasValidResult = distance !== null && Object.keys(errors).length === 0;

  function selectPreset(label: string, sizeCm: number) {
    setSelectedPreset(label);
    setSizeInput(sizeCm.toString());
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify(label));
  }

  function onTargetSizeChange(value: string) {
    setSizeInput(value);
    if (selectedPreset !== "Custom") {
      setSelectedPreset("Custom");
      window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify("Custom"));
    }
  }

  function saveCalculation() {
    if (!hasValidResult || milNumber === null || sizeNumber === null || distance === null) {
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

    setHistory(nextHistory);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  }

  function handleCalculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCalculation();
  }

  function clearAll() {
    setMilInput("");
    setSizeInput("");
    setSelectedPreset("Custom");
    setCopyState("idle");
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify("Custom"));
  }

  function loadHistoryItem(item: HistoryItem) {
    setMilInput(item.milReading.toString());
    setSizeInput(item.targetSizeCm.toString());
    setSelectedPreset(item.label);
    window.localStorage.setItem(LAST_PRESET_STORAGE_KEY, JSON.stringify(item.label));
  }

  async function copyResult() {
    if (!hasValidResult || distance === null || milNumber === null || sizeNumber === null) {
      return;
    }

    const summary = `MIL Range Finder\nPreset: ${selectedPreset || "Custom"}\nSize: ${sizeNumber} cm\nMil: ${milNumber}\nDistance: ${formatExactMeters(distance)}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <main className="flex-1 py-6 sm:py-10">
      <div className="app-shell space-y-4 sm:space-y-5">
        <Card
          title="MIL Range Finder"
          subtitle="Distance calculator for field targets"
          className="overflow-hidden"
        >
          <div className="surface-soft rounded-2xl border border-white/8 p-4">
            <p className="text-sm uppercase tracking-[0.24em] text-accent">Mobile Field Utility</p>
            <p className="mt-2 text-sm leading-6 text-white/72">
              Standard MIL calculator for quick one-handed use, bird presets, head-size presets,
              and target practice references.
            </p>
          </div>
        </Card>

        <Card title="Presets" subtitle="Tap a preset to auto-fill the target size in centimeters.">
          <div className="space-y-4">
            {presetGroups.map((group) => (
              <div key={group.id}>
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-white/60">
                  {group.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.presets.map((preset) => {
                    const isSelected =
                      selectedPreset === preset.label && Number(sizeInput) === preset.sizeCm;

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => selectPreset(preset.label, preset.sizeCm)}
                        className={`rounded-full border px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? "border-transparent bg-accent text-[#182015]"
                            : "border-white/10 bg-white/4 text-white/84 active:bg-white/10"
                        }`}
                      >
                        {preset.label}
                        <span className="ml-2 mono text-xs opacity-75">{preset.sizeCm} cm</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Calculator" subtitle="Auto-calculates as you type. Use Calculate to save to history.">
          <form className="space-y-4" onSubmit={handleCalculate}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white/82">Mil reading</span>
              <input
                inputMode="decimal"
                type="number"
                min="0.1"
                step="0.1"
                value={milInput}
                onChange={(event) => setMilInput(event.target.value)}
                placeholder="Example: 2.4"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-lg outline-none transition focus:border-emerald-300/60"
              />
              {errors.mil ? <p className="mt-2 text-sm danger">{errors.mil}</p> : null}
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
                onChange={(event) => onTargetSizeChange(event.target.value)}
                placeholder="Example: 30"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-lg outline-none transition focus:border-emerald-300/60"
              />
              {errors.size ? <p className="mt-2 text-sm danger">{errors.size}</p> : null}
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="submit"
                className="rounded-2xl bg-accent px-4 py-3 font-semibold text-[#182015]"
              >
                Calculate
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 font-medium"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={copyResult}
                disabled={!hasValidResult}
                className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-45"
              >
                Copy Result
              </button>
            </div>
            {copyState === "copied" ? (
              <p className="text-sm text-accent">Result copied to your clipboard.</p>
            ) : null}
            {copyState === "error" ? (
              <p className="text-sm danger">Clipboard access failed. Try again after another calculation.</p>
            ) : null}
          </form>
        </Card>

        <Card title="Result" subtitle="Distance (m) = Size (cm) × 10 ÷ mil">
          {hasValidResult && distance !== null ? (
            <div className="space-y-3">
              <div className="rounded-3xl border border-emerald-200/10 bg-black/24 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/55">Estimated distance</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-accent">{formatMeters(distance, 1)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
            <div className="rounded-2xl border border-dashed border-white/12 bg-black/14 p-4 text-sm leading-6 text-white/64">
              Enter a valid mil reading and target size above zero to show the distance result.
            </div>
          )}
        </Card>

        <Card title="Reticle Setting" subtitle="Quick field note">
          <div className="space-y-3 text-sm leading-6 text-white/76">
            <div className="rounded-2xl surface-soft p-4">
              <p className="font-medium text-accent">Standard MIL</p>
              <p className="mt-1 mono">1 major line = 1 mil</p>
            </div>
            <p>Do not assume 5 mil per line unless your binocular specifically says so.</p>
            <p className="text-white/50">
              Custom scale support can be added later if your reticle uses another pattern.
            </p>
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
          className="flex min-h-14 items-center justify-center rounded-2xl bg-accent-muted px-4 text-base font-semibold text-white"
        >
          Open Guide
        </Link>
      </div>
    </main>
  );
}
