import type { EnvId } from "@/lib/store";

/**
 * A complete semantic token set. Every environment supplies one; the whole
 * interface reads these CSS variables, so switching environment re-themes the
 * entire UI — not just the 3D background.
 *
 * The identity is fixed and warm: white ink on a deep ember ground, glass
 * mixed from a dark warm brown, hairline white edges. Environments no longer
 * swing between light and dark chrome — they shift the accent and the ambient
 * field behind the canvas, and nothing else. That keeps every glass panel
 * legible no matter which scene is loaded, which is the whole reason the
 * palette is centralised here.
 */
export interface ThemeTokens {
  bg: string;
  surface: string;
  surfaceEl: string; // elevated surface
  overlay: string;
  text: string;
  text2: string; // secondary
  textMuted: string;
  accent: string;
  success: string;
  warning: string;
  selection: string;
  hover: string;
  active: string;
  border: string;
  borderStrong: string;
  glow: string; // accent glow (rgba)
  shadow: string; // ambient shadow (rgba)
  /** The three ambient field blobs painted behind the canvas. */
  field1: string;
  field2: string;
  field3: string;
  /** UI mood: dark chrome or light chrome (drives a few conditional styles). */
  scheme: "dark" | "light";
}

/** Everything that does not change between environments. */
const BASE = {
  bg: "#120503",
  surface: "rgba(14,6,4,0.42)",
  surfaceEl: "rgba(30,12,8,0.52)",
  overlay: "rgba(14,6,4,0.62)",
  text: "#ffffff",
  text2: "rgba(255,255,255,0.74)",
  textMuted: "rgba(255,255,255,0.52)",
  hover: "rgba(255,255,255,0.07)",
  active: "rgba(255,255,255,0.14)",
  border: "rgba(255,255,255,0.16)",
  borderStrong: "rgba(255,255,255,0.34)",
  shadow: "rgba(0,0,0,0.60)",
  scheme: "dark",
} satisfies Partial<ThemeTokens>;

export const THEMES: Record<EnvId, ThemeTokens> = {
  // The signature: the ember field from the glass reference.
  studio: {
    ...BASE,
    accent: "#ff8a20",
    success: "#ffb020",
    warning: "#ff7a14",
    selection: "#ff8a20",
    glow: "rgba(255,138,32,0.50)",
    field1: "#ff7a14",
    field2: "#d62e07",
    field3: "#ff6a12",
  },
  research: {
    ...BASE,
    accent: "#ffa53d",
    success: "#ffc44d",
    warning: "#ff8a20",
    selection: "#ffa53d",
    glow: "rgba(255,165,61,0.45)",
    field1: "#ff9430",
    field2: "#c9420f",
    field3: "#ffb04a",
  },
  concrete: {
    ...BASE,
    accent: "#ff7a1a",
    success: "#ffb020",
    warning: "#ffcf3a",
    selection: "#ff7a1a",
    glow: "rgba(255,122,26,0.46)",
    field1: "#e8631a",
    field2: "#a82004",
    field3: "#ff7a14",
  },
  grass: {
    ...BASE,
    accent: "#ffab40",
    success: "#e8b04b",
    warning: "#ffcf3a",
    selection: "#ffab40",
    glow: "rgba(255,171,64,0.42)",
    field1: "#e07b1c",
    field2: "#8f3a06",
    field3: "#ffa02e",
  },
  warehouse: {
    ...BASE,
    accent: "#ffab40",
    success: "#ffca4d",
    warning: "#ffd27a",
    selection: "#ffab40",
    glow: "rgba(255,171,64,0.40)",
    field1: "#d9691a",
    field2: "#7a1c03",
    field3: "#ff8f24",
  },
  night: {
    ...BASE,
    accent: "#ff6a12",
    success: "#ffb020",
    warning: "#ffcf3a",
    selection: "#ff6a12",
    glow: "rgba(255,106,18,0.48)",
    field1: "#c2500e",
    field2: "#5a1002",
    field3: "#e0600f",
  },
  blueprint: {
    ...BASE,
    accent: "#ffc46b",
    success: "#ffd27a",
    warning: "#ffe0a0",
    selection: "#ffc46b",
    glow: "rgba(255,196,107,0.44)",
    field1: "#ffa53d",
    field2: "#b8420c",
    field3: "#ff8a20",
  },
};

export const TOKEN_KEYS = Object.keys(THEMES.studio).filter(
  (k) => k !== "scheme",
) as (keyof Omit<ThemeTokens, "scheme">)[];
