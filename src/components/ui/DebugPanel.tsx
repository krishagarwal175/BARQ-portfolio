"use client";

import { useEffect, useState } from "react";
import { camReadout, readoutSnippet, type CamReadout } from "@/lib/debug";

/**
 * Live camera coordinates, for finding a shot by hand.
 *
 * Sampled on a timer rather than per frame — the values change sixty times a
 * second but nobody can read them that fast, and re-rendering this panel at
 * frame rate would cost more than the scene it is measuring.
 */
const ROWS: { label: string; get: (r: CamReadout) => string; hint?: string }[] = [
  { label: "azimuth", get: (r) => r.azimuth.toFixed(5), hint: "rad" },
  { label: "elevation", get: (r) => r.elevation.toFixed(5), hint: "rad" },
  { label: "distance", get: (r) => r.distance.toFixed(5), hint: "m" },
  { label: "fov", get: (r) => r.fov.toFixed(2), hint: "deg" },
  { label: "fill", get: (r) => r.fill.toFixed(5), hint: "panel in frame" },
  { label: "shift x", get: (r) => r.shiftX.toFixed(5), hint: "m" },
  { label: "shift y", get: (r) => r.shiftY.toFixed(5), hint: "m" },
  { label: "shift z", get: (r) => r.shiftZ.toFixed(5), hint: "m" },
  { label: "pos x", get: (r) => r.px.toFixed(5) },
  { label: "pos y", get: (r) => r.py.toFixed(5) },
  { label: "pos z", get: (r) => r.pz.toFixed(5) },
  { label: "tgt x", get: (r) => r.tx.toFixed(5) },
  { label: "tgt y", get: (r) => r.ty.toFixed(5) },
  { label: "tgt z", get: (r) => r.tz.toFixed(5) },
];

export function DebugPanel() {
  const [, force] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 120);
    return () => clearInterval(id);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(readoutSnippet(camReadout));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — the numbers are on screen regardless */
    }
  };

  return (
    <div className="debug-panel glass glass-sm selectable fixed left-4 top-20 z-[60] w-[21rem] p-4 font-mono text-[11px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="uppercase tracking-[0.2em] text-[var(--accent)]">camera debug</span>
        <button
          onClick={copy}
          className="rounded border border-line px-2 py-1 text-[10px] uppercase tracking-widest text-text-2 transition-colors hover:border-line-strong hover:text-text"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>

      <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1">
        {ROWS.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-text-faint">{row.label}</dt>
            <dd className="tabular-nums text-text">
              {row.get(camReadout)}
              {row.hint && <span className="ml-1.5 text-text-faint">{row.hint}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 border-t border-line pt-3 leading-relaxed text-text-faint">
        drag orbit · scroll zoom · right-drag pan
        <br />
        hold <span className="text-text-2">alt</span> for 10× finer,{" "}
        <span className="text-text-2">alt+shift</span> for 100×
        <br />
        all idle motion is frozen while debugging
      </p>
    </div>
  );
}
