/**
 * Live camera readout, shared between the canvas and the DOM panel.
 *
 * A plain mutable object rather than store state on purpose: these numbers
 * change every frame, and pushing them through the store would re-render the
 * whole tree sixty times a second just to print them. The canvas writes here,
 * the panel samples on a timer.
 */
export interface CamReadout {
  /** World-space camera position. */
  px: number;
  py: number;
  pz: number;
  /** World-space look-at target. */
  tx: number;
  ty: number;
  tz: number;
  /** Orbit angles about the target, matching `orbitDir` in camera-keyframes. */
  azimuth: number;
  elevation: number;
  distance: number;
  fov: number;
  /**
   * Target relative to the bottom-centre of base_link — i.e. exactly the
   * REVEAL_SHIFT needed to point the opening shot at whatever you framed.
   */
  shiftX: number;
  shiftY: number;
  shiftZ: number;
  /** Share of the underside panel's long axis currently in frame. */
  fill: number;
}

export const camReadout: CamReadout = {
  px: 0, py: 0, pz: 0,
  tx: 0, ty: 0, tz: 0,
  azimuth: 0,
  elevation: 0,
  distance: 0,
  fov: 0,
  shiftX: 0, shiftY: 0, shiftZ: 0,
  fill: 0,
};

/** Debug mode is opt-in via `?debug` so it can never ship on by accident. */
export function debugRequested(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("debug");
}

/** The block to paste back into camera-keyframes / CameraRig. */
export function readoutSnippet(r: CamReadout): string {
  const n = (v: number, d = 5) => v.toFixed(d);
  return [
    `const REVEAL_AZIMUTH = ${n(r.azimuth)};`,
    `const REVEAL_ELEVATION = ${n(r.elevation)};`,
    `const REVEAL_FILL = ${n(r.fill)};`,
    `const REVEAL_SHIFT: [number, number, number] = [${n(r.shiftX)}, ${n(r.shiftY)}, ${n(r.shiftZ)}];`,
    ``,
    `// or as a raw CamFrame:`,
    `{ azimuth: ${n(r.azimuth)}, elevation: ${n(r.elevation)}, fov: ${n(r.fov, 2)}, margin: 1.0, targetOffset: [${n(r.shiftX)}, ${n(r.shiftY)}, ${n(r.shiftZ)}] }`,
  ].join("\n");
}


/* ------------------------------------------------------------------------ */
/*  Reveal lighting rig                                                     */
/*                                                                          */
/*  Live-editable parameters for the three lamps that light the engraving.  */
/*  Offsets are metres from the mark; intensity is candela, which with       */
/*  decay 2 means irradiance falls as I/d² — so a lamp half a metre out      */
/*  needs a hundred times the value of one sitting 50 mm away. The panel     */
/*  writes here and RevealLight reads it every frame, so the defaults below  */
/*  are also what ships.                                                    */
/* ------------------------------------------------------------------------ */
export interface Lamp {
  label: string;
  x: number;
  y: number;
  z: number;
  intensity: number;
  color: string;
  distance: number;
}

export const lightRig: Record<"fill" | "key" | "opposite", Lamp> = {
  // Dialled by hand against the engraving. The fill sits *above* the mark on a
  // very short throw (0.15 m cutoff), so it pools on the plate rather than
  // spilling into the scene; the key and its counter-light both rake from the
  // -Z side, warm against a deep red counter.
  fill: { label: "Fill", x: -0.045, y: 0.05, z: 0.075, intensity: 0.598, color: "#ffffff", distance: 0.15 },
  key: { label: "Key · right", x: -0.02, y: -0.01, z: -0.215, intensity: 12, color: "#ff6a00", distance: 3.05 },
  opposite: { label: "Opposite", x: -0.025, y: -0.122, z: -0.885, intensity: 12, color: "#7c2a00", distance: 2 },
};

/** Canonical raking positions, for trying a direction without dragging. */
export const LAMP_PRESETS: { name: string; x: number; y: number; z: number }[] = [
  { name: "right", x: 0.46, y: -0.012, z: 0.02 },
  { name: "left", x: -0.46, y: -0.012, z: 0.02 },
  { name: "front", x: 0.02, y: -0.012, z: 0.46 },
  { name: "back", x: 0.02, y: -0.012, z: -0.46 },
  { name: "hi right", x: 0.34, y: -0.09, z: 0.14 },
  { name: "under", x: 0.02, y: -0.16, z: 0.02 },
];

export function lightSnippet(): string {
  const f = lightRig.fill;
  const k = lightRig.key;
  const o = lightRig.opposite;
  const n = (v: number) => v.toFixed(4);
  return [
    "// intensities",
    `f.intensity = amount * ${n(f.intensity)};`,
    `g.intensity = amount * ${n(k.intensity)};`,
    `r.intensity = amount * ${n(o.intensity)};`,
    "",
    "// positions, relative to the mark",
    `f.position.set(mark.current.x + ${n(f.x)}, mark.current.y + ${n(f.y)}, mark.current.z + ${n(f.z)});`,
    `g.position.set(mark.current.x + ${n(k.x)}, mark.current.y + ${n(k.y)}, mark.current.z + ${n(k.z)});`,
    `r.position.set(mark.current.x + ${n(o.x)}, mark.current.y + ${n(o.y)}, mark.current.z + ${n(o.z)});`,
    "",
    "// colours / falloff cutoff",
    `fill      color="${f.color}" distance={${f.distance}}`,
    `key       color="${k.color}" distance={${k.distance}}`,
    `opposite  color="${o.color}" distance={${o.distance}}`,
  ].join("\n");
}
