"use client";

import { useEffect } from "react";

/**
 * Keeps `backdrop-filter` switched on only for the glass panes actually on
 * screen.
 *
 * This is the single biggest win available on this page. A backdrop filter has
 * to re-sample and re-blur whatever sits behind the element every time that
 * backdrop changes — and behind every pane here is a WebGL canvas repainting
 * continuously. So all ~40 panes pay a full-frame blur forever, including the
 * thirty-odd that are nowhere near the viewport.
 *
 * An IntersectionObserver marks the off-screen ones, and CSS drops their
 * filter. Nothing is looking at them, so it is invisible; the translucent fill
 * stays put so nothing pops as a pane scrolls back in. A generous rootMargin
 * means the filter is always restored well before a pane becomes visible.
 *
 * A MutationObserver picks up panes that mount later — the teardown spec card,
 * the pose readout, anything behind AnimatePresence.
 */
export function GlassBudget() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          (e.target as HTMLElement).dataset.offscreen = String(!e.isIntersecting);
        }
      },
      // Restore a full viewport early, so the filter is never seen switching on.
      { rootMargin: "100% 0px 100% 0px" },
    );

    const seen = new WeakSet<Element>();
    const scan = () => {
      for (const el of document.querySelectorAll(".glass")) {
        if (seen.has(el)) continue;
        seen.add(el);
        (el as HTMLElement).dataset.offscreen = "true";
        io.observe(el);
      }
    };

    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
