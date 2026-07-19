"use client";

import { useEffect } from "react";
import { THEMES } from "@/lib/theme";
import { useApp } from "@/lib/store";

// Map token keys to their CSS custom-property names.
const VARS: Record<string, string> = {
  bg: "--bg",
  surface: "--surface",
  surfaceEl: "--surface-el",
  overlay: "--overlay",
  text: "--text",
  text2: "--text-2",
  textMuted: "--text-muted",
  accent: "--accent",
  success: "--success",
  warning: "--warning",
  selection: "--selection",
  hover: "--hover",
  active: "--active",
  border: "--border",
  borderStrong: "--border-strong",
  glow: "--glow",
  shadow: "--shadow",
  field1: "--field-1",
  field2: "--field-2",
  field3: "--field-3",
};

/**
 * Projects the active environment's theme tokens onto the document root. Because
 * the tokens are registered @property colors with a transition on :root, every
 * element that reads them animates in unison — the whole interface shifts into
 * the environment's "operating mode" over ~0.85s.
 */
export function ThemeController() {
  const env = useApp((s) => s.env);

  useEffect(() => {
    const theme = THEMES[env];
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(VARS)) {
      root.style.setProperty(cssVar, theme[key as keyof typeof theme] as string);
    }
    root.dataset.scheme = theme.scheme;
    root.style.colorScheme = theme.scheme;
  }, [env]);

  return null;
}
