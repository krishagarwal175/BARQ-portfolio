"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import { CanvasTexture, LinearFilter, ShaderMaterial, Vector2 } from "three";
import { useApp } from "@/lib/store";
import { damp } from "@/lib/utils";

/**
 * Display type rendered *inside* the scene, between the ambient field and the
 * robot — so the robot occludes it and it feeds the bloom pass.
 *
 * The hero sets BARQ solid; every chapter after it sets its own word as an
 * outline. That difference is deliberate: a second solid word would compete
 * with the hero and flatten the page, whereas a hairline outline reads as a
 * technical annotation the machine is standing in front of. Same device, lower
 * volume.
 *
 * Type is drawn to a 2D canvas and uploaded as a texture rather than loaded as
 * an SDF atlas — Manrope is already loaded by next/font, so this costs no
 * extra request and no font asset in the repo. Textures are cached per word.
 *
 * The accessible headings live in the DOM; everything here is decorative.
 */

const TEX_W = 4096;
const TEX_H = 2048;

type Style = "solid" | "outline";

/**
 * Section index → the word standing behind the robot, and where it sits.
 *
 * Composition, not centring. A word dropped dead-centre reads as decoration
 * dumped behind the subject; these are sized down and pushed into whichever
 * half of the frame the section's panel does not occupy, so the word, the
 * panel and the robot each own their own space. `offset` is in texture units
 * (+x right, +y up) and `fill` is the share of the texture width the type
 * spans — chapter words are set smaller than the hero on purpose, so there is
 * room to place them at all.
 */
const WORDS: Record<
  number,
  { word: string; style: Style; fill: number; offset: [number, number] }
> = {
  // Hero: dead centre is right, the robot stands inside its own name.
  0: { word: "BARQ", style: "solid", fill: 0.84, offset: [0, 0] },
  // Panel left → word pushed right.
  1: { word: "KINEMATICS", style: "outline", fill: 0.6, offset: [0.16, -0.05] },
  // Panel right → word pushed left.
  2: { word: "ACTUATION", style: "outline", fill: 0.6, offset: [-0.16, -0.05] },
  3: { word: "STRUCTURE", style: "outline", fill: 0.6, offset: [0.16, -0.05] },
  // Teardown: part list runs down the left, so word sits high and right.
  4: { word: "TEARDOWN", style: "outline", fill: 0.62, offset: [0.12, 0.08] },
};

function paint(word: string, style: Style, fill: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const cx = TEX_W / 2;
  const cy = TEX_H / 2;

  // ---- guides, hero only: dashed frame, dotted circle, registration ticks --
  if (style === "solid") {
    const guide = Math.min(TEX_W, TEX_H) * 0.42;
    ctx.strokeStyle = "rgba(255,255,255,0.30)";
    ctx.lineWidth = 3;

    ctx.setLineDash([26, 26]);
    ctx.strokeRect(cx - guide, cy - guide, guide * 2, guide * 2);

    ctx.setLineDash([8, 30]);
    ctx.beginPath();
    ctx.arc(cx, cy, guide * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 4;
    const tick = guide * 0.09;
    ctx.beginPath();
    ctx.moveTo(cx, cy - guide + tick * 0.4);
    ctx.lineTo(cx, cy - guide + tick * 1.4);
    ctx.moveTo(cx, cy + guide - tick * 1.4);
    ctx.lineTo(cx, cy + guide - tick * 0.4);
    ctx.moveTo(cx - guide + tick * 0.4, cy);
    ctx.lineTo(cx - guide + tick * 1.4, cy);
    ctx.moveTo(cx + guide - tick * 1.4, cy);
    ctx.lineTo(cx + guide - tick * 0.4, cy);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(cx + guide * 0.82, cy - guide * 0.82, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- the word, fitted to a share of the texture width --------------------
  let px = 900;
  ctx.font = `800 ${px}px Manrope, system-ui, sans-serif`;
  px = px * ((TEX_W * fill) / ctx.measureText(word).width);

  ctx.font = `800 ${px}px Manrope, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (style === "solid") {
    // One restrained warm halo, then the face. The face stays below pure
    // white: Bloom thresholds at 0.72 luminance and a full-white word this
    // large washes out the robot standing in front of it.
    ctx.shadowColor = "rgba(255,138,32,0.8)";
    ctx.shadowBlur = 70;
    ctx.fillStyle = "rgba(246,232,218,0.88)";
    ctx.fillText(word, cx, cy);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(248,240,232,0.94)";
    ctx.fillText(word, cx, cy);
  } else {
    // Hairline outline. Scaled to the type size so the stroke stays optically
    // consistent whether the word is four characters or eleven.
    ctx.lineWidth = Math.max(3, px * 0.008);
    ctx.strokeStyle = "rgba(255,226,200,0.85)";
    ctx.shadowColor = "rgba(255,138,32,0.55)";
    ctx.shadowBlur = 46;
    ctx.strokeText(word, cx, cy);
    ctx.shadowBlur = 0;
    ctx.strokeText(word, cx, cy);
  }

  return canvas;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

/**
 * Contain-fits the fixed-aspect texture into the viewport so the word never
 * stretches, and splits it into two halves that can be driven apart — the
 * tear. `uTear` slides the left half left and the right half right, opening a
 * gap down the middle of the type.
 */
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uMap;
  uniform vec2  uRes;
  uniform float uTexAspect;
  uniform float uOpacity;
  uniform float uScale;
  uniform float uTear;
  uniform vec2  uOffset;

  void main() {
    float screen = uRes.x / uRes.y;
    vec2 uv = vUv - 0.5;

    if (screen > uTexAspect) uv.x *= screen / uTexAspect;
    else                     uv.y *= uTexAspect / screen;

    uv /= uScale;

    // Composition offset — moves the word within the frame.
    uv -= uOffset;

    // Tear: each half is pulled away from the centre line.
    uv.x += (uv.x > 0.0 ? -uTear : uTear);

    uv += 0.5;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

    vec4 c = texture2D(uMap, uv);
    if (c.a < 0.002) discard;
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
  }
`;

export function Wordmark() {
  const { size } = useThree();
  const booted = useApp((s) => s.booted);
  const section = useApp((s) => s.section);
  const mat = useRef<ShaderMaterial>(null);

  const [fontReady, setFontReady] = useState(false);
  const cache = useRef(new Map<string, CanvasTexture>());

  /** The word currently uploaded, versus the one the section wants. */
  const shown = useRef<string | null>(null);
  const opacity = useRef(0);
  const scale = useRef(0.86);
  const tear = useRef(0);

  // Wait for Manrope, else the browser substitutes a fallback face and bakes
  // the wrong letterforms into the texture.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await document.fonts.load('800 400px "Manrope"');
        await document.fonts.ready;
      } catch {
        /* fallback stack still renders something */
      }
      if (!cancelled) setFontReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup reads the ref inside the teardown closure, never during render.
  useEffect(
    () => () => {
      const store = cache.current;
      for (const t of store.values()) t.dispose();
      store.clear();
    },
    [],
  );

  const uniforms = useMemo(
    () => ({
      uMap: { value: null as CanvasTexture | null },
      uRes: { value: new Vector2(1, 1) },
      uTexAspect: { value: TEX_W / TEX_H },
      uOpacity: { value: 0 },
      uScale: { value: 0.86 },
      uTear: { value: 0 },
      uOffset: { value: new Vector2(0, 0) },
    }),
    [],
  );

  useFrame((_, delta) => {
    const u = mat.current?.uniforms;
    if (!u || !fontReady) return;
    const dt = Math.min(delta, 0.05);

    const entry = WORDS[section];
    const wanted = entry?.word ?? null;

    // Swap only once the previous word has faded out, so words cross at zero
    // rather than dissolving into each other.
    if (shown.current !== wanted && opacity.current < 0.02) {
      shown.current = wanted;
      if (wanted && entry) {
        let tex = cache.current.get(wanted);
        if (!tex) {
          tex = new CanvasTexture(paint(wanted, entry.style, entry.fill));
          tex.minFilter = LinearFilter;
          tex.magFilter = LinearFilter;
          tex.anisotropy = 4;
          cache.current.set(wanted, tex);
        }
        tex.needsUpdate = true;
        u.uMap.value = tex;
      }
      tear.current = 0;
    }

    u.uRes.value.set(size.width, size.height);

    // Hero fades with scroll; chapter words hold while their section is live.
    const y = typeof window === "undefined" ? 0 : window.scrollY;
    const heroFade = 1 - Math.min(1, Math.max(0, y / 520));
    const wantsShow = booted && shown.current === wanted && wanted !== null;
    const target = !wantsShow ? 0 : section === 0 ? heroFade : 0.85;

    opacity.current = damp(opacity.current, target, 3.4, dt);
    scale.current = damp(scale.current, booted ? 1 : 0.86, 2.6, dt);

    // The teardown word pulls apart in sympathy with the exploding robot.
    const exploded = useApp.getState().exploded;
    tear.current = damp(tear.current, section === 4 ? exploded * 0.16 : 0, 2.2, dt);

    // Ease the offset so a section change slides the word into place
    // rather than teleporting it.
    const off = u.uOffset.value as Vector2;
    off.x = damp(off.x, entry?.offset[0] ?? 0, 3, dt);
    off.y = damp(off.y, entry?.offset[1] ?? 0, 3, dt);

    u.uOpacity.value = opacity.current;
    u.uScale.value = scale.current;
    u.uTear.value = tear.current;
  });

  if (!fontReady) return null;

  return (
    <ScreenQuad renderOrder={-900} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        /* depthTest MUST stay on. Three renders every transparent object after
           the opaque pass, so renderOrder alone cannot put this behind the
           robot — with depthTest off the type painted straight over the
           machine. The quad sits at the far plane (z/w = 1.0), so testing
           against the depth the robot already wrote is what puts BARQ in
           front of its own name. depthWrite stays off so the type never
           occludes anything itself. */
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </ScreenQuad>
  );
}
