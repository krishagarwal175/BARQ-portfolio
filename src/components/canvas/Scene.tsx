"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls, Preload } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import type { ComponentRef } from "react";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { EnvController } from "./EnvController";
import { Ground } from "./Ground";
import { Lighting } from "./Lighting";
import { Particles } from "./Particles";
import { Robot } from "./Robot";
import { ShaderField } from "./ShaderField";
import { Teardown3D } from "./Teardown3D";
import { Wordmark } from "./Wordmark";
import { useApp } from "@/lib/store";

function LabControls() {
  const labActive = useApp((s) => s.labActive);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

  // Frame the whole robot each time the lab opens, resetting the orbit state.
  // Portrait/touch viewports pull further back and lift the robot so it clears
  // the bottom console; a lower target keeps the subject in the upper frame.
  useEffect(() => {
    if (!labActive) return;
    const id = requestAnimationFrame(() => {
      const c = controls.current;
      if (!c) return;
      const portrait = window.innerHeight > window.innerWidth;
      if (portrait) {
        c.object.position.set(0.34, 0.26, 1.02);
        c.target.set(0, 0.09, 0);
      } else {
        c.object.position.set(0.66, 0.3, 0.82);
        c.target.set(0, 0.1, 0);
      }
      c.update();
    });
    return () => cancelAnimationFrame(id);
  }, [labActive]);

  if (!labActive) return null;
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 0.1, 0]}
      enablePan={false}
      minDistance={0.4}
      maxDistance={3}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2 - 0.05}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

/**
 * The single persistent WebGL scene shared across the whole experience.
 * Fixed behind the DOM content; sections drive it through the store.
 */
export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0.62, 0.34, 0.72], fov: 38, near: 0.01, far: 100 }}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ gl }) => {
        // Transparent clear: the ambient ember field is a DOM layer painted
        // behind this canvas, so the robot stands *in* the field rather than
        // in front of an opaque fill. EnvController leaves scene.background
        // null to match.
        gl.setClearColor("#000000", 0);
      }}
    >
      <Suspense fallback={null}>
        {/* Back to front: ambient ground, then the wordmark, then the robot
            — so the robot occludes the type in a single composited frame. */}
        <ShaderField />
        <Wordmark />
        <Lighting />
        <EnvController />
        <Robot />
        <Teardown3D />
        <Ground />
        <Particles />
        <CameraRig />
        <LabControls />
        <Effects />
        <Preload all />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
