"use client";

import { useEffect } from "react";
import { debugRequested } from "@/lib/debug";
import { DebugPanel } from "@/components/ui/DebugPanel";
import { LightPanel } from "@/components/ui/LightPanel";
import { useApp } from "@/lib/store";

/**
 * Turns free-camera debug mode on when `?debug` is present. Kept out of the
 * canvas so the panel is plain DOM, and gated on the URL so it can never ship
 * on by accident.
 */
export function DebugGate() {
  const debug = useApp((s) => s.debug);
  const setDebug = useApp((s) => s.setDebug);

  useEffect(() => {
    if (debugRequested()) setDebug(true);
  }, [setDebug]);

  // Marks the document so CSS can lift the canvas above the interface and
  // stop the DOM swallowing every drag. Without this the controls are mounted
  // but unreachable — the page content is layered on top of them.
  useEffect(() => {
    const root = document.documentElement;
    if (debug) root.dataset.debug = "1";
    else delete root.dataset.debug;
    return () => {
      delete root.dataset.debug;
    };
  }, [debug]);

  if (!debug) return null;
  return (
    <>
      <DebugPanel />
      <LightPanel />
    </>
  );
}
