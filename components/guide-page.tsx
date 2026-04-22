"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Card } from "@/components/card";
import { GuideReticle } from "@/components/guide-reticle";
import {
  GUIDE_MODE_STORAGE_KEY,
  quickReferenceTabs,
  readStoredJson,
  type HelperMode,
} from "@/lib/range-finder";

const milHelperDescriptions: Record<HelperMode, string> = {
  "1.0": "Major lines only.",
  "0.5": "Adds half-mil marks.",
  "0.2": "Adds 0.2 mil marks.",
};

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
  const [activeQuickReferenceTab, setActiveQuickReferenceTab] = useState(quickReferenceTabs[0]?.id ?? "");
  const mode = modeOverride ?? storedMode;
  const selectedQuickReferenceTab =
    quickReferenceTabs.find((tab) => tab.id === activeQuickReferenceTab) ?? quickReferenceTabs[0];

  function handleModeChange(nextMode: HelperMode) {
    setModeOverride(nextMode);
    window.localStorage.setItem(GUIDE_MODE_STORAGE_KEY, JSON.stringify(nextMode));
  }

  return (
    <main className="flex-1 pt-0 pb-6 sm:pb-10">
      <div className="app-shell space-y-4 sm:space-y-5">
        <Link
          href="/"
          className="ui-button ui-button-secondary inline-flex min-h-0 items-center gap-1.5 px-3 py-1.5 text-sm no-underline"
        >
          <span aria-hidden="true">&lt;</span>
          <span>Back</span>
        </Link>

        <Card title="MIL Guide" subtitle="Read mils and estimate distance fast">
          <div className="space-y-3 text-sm leading-6 text-white/78">
            <p>Use the reticle to see how many mils the target covers.</p>
            <p>Know the real target size in centimeters.</p>
            <p>Put both into the formula to estimate distance.</p>
            <div className="rounded-2xl border border-white/8 bg-black/24 p-4 mono text-sm text-accent">
              Distance (m) = Size (cm) x 10 / mil
            </div>
          </div>
        </Card>

        <Card title="Reticle Demo" subtitle="Standard 1 to 10 mil scale">
          <GuideReticle
            mode={mode}
            onModeChange={handleModeChange}
            unitLabel="mil"
            helperDescriptions={milHelperDescriptions}
          />
        </Card>

        <Card title="Quick Reference">
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto rounded-2xl bg-black/18 p-2">
              {quickReferenceTabs.map((tab) => {
                const isActive = tab.id === selectedQuickReferenceTab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveQuickReferenceTab(tab.id)}
                    className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? "bg-accent text-[#182015]" : "text-white/72"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
            {selectedQuickReferenceTab.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/18 px-4 py-3"
              >
                <p className="text-sm text-white/76">{row.label}</p>
                <p className="mono text-sm text-accent">{row.result}</p>
              </div>
            ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
