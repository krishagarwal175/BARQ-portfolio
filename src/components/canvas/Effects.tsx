"use client";

import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { ThermalEffect } from "./ThermalEffect";
import { useApp } from "@/lib/store";

/**
 * Restrained post-processing. Bloom is kept extremely subtle — only the
 * brightest rim highlights should bleed. A gentle vignette focuses the frame.
 *
 * The thermal pass runs first so bloom and vignette apply to the false-colour
 * image rather than to the render underneath it — otherwise the heat map would
 * sit on top of a bloom that belongs to a picture the viewer can no longer see.
 */
export function Effects() {
  const thermal = useApp((s) => s.thermal);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <ThermalEffect amount={thermal} />
      {/* Bloom backs off as the thermal camera comes up. An IR sensor has no
          lens bloom to speak of, and leaving it at full strength was most of
          why the hot chassis flared into a sun rather than reading as a warm
          body with a temperature gradient across it. */}
      <Bloom
        intensity={0.42 * (1 - thermal * 0.78)}
        luminanceThreshold={0.72 + thermal * 0.2}
        luminanceSmoothing={0.24}
        mipmapBlur
        radius={0.6}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.72} blendFunction={BlendFunction.NORMAL} />
      <SMAA />
    </EffectComposer>
  );
}
