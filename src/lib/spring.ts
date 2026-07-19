import { Vector3 } from "three";

/**
 * Ryan Juckett's semi-implicit critically-damped spring — settles smoothly with
 * no overshoot and no snapping, which is exactly the cinematographic feel we
 * want for the camera. `omega` is the angular frequency (higher = snappier).
 */
export function springScalar(
  pos: number,
  vel: number,
  target: number,
  omega: number,
  dt: number,
): [number, number] {
  const f = 1 + 2 * dt * omega;
  const oo = omega * omega;
  const hoo = dt * oo;
  const hhoo = dt * hoo;
  const detInv = 1 / (f + hhoo);
  const detX = f * pos + dt * vel + hhoo * target;
  const detV = vel + hoo * (target - pos);
  return [detX * detInv, detV * detInv];
}

/** A critically-damped spring over a Vector3 with its own velocity state. */
export class SpringVec3 {
  readonly value: Vector3;
  private vel = new Vector3();

  constructor(initial: Vector3) {
    this.value = initial.clone();
  }

  set(v: Vector3) {
    this.value.copy(v);
    this.vel.set(0, 0, 0);
  }

  step(target: Vector3, omega: number, dt: number) {
    const [x, vx] = springScalar(this.value.x, this.vel.x, target.x, omega, dt);
    const [y, vy] = springScalar(this.value.y, this.vel.y, target.y, omega, dt);
    const [z, vz] = springScalar(this.value.z, this.vel.z, target.z, omega, dt);
    this.value.set(x, y, z);
    this.vel.set(vx, vy, vz);
    return this.value;
  }
}

/** A critically-damped spring over a single scalar (e.g. field of view). */
export class SpringScalar {
  value: number;
  private vel = 0;

  constructor(initial: number) {
    this.value = initial;
  }

  step(target: number, omega: number, dt: number) {
    const [v, vel] = springScalar(this.value, this.vel, target, omega, dt);
    this.value = v;
    this.vel = vel;
    return this.value;
  }
}
