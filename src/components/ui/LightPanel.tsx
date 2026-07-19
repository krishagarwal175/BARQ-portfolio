"use client";

import { useState } from "react";
import { LAMP_PRESETS, lightRig, lightSnippet, type Lamp } from "@/lib/debug";

/**
 * Live controls for the three lamps that light the engraving.
 *
 * Intensity is on a cubic curve rather than linear. With `decay: 2` these
 * lamps span three orders of magnitude — the fill sits at 0.03 while the key,
 * half a metre further out, needs 4.6 for comparable brightness — so a linear
 * slider would put every useful fill value inside its first pixel. Cubing the
 * input spreads the low end across most of the travel where the fine work is,
 * and still reaches 12 at the top.
 */
const KEYS = ["fill", "key", "opposite"] as const;
type LampKey = (typeof KEYS)[number];

/**
 * Ceiling raised from 12 to 60. Two of the three lamps were dialled hard
 * against the old limit, which means the value chosen was the maximum
 * available rather than the one wanted — a slider that saturates is not
 * reporting a preference.
 */
const INTENSITY_MAX = 60;
const toSlider = (intensity: number) => Math.cbrt(intensity / INTENSITY_MAX);
const fromSlider = (v: number) => v ** 3 * INTENSITY_MAX;

function Row({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="grid grid-cols-[2.6rem_1fr_3.6rem] items-center gap-2">
      <span className="text-text-faint">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--border-strong)] accent-[var(--accent)]"
      />
      <span className="text-right tabular-nums text-text">
        {format ? format(value) : value.toFixed(3)}
      </span>
    </label>
  );
}

export function LightPanel() {
  // Mirrors the mutable rig so the inputs stay controlled; every change writes
  // through to the rig, which the lamps read on the next frame.
  const [, bump] = useState(0);
  const [copied, setCopied] = useState(false);

  const set = (key: LampKey, patch: Partial<Lamp>) => {
    Object.assign(lightRig[key], patch);
    bump((n) => n + 1);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lightSnippet());
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — values are on screen */
    }
  };

  return (
    <div className="debug-panel glass glass-sm selectable fixed right-4 top-20 z-[60] max-h-[80vh] w-[21rem] overflow-y-auto p-4 font-mono text-[11px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="uppercase tracking-[0.2em] text-[var(--accent)]">reveal lights</span>
        <button
          onClick={copy}
          className="rounded border border-line px-2 py-1 text-[10px] uppercase tracking-widest text-text-2 transition-colors hover:border-line-strong hover:text-text"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>

      {KEYS.map((key) => {
        const lamp = lightRig[key];
        return (
          <div key={key} className="mb-4 border-t border-line pt-3 first:border-t-0 first:pt-0">
            <div className="mb-2 flex items-center justify-between">
              <span className="uppercase tracking-[0.16em] text-text">{lamp.label}</span>
              <input
                type="color"
                value={lamp.color}
                onChange={(e) => set(key, { color: e.target.value })}
                className="h-5 w-9 cursor-pointer rounded border border-line bg-transparent"
              />
            </div>

            <div className="grid gap-1.5">
              <Row
                label="int"
                min={0}
                max={1}
                step={0.001}
                value={toSlider(lamp.intensity)}
                onChange={(v) => set(key, { intensity: fromSlider(v) })}
                format={() => lamp.intensity.toFixed(3)}
              />
              <Row label="x" min={-1} max={1} step={0.005} value={lamp.x} onChange={(v) => set(key, { x: v })} />
              <Row label="y" min={-0.4} max={0.15} step={0.002} value={lamp.y} onChange={(v) => set(key, { y: v })} />
              <Row label="z" min={-1} max={1} step={0.005} value={lamp.z} onChange={(v) => set(key, { z: v })} />
              <Row label="cut" min={0.1} max={4} step={0.05} value={lamp.distance} onChange={(v) => set(key, { distance: v })} />
            </div>

            {key === "key" && (
              <div className="mt-2 flex flex-wrap gap-1">
                {LAMP_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => set(key, { x: p.x, y: p.y, z: p.z })}
                    className="rounded border border-line px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-text-2 transition-colors hover:border-line-strong hover:text-text"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <p className="border-t border-line pt-3 leading-relaxed text-text-faint">
        y near 0 rakes the plate and shows depth; further down floods it flat.
        intensity is candela with 1/d² falloff, so a far lamp needs far more.
      </p>
    </div>
  );
}
