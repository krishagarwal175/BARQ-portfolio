"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls, Preload } from "@react-three/drei";
import { ACESFilmicToneMapping, Vector3 } from "three";
import { CameraRig } from "./CameraRig";
import { DebugControls } from "./DebugControls";
import { Effects } from "./Effects";
import { EnvController } from "./EnvController";
import { Ground } from "./Ground";
import { Lighting } from "./Lighting";
import { Particles } from "./Particles";
import { Robot } from "./Robot";
import { ShaderField } from "./ShaderField";
import { Wordmark } from "./Wordmark";
import { Teardown3D } from "./Teardown3D";
import { useApp } from "@/lib/store";
import { damp } from "@/lib/utils";

/** Swaps the scripted rig for the free camera without re-rendering <Canvas>. */
function RigOrDebug() {
  const debug = useApp((s) => s.debug);
  return debug ? <DebugControls /> : <CameraRig />;
}

/** Where the lab parks the camera. Portrait pulls back and lifts the robot so
 *  it clears the bottom console; a lower target keeps it in the upper frame. */
function labPose(): { pos: Vector3; tgt: Vector3 } {
  const portrait = window.innerHeight > window.innerWidth;
  return portrait
    ? { pos: new Vector3(0.34, 0.26, 1.02), tgt: new Vector3(0, 0.09, 0) }
    : { pos: new Vector3(0.66, 0.3, 0.82), tgt: new Vector3(0, 0.1, 0) };
}

function LabControls() {
  const labActive = useApp((s) => s.labActive);
  const { camera } = useThree();

  /**
   * The lab used to take the camera by teleport: the scripted rig bails out
   * the instant `labActive` flips, and on the next frame this set the position
   * outright. Two shots, cut together — which is exactly the glitch coming out
   * of the thermal chapter.
   *
   * So the arrival is flown instead. The camera eases from wherever the last
   * chapter left it to the lab pose, and OrbitControls is only mounted once it
   * has landed — mounting it earlier would hand it a moving camera and it would
   * fight the transition for control.
   */
  const goal = useRef<{ pos: Vector3; tgt: Vector3 } | null>(null);
  const aim = useRef(new Vector3());
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!labActive) {
      goal.current = null;
      setLanded(false);
      return;
    }
    const g = labPose();
    goal.current = g;
    // Start the pan from the point the previous shot was actually aimed at,
    // recovered by walking down the camera's own view ray. Beginning from the
    // lab target instead would swing the look direction on the first frame.
    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    aim.current
      .copy(camera.position)
      .addScaledVector(forward, camera.position.distanceTo(g.tgt));
  }, [labActive, camera]);

  useFrame((_, delta) => {
    const g = goal.current;
    if (!g || landed) return;
    const dt = Math.min(delta, 0.05);

    camera.position.set(
      damp(camera.position.x, g.pos.x, 3.2, dt),
      damp(camera.position.y, g.pos.y, 3.2, dt),
      damp(camera.position.z, g.pos.z, 3.2, dt),
    );
    aim.current.set(
      damp(aim.current.x, g.tgt.x, 3.2, dt),
      damp(aim.current.y, g.tgt.y, 3.2, dt),
      damp(aim.current.z, g.tgt.z, 3.2, dt),
    );
    camera.lookAt(aim.current);

    // Close enough that mounting the controls is invisible.
    if (camera.position.distanceTo(g.pos) < 0.004) {
      camera.position.copy(g.pos);
      camera.lookAt(g.tgt);
      setLanded(true);
    }
  });

  if (!labActive || !landed) return null;
  return (
    <OrbitControls
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
/**
 * Stops the render loop once the reference sections cover the viewport.
 *
 * Driven imperatively from inside the canvas rather than through a `frameloop`
 * prop on <Canvas>. Changing that prop re-renders the Canvas element itself,
 * which tears through R3F's root while the scene graph is live and threw
 * "JSON.stringify cannot serialize cyclic structures" — the overlay choking on
 * a Three object graph mid-teardown. setFrameloop does the same job without
 * touching the React tree.
 */
function FrameloopGate() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  const sceneVisible = useApp((s) => s.sceneVisible);

  useEffect(() => {
    setFrameloop(sceneVisible ? "always" : "never");
    // One last frame so the canvas does not freeze mid-transition.
    if (sceneVisible) invalidate();
  }, [sceneVisible, setFrameloop, invalidate]);

  return null;
}

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
      <FrameloopGate />
      <Suspense fallback={null}>
        {/* Back to front: ambient ground, chapter wordmarks, then the robot
            — so the robot occludes the type in a single composited frame. */}
        <ShaderField />
        <Wordmark />
        <Lighting />
        <EnvController />
        <Robot />
        <Teardown3D />
        <Ground />
        <Particles />
        <RigOrDebug />
        <LabControls />
        <Effects />
        <Preload all />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
