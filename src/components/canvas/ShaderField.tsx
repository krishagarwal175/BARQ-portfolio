"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import {
  Color,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  RepeatWrapping,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { THEMES } from "@/lib/theme";
import { useApp } from "@/lib/store";
import { damp } from "@/lib/utils";

/**
 * The ambient ember field, rendered inside the scene rather than as a DOM
 * layer behind the canvas.
 *
 * This was three blurred CSS blobs sitting behind a transparent canvas. It
 * looked close, but the background and the robot were lit by two unrelated
 * systems, so the image never quite cohered — the rim light on the legs had no
 * relationship to the glow behind them. Rendered here, the field is part of
 * the same frame: it feeds the bloom pass, sits under the same tone mapping,
 * and its colours are the same tokens that drive the lighting rig.
 *
 * Drawn as a fullscreen triangle with depth testing off and a very low render
 * order, so it is always behind the robot at zero depth cost.
 */

/**
 * drei's ScreenQuad is a fullscreen *triangle* carrying only a 2-component
 * position attribute — it has no uv. ShaderMaterial still declares `uv`, so
 * reading it yields a constant (0,0) and the whole shader collapses to a flat
 * wash. UV is therefore derived from clip space: the triangle spans -1..3, so
 * this maps the visible -1..1 region onto 0..1.
 */
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uRes;
  uniform vec3  uColor1;   // hot core
  uniform vec3  uColor2;   // deep red
  uniform vec3  uColor3;   // secondary ember
  uniform vec3  uGround;   // darkest base
  uniform float uIntensity;
  uniform sampler2D uNoise;

  // -- noise ---------------------------------------------------------------
  // Sampled from a small tiling texture rather than computed. The procedural
  // version cost four sin() per octave and ran on every pixel of a fullscreen
  // quad every frame — at DPR 2 that is tens of millions of transcendentals a
  // frame for a background that changes almost imperceptibly. Three texture
  // fetches produce the same field for a fraction of the work.
  float noise(vec2 p) {
    // Divided by the texture size, so one unit of p is one texel — matching
    // the integer lattice the procedural version walked. Sampling at any
    // higher frequency packs a hundred-plus random texels across the screen
    // and bilinear blending turns them into soft mottling: heavy visible
    // grain instead of the broad, slow gradient this is meant to be.
    return texture2D(uNoise, p * (1.0 / 256.0)).r;
  }

  float fbm(vec2 p) {
    return noise(p) * 0.5 + noise(p * 2.02 + 11.3) * 0.25 + noise(p * 4.07 + 27.1) * 0.125;
  }

  // Soft radial falloff, aspect-corrected so blobs stay round.
  float blob(vec2 uv, vec2 c, float r, float soft) {
    float d = length((uv - c) * vec2(uRes.x / uRes.y, 1.0));
    return 1.0 - smoothstep(r * (1.0 - soft), r, d);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.045;

    // A single noise sample, reused to modulate all three blobs. The drift on
    // the blob centres below supplies the movement that a domain warp would.
    float f = fbm(uv * 2.1 + t);

    // Base: dark at the bottom-left, lifting toward the top-right hotspot.
    vec3 col = uGround;

    // Primary hot core, drifting.
    vec2 c1 = vec2(0.76 + 0.035 * sin(t * 1.7), 0.94 + 0.03 * cos(t * 1.3));
    col = mix(col, uColor1, blob(uv, c1, 1.05, 0.95) * (0.62 + 0.38 * f));

    // Deep red pool, lower left.
    vec2 c2 = vec2(0.16 + 0.03 * cos(t * 1.1), 0.06 + 0.025 * sin(t * 0.9));
    col = mix(col, uColor2, blob(uv, c2, 0.85, 0.95) * (0.5 + 0.4 * f));

    // Secondary ember, centre-right, breathing.
    vec2 c3 = vec2(0.54 + 0.05 * sin(t * 0.8), 0.5 + 0.04 * cos(t * 1.5));
    col = mix(col, uColor3, blob(uv, c3, 0.52, 1.0) * (0.3 + 0.3 * f) * 0.7);

    // Vignette so panels and type always have a ground to sit on.
    float vig = 1.0 - smoothstep(0.35, 1.15, length((uv - 0.5) * vec2(1.25, 1.1)) * 1.6);
    col *= mix(0.42, 1.0, vig);

    // Fine grain — breaks up banding across these very wide gradients.
    // One noise texel per screen pixel. Sampling at any coarser scale
    // magnifies the 256px texture into soft mottled blotches — which reads as
    // heavy grain rather than the fine dither this is for. The offset walks
    // the texture so the pattern never sits still.
    vec2 gUv = (uv * uRes + floor(uTime * 24.0) * 37.0) / 256.0;
    float g = texture2D(uNoise, gUv).g - 0.5;
    col += g * 0.006;

    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

/**
 * A small tiling noise texture, built once. Bilinear filtering plus the three
 * octaves the shader stacks on top make 256px plenty — the field is a soft
 * gradient, not a detail map. Deterministic so it never differs between loads.
 */
function makeNoiseTexture(): DataTexture {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  // mulberry32 — same generator the dust field uses, kept pure for SSR safety.
  let seed = 0x9e3779b9;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = rand() * 255; // r — fbm octaves
    data[i * 4 + 1] = rand() * 255; // g — grain
    data[i * 4 + 2] = rand() * 255;
    data[i * 4 + 3] = 255;
  }
  const tex = new DataTexture(data, size, size, RGBAFormat);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function ShaderField() {
  const { size } = useThree();
  const env = useApp((s) => s.env);
  const theme = THEMES[env];

  const mat = useRef<ShaderMaterial>(null);
  const noise = useMemo(() => makeNoiseTexture(), []);
  useEffect(() => () => noise.dispose(), [noise]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new Vector2(1, 1) },
      uColor1: { value: new Vector3() },
      uColor2: { value: new Vector3() },
      uColor3: { value: new Vector3() },
      // Linear-space #160604. Colour.set() converts to linear working space,
      // so a hand-written base has to be linear too or it reads far too light.
      uGround: { value: new Vector3(0.0077, 0.0018, 0.0012) },
      uIntensity: { value: 1 },
      uNoise: { value: noise },
    }),
    [noise],
  );

  // Scratch colours, so switching environment never allocates in the loop.
  const target = useMemo(
    () => ({ c1: new Color(), c2: new Color(), c3: new Color() }),
    [],
  );

  useFrame((_, delta) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    const dt = Math.min(delta, 0.05);

    if (!useApp.getState().debug) u.uTime.value += dt;
    u.uRes.value.set(size.width, size.height);

    // Ease toward the active environment's field colours, matching the 0.85s
    // token transition the DOM side uses.
    target.c1.set(theme.field1);
    target.c2.set(theme.field2);
    target.c3.set(theme.field3);

    const ease = (v: Vector3, c: Color) => {
      v.x = damp(v.x, c.r, 3, dt);
      v.y = damp(v.y, c.g, 3, dt);
      v.z = damp(v.z, c.b, 3, dt);
    };
    ease(u.uColor1.value as Vector3, target.c1);
    ease(u.uColor2.value as Vector3, target.c2);
    ease(u.uColor3.value as Vector3, target.c3);
  });

  return (
    <ScreenQuad renderOrder={-1000} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </ScreenQuad>
  );
}
