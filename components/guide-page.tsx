"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/card";
import { GuideReticle } from "@/components/guide-reticle";
import {
  GUIDE_MODE_STORAGE_KEY,
  guideExamples,
  quickReferenceRows,
  readStoredJson,
  type HelperMode,
} from "@/lib/range-finder";

const tips = [
  "Measure the visible part of the target as consistently as possible.",
  "Side view versus front view changes the apparent size of the target.",
  "Small reading errors create larger distance errors on very small targets.",
  "Use 5 cm or 6 cm presets for quick head estimates.",
  "Use 10 cm, 20 cm, 25 cm, and 30 cm presets for practice targets.",
];

export function GuidePage() {
  const [mode, setMode] = useState<HelperMode>(() => {
    if (typeof window === "undefined") {
      return "1.0";
    }

    return readStoredJson<HelperMode>(GUIDE_MODE_STORAGE_KEY, "1.0");
  });

  function handleModeChange(nextMode: HelperMode) {
    setMode(nextMode);
    window.localStorage.setItem(GUIDE_MODE_STORAGE_KEY, JSON.stringify(nextMode));
  }

  return (
    <main className="flex-1 py-6 sm:py-10">
      <div className="app-shell space-y-4 sm:space-y-5">
        <Card title="MIL Guide" subtitle="How to read mils and estimate distance">
          <div className="rounded-2xl surface-soft p-4 text-sm leading-6 text-white/78">
            Learn the reticle spacing, estimate how much of the target the mil scale covers, and
            keep your calculator assumptions consistent in the field.
          </div>
        </Card>

        <Card title="Reticle Demo" subtitle="Standard MIL scale from 1 to 10 mil">
          <GuideReticle mode={mode} onModeChange={handleModeChange} />
        </Card>

        <Card title="Basics" subtitle="The core idea behind MIL ranging">
          <div className="space-y-3 text-sm leading-6 text-white/78">
            <p>1 mil means about 1 meter at 1000 meters.</p>
            <p>Estimate how many mils the target spans in your binocular reticle.</p>
            <p>Use the target&apos;s known size in centimeters.</p>
            <div className="rounded-2xl border border-white/8 bg-black/24 p-4 mono text-sm text-accent">
              Distance (m) = Size (cm) x 10 / mil
            </div>
          </div>
        </Card>

        <Card title="Examples" subtitle="Tap any example to open it in the calculator">
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

        <Card title="Reading Tips" subtitle="Keep your measurements consistent">
          <div className="space-y-2">
            {tips.map((tip) => (
              <div key={tip} className="rounded-2xl bg-black/18 px-4 py-3 text-sm leading-6 text-white/78">
                {tip}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Reticle Settings" subtitle="Start with the standard layout unless your optic says otherwise">
          <div className="space-y-3 text-sm leading-6 text-white/78">
            <div className="rounded-2xl surface-soft p-4">
              <p className="font-medium text-accent">Standard MIL: 1 major line = 1 mil</p>
            </div>
            <p>Custom scale is reserved as a future support option.</p>
            <p className="danger">
              Some binocular reticles may be labeled differently. Confirm your reticle before
              relying on the reading.
            </p>
          </div>
        </Card>

        <Card title="Field Note">
          <div className="space-y-2 text-sm leading-6 text-white/76">
            <p className="font-medium text-accent">Standard MIL</p>
            <p className="mono">1 major line = 1 mil</p>
            <p>Do not assume 5 mil per line unless your binocular specifically says so.</p>
          </div>
        </Card>

        <Card title="Quick Reference" subtitle="Compact cheat sheet for common sizes">
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
