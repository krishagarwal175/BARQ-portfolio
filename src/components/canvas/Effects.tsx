"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { BlendFunction, type BloomEffect } from "postprocessing";
import { ThermalEffect } from "./ThermalEffect";
import { useApp } from "@/lib/store";

/**
 * Restrained post-processing. Bloom is kept extremely subtle — only the
 * brightest rim highlights should bleed. A gentle vignette focuses the frame.
 *
 * The thermal pass runs first so bloom and vignette apply to the false-colour
 * image rather than to the render underneath it — otherwise the heat map would
 * sit on top of a bloom that belongs to a picture the viewer can no longer see.
 *
 * Nothing here subscribes to the store. `thermal` changes on every scroll
 * event, and reading it through a hook re-rendered this whole subtree — and so
 * re-reconciled the effect chain — on every tick of every scroll. The values
 * are pushed straight onto the effect instances from a frame loop instead, so
 * scrolling costs no React work at all.
 */
function PostDriver({ bloom }: { bloom: React.RefObject<BloomEffect | null> }) {
  useFrame(() => {
    const b = bloom.current;
    if (!b) return;
    const { thermal } = useApp.getState();
    // An IR sensor has essentially no lens bloom, so it backs off as the
    // camera comes up; left at full strength the hot chassis flares.
    b.intensity = 0.42 * (1 - thermal * 0.78);
    b.luminanceMaterial.threshold = 0.72 + thermal * 0.2;
  });
  return null;
}

export function Effects() {
  const bloom = useRef<BloomEffect>(null);

  return (
    <>
      <PostDriver bloom={bloom} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <ThermalEffect />
        <Bloom
          ref={bloom}
          intensity={0.42}
          luminanceThreshold={0.72}
          luminanceSmoothing={0.24}
          mipmapBlur
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.28} darkness={0.72} blendFunction={BlendFunction.NORMAL} />
        <SMAA />
      </EffectComposer>
    </>
  );
}
