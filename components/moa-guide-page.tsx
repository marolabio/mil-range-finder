"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import {
  MOA_DISTANCE_FACTOR_STORAGE_KEY,
  getMoaQuickReferenceTabs,
  readStoredMoaDistanceFactor,
} from "@/lib/range-finder";

export function MoaGuidePage() {
  const width = 640;
  const height = 176;
  const padding = 22;
  const scaleWidth = width - padding * 2;
  const segmentWidth = scaleWidth / 5;
  const oneMoaX = padding + segmentWidth / 10;
  const [moaDistanceFactor, setMoaDistanceFactor] = useState(() => readStoredMoaDistanceFactor());
  const moaQuickReferenceTabs = useMemo(
    () => getMoaQuickReferenceTabs(moaDistanceFactor),
    [moaDistanceFactor],
  );
  const [activeQuickReferenceTab, setActiveQuickReferenceTab] = useState(
    () => getMoaQuickReferenceTabs(readStoredMoaDistanceFactor())[0]?.id ?? "",
  );

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key === MOA_DISTANCE_FACTOR_STORAGE_KEY) {
        setMoaDistanceFactor(readStoredMoaDistanceFactor());
      }
    }

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const selectedQuickReferenceTab =
    moaQuickReferenceTabs.find((tab) => tab.id === activeQuickReferenceTab) ??
    moaQuickReferenceTabs[0];

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

        <Card title="Reticle Demo" subtitle="Half mark, then bold 10 MOA steps">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/24 p-3">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full"
                role="img"
                aria-label="MOA reticle demo scale"
              >
                <line
                  x1={padding}
                  y1={70}
                  x2={width - padding}
                  y2={70}
                  stroke="rgba(240,245,234,0.92)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={padding}
                  y1={26}
                  x2={oneMoaX}
                  y2={26}
                  stroke="rgba(236,241,230,0.78)"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={padding}
                  y1={18}
                  x2={padding}
                  y2={34}
                  stroke="rgba(236,241,230,0.78)"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={oneMoaX}
                  y1={18}
                  x2={oneMoaX}
                  y2={34}
                  stroke="rgba(236,241,230,0.78)"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={(padding + oneMoaX) / 2}
                  y={14}
                  fill="rgba(236,241,230,0.92)"
                  fontSize="14"
                  fontFamily="IBM Plex Mono, monospace"
                  textAnchor="middle"
                >
                  1 MOA
                </text>
                {Array.from({ length: 5 }, (_, index) => {
                  const startX = padding + segmentWidth * index;
                  const midX = startX + segmentWidth / 2;
                  const majorX = startX + segmentWidth;
                  const labelValue = (index + 1) * 10;

                  return (
                    <g key={`segment-${labelValue}`}>
                      <line
                        x1={midX}
                        y1={46}
                        x2={midX}
                        y2={94}
                        stroke="rgba(240,245,234,0.7)"
                        strokeWidth="1.8"
                        vectorEffect="non-scaling-stroke"
                      />
                      <line
                        x1={majorX}
                        y1={36}
                        x2={majorX}
                        y2={108}
                        stroke="rgba(159,194,103,1)"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                      <text
                        x={majorX}
                        y={144}
                        fill="rgba(236,241,230,0.92)"
                        fontSize="18"
                        fontFamily="IBM Plex Mono, monospace"
                        textAnchor="middle"
                      >
                        {labelValue}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="rounded-2xl surface-soft p-4 text-sm leading-6 text-white/78">
              <p className="font-medium text-accent">Pattern: small line, then big line at every 10 MOA</p>
              <p className="mt-1">
                The marker at the top shows what `1 MOA` looks like. Each bold tick below is the next
                `10 MOA` reference on your reticle, with the lighter tick at the halfway point.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Quick Method" subtitle="Fast field estimate">
          <div className="space-y-3 text-sm leading-6 text-white/78">
            <p className="font-medium text-amber-200">
              Custom calibration: this MOA scale is tuned to your reticle, not standard true-angle MOA.
            </p>
            <p>
              This calculator is calibrated to your reticle test where a `10 cm` target at `10 m`
              reads `{moaDistanceFactor} MOA`. For quick mental math, use:
            </p>
            <div className="rounded-2xl border border-white/8 bg-black/24 p-4 mono text-sm text-accent">
              Distance (m) ~= Size (cm) x {moaDistanceFactor} / MOA
            </div>
            <p>
              That makes the field formula match the homepage calculator exactly for your current
              MOA reticle scale. Change it on the homepage and this guide will follow the same saved
              setting.
            </p>
          </div>
        </Card>

        <Card title="Quick Reference">
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto rounded-2xl bg-black/18 p-2">
              {moaQuickReferenceTabs.map((tab) => {
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
