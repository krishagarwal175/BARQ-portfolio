"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box3, Group, Vector3 } from "three";
import { useUrdf } from "@/hooks/useUrdf";
import { RobotDriver } from "@/lib/robot-driver";
import { applyRobotMaterials } from "@/lib/robot-materials";
import { useApp } from "@/lib/store";
import { damp } from "@/lib/utils";
import type { URDFRobotLike } from "@/types/robot";

interface RobotProps {
  onReady?: (robot: URDFRobotLike) => void;
}

/**
 * The living robot. Loads the URDF, normalises its origin so the centre of mass
 * sits on the world Y axis with the feet at y=0, then drives idle/pose/gait
 * motion every frame via {@link RobotDriver}. Subtly yaws toward the pointer so
 * the robot always acknowledges the viewer.
 */
export function Robot({ onReady }: RobotProps) {
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const setProgress = useApp((s) => s.setProgress);
  const setReady = useApp((s) => s.setReady);
  const setRobot = useApp((s) => s.setRobot);
  const setRobotGroup = useApp((s) => s.setRobotGroup);

  const { robot, progress } = useUrdf();
  const driver = useRef<RobotDriver | null>(null);
  const yaw = useRef(0);
  const spin = useRef(0);
  /** Eased scroll velocity — drives the body's lean and lift. */
  const bank = useRef(0);

  useEffect(() => {
    setProgress(progress);
  }, [progress, setProgress]);

  useEffect(() => {
    if (!robot || !outer.current || !inner.current) return;
    // Swap the imported CAD materials for the PBR finish before anything else
    // captures or clones them (teardown glow, environment material modes).
    applyRobotMaterials(robot);

    // Measure the assembled robot and normalise: centre X/Z on the world axis,
    // rest the feet exactly on y=0. Everything downstream frames this origin.
    const box = new Box3().setFromObject(outer.current);
    const center = box.getCenter(new Vector3());
    inner.current.position.set(-center.x, -box.min.y, -center.z);

    driver.current = new RobotDriver(robot, 0);
    setRobot(robot);
    setRobotGroup(outer.current);
    setReady(true);
    onReady?.(robot);

    return () => {
      setRobotGroup(null);
    };
  }, [robot, onReady, setReady, setRobot, setRobotGroup]);

  useFrame((state, delta) => {
    if (!driver.current || !outer.current) return;
    const dt = Math.min(delta, 0.05);
    const { motion, gaitSpeed, labActive, exploded, env, scrollVel, debug } =
      useApp.getState();
    // Debug freezes every idle motion. Breathing, weight shift and servo
    // jitter are all driven off elapsed time, so pinning it holds the machine
    // dead still — while dt keeps flowing, so a pose change still settles
    // rather than locking half-way. Readings taken against a moving robot are
    // not reproducible.
    // Also frozen through the opening shot: the camera is inches from the
    // panel there, so breathing and servo jitter read as the whole plate
    // wobbling rather than as a machine idling.
    const { reveal } = useApp.getState();
    const still = debug || reveal < 0.999;
    const elapsed = still ? 0 : performance.now() / 1000;
    driver.current.update(dt, motion, gaitSpeed, elapsed, env);

    // Bank into the scroll. A machine with mass should resist being flung down
    // the page — it pitches against the direction of travel and squats a
    // little, then settles. Disabled in the lab, where the user is driving.
    bank.current = damp(bank.current, labActive || still ? 0 : scrollVel, 4, dt);
    outer.current.position.y = driver.current.currentBodyY - Math.abs(bank.current) * 0.012;

    // Micro pointer acknowledgement — a restrained body yaw (disabled in lab).
    const wantYaw = labActive || still ? 0 : state.pointer.x * 0.08;
    yaw.current = damp(yaw.current, wantYaw, 2.5, dt);
    // During the teardown, add a slow turntable rotation on top.
    spin.current += !debug && exploded > 0.35 ? dt * 0.28 * exploded : 0;
    // Pose-driven body pitch/roll gives stances real chassis attitude.
    outer.current.rotation.set(
      driver.current.currentBodyPitch - bank.current * 0.11,
      yaw.current + spin.current,
      driver.current.currentBodyRoll + bank.current * 0.05,
    );
  });

  const model = useMemo(() => (robot ? <primitive object={robot} /> : null), [robot]);

  return (
    <group ref={outer}>
      {/* URDF is authored Z-up; rotate into the viewer's Y-up frame. */}
      <group ref={inner} rotation={[-Math.PI / 2, 0, 0]}>
        {model}
      </group>
    </group>
  );
}
