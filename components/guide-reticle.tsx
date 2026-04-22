"use client";

import type { HelperMode } from "@/lib/range-finder";

type GuideReticleProps = {
  mode: HelperMode;
  onModeChange: (mode: HelperMode) => void;
  unitLabel?: string;
  helperDescriptions?: Record<HelperMode, string>;
};

const defaultHelperDescriptions: Record<HelperMode, string> = {
  "1.0": "Major lines only.",
  "0.5": "Adds half-unit marks.",
  "0.2": "Adds 0.2 unit marks.",
};

export function GuideReticle({
  mode,
  onModeChange,
  unitLabel = "mil",
  helperDescriptions = defaultHelperDescriptions,
}: GuideReticleProps) {
  const subdivisions = mode === "1.0" ? 1 : mode === "0.5" ? 2 : 5;
  const width = 640;
  const height = 148;
  const padding = 22;
  const scaleWidth = width - padding * 2;
  const majorStep = scaleWidth / 10;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/18 p-2">
        {(["1.0", "0.5", "0.2"] as HelperMode[]).map((option) => {
          const active = option === mode;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onModeChange(option)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                active ? "bg-accent text-[#182015]" : "bg-transparent text-white/72"
              }`}
            >
              {option} {unitLabel} view
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-black/24 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={`${unitLabel.toUpperCase()} reticle demo scale`}
        >
          <line
            x1={padding}
            y1={54}
            x2={width - padding}
            y2={54}
            stroke="rgba(240,245,234,0.92)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {Array.from({ length: 11 }, (_, index) => {
            const x = padding + majorStep * index;

            return (
              <line
                key={`major-${index}`}
                x1={x}
                y1={24}
                x2={x}
                y2={92}
                stroke="rgba(159,194,103,1)"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {Array.from({ length: 10 }, (_, block) =>
            Array.from({ length: subdivisions - 1 }, (_, minorIndex) => {
              const fraction = (minorIndex + 1) / subdivisions;
              const x = padding + majorStep * (block + fraction);
              const isHalf = Math.abs(fraction - 0.5) < 0.001;
              const lineHeight = isHalf ? 64 : 54;

              return (
                <line
                  key={`minor-${block}-${minorIndex}`}
                  x1={x}
                  y1={54 - lineHeight / 2}
                  x2={x}
                  y2={54 + lineHeight / 2}
                  stroke="rgba(240,245,234,0.7)"
                  strokeWidth={isHalf ? 2 : 1.5}
                  vectorEffect="non-scaling-stroke"
                />
              );
            }),
          )}
          {Array.from({ length: 10 }, (_, index) => {
            const labelX = padding + majorStep * index + majorStep / 2;

            return (
              <text
                key={`label-${index + 1}`}
                x={labelX}
                y={128}
                fill="rgba(236,241,230,0.92)"
                fontSize="18"
                fontFamily="IBM Plex Mono, monospace"
                textAnchor="middle"
              >
                {index + 1}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="rounded-2xl surface-soft p-4 text-sm leading-6 text-white/78">
        <p className="font-medium text-accent">Default: 1 major line = 1 {unitLabel}</p>
        <p className="mt-1">{helperDescriptions[mode]}</p>
      </div>
    </div>
  );
}
