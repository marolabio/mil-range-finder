"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Card } from "@/components/card";
import { GuideReticle } from "@/components/guide-reticle";
import {
  GUIDE_MODE_STORAGE_KEY,
  guideExamples,
  quickReferenceRows,
  readStoredJson,
  type HelperMode,
} from "@/lib/range-finder";

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
  };
}

export function GuidePage() {
  const storedMode = useSyncExternalStore<HelperMode>(
    subscribeToStorage,
    () => readStoredJson<HelperMode>(GUIDE_MODE_STORAGE_KEY, "1.0"),
    () => "1.0",
  );
  const [modeOverride, setModeOverride] = useState<HelperMode | null>(null);
  const mode = modeOverride ?? storedMode;

  function handleModeChange(nextMode: HelperMode) {
    setModeOverride(nextMode);
    window.localStorage.setItem(GUIDE_MODE_STORAGE_KEY, JSON.stringify(nextMode));
  }

  return (
    <main className="flex-1 py-6 sm:py-10">
      <div className="app-shell space-y-4 sm:space-y-5">
        <Card title="MIL Guide" subtitle="Read mils. Estimate distance.">
          <div className="rounded-2xl surface-soft p-4 text-sm leading-6 text-white/78">
            Use the reticle, estimate target size, and plug the numbers into the calculator.
          </div>
        </Card>

        <Card title="Reticle Demo" subtitle="Standard 1 to 10 mil scale">
          <GuideReticle mode={mode} onModeChange={handleModeChange} />
        </Card>

        <Card title="Basics" subtitle="MIL ranging in short">
          <div className="space-y-3 text-sm leading-6 text-white/78">
            <p>1 mil is about 1 meter at 1000 meters.</p>
            <p>Measure how many mils the target covers.</p>
            <p>Use the known target size in centimeters.</p>
            <div className="rounded-2xl border border-white/8 bg-black/24 p-4 mono text-sm text-accent">
              Distance (m) = Size (cm) x 10 / mil
            </div>
          </div>
        </Card>

        <Card title="Examples" subtitle="Tap to load in the calculator">
          <div className="space-y-2">
            {guideExamples.map((example) => (
              <Link
                key={`${example.label}-${example.mil}`}
                href={`/?label=${encodeURIComponent(example.label)}&size=${example.sizeCm}&mil=${example.mil}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/18 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{example.label}</p>
                  <p className="mt-1 text-sm text-white/60">
                    {example.sizeCm} cm at {example.mil} mil
                  </p>
                </div>
                <p className="mono text-accent">{example.resultMeters} m</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Reticle Settings" subtitle="Use the standard layout unless marked otherwise">
          <div className="space-y-3 text-sm leading-6 text-white/78">
            <div className="rounded-2xl surface-soft p-4">
              <p className="font-medium text-accent">Standard MIL: 1 major line = 1 mil</p>
            </div>
            <p>Custom scale is not supported yet.</p>
            <p className="danger">Check your reticle markings before using the reading.</p>
          </div>
        </Card>

        <Card title="Field Note">
          <div className="space-y-2 text-sm leading-6 text-white/76">
            <p className="font-medium text-accent">Standard MIL</p>
            <p className="mono">1 major line = 1 mil</p>
            <p>Do not assume 5 mil per line unless your binocular says so.</p>
          </div>
        </Card>

        <Card title="Quick Reference" subtitle="Common size and distance pairs">
          <div className="space-y-2">
            {quickReferenceRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/18 px-4 py-3"
              >
                <p className="text-sm text-white/76">{row.label}</p>
                <p className="mono text-sm text-accent">{row.result}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            className="flex min-h-14 items-center justify-center rounded-2xl bg-accent px-4 text-base font-semibold text-[#182015]"
          >
            Open Calculator
          </Link>
          <Link
            href="/"
            className="flex min-h-14 items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 text-base font-medium text-white"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
