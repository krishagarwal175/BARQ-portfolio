"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { CAM_KEYS } from "@/lib/camera-keyframes";
import { useApp } from "@/lib/store";
import { damp } from "@/lib/utils";

/**
 * Storytelling camera. Damps toward the active section's keyframe, adds a
 * living hand-held breathe and a pointer-driven parallax. Yields entirely to
 * OrbitControls while the Robot Lab is active.
 */
export function CameraRig() {
  const { camera, pointer } = useThree();
  const targetV = useRef(new Vector3(...CAM_KEYS[0].target));
  const posV = useRef(new Vector3(...CAM_KEYS[0].pos));

  useFrame((state, delta) => {
    if (useApp.getState().labActive) return;
    const dt = Math.min(delta, 0.05);
    const { section, scroll } = useApp.getState();
    const key = CAM_KEYS[Math.min(section, CAM_KEYS.length - 1)];
    const t = state.clock.elapsedTime;

    // Living breathe + pointer parallax layered on the keyframe.
    const breatheX = Math.sin(t * 0.4) * 0.012;
    const breatheY = Math.cos(t * 0.32) * 0.01;
    const px = pointer.x * 0.05;
    const py = pointer.y * 0.035;

    posV.current.set(
      key.pos[0] + breatheX + px,
      key.pos[1] + breatheY + py,
      key.pos[2] + Math.sin(scroll * Math.PI) * 0.02,
    );
    targetV.current.set(...key.target);

    camera.position.x = damp(camera.position.x, posV.current.x, 3.2, dt);
    camera.position.y = damp(camera.position.y, posV.current.y, 3.2, dt);
    camera.position.z = damp(camera.position.z, posV.current.z, 3.2, dt);

    const cam = camera as PerspectiveCamera;
    cam.fov = damp(cam.fov, key.fov, 3.2, dt);
    cam.updateProjectionMatrix();

    camera.lookAt(targetV.current);
  });

  return null;
}
