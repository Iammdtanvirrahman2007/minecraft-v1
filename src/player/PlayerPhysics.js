import { Vec3 } from '../world/math.js';

export class PlayerPhysics {
  constructor(world) {
    this.world = world;
    this.position = new Vec3(world.radius, 0, 0);
    this.velocity = new Vec3();
    this.up = this.position.normalize();
    this.previousPosition = this.position.clone();
    this.crossedCore = false;
    this.atCore = false;
  }

  update(dt) {
    const r = this.position.length();

    if (r > 1e-5) {
      const outward = this.position.normalize();
      const gravityStrength = this.gravityStrength(r);
      this.velocity = this.velocity.add(outward.mul(-gravityStrength * dt));
    }

    this.previousPosition = this.position.clone();
    this.position = this.position.add(this.velocity.mul(dt));

    const newRadius = this.position.length();
    this.atCore = newRadius < 1e-3;

    // Radius is always positive, so core passage is detected from a motion
    // segment that passes through the origin rather than by checking sign(r).
    const motionFromCenter = this.previousPosition.dot(this.position);
    if (!this.crossedCore && motionFromCenter < 0 && newRadius > 1e-3) {
      this.crossedCore = true;
    }

    this.updateOrientation();
  }

  gravityStrength(radiusFromCenter) {
    const R = this.world.radius;
    if (radiusFromCenter < 1e-5) return 0;
    if (radiusFromCenter >= R) {
      return 9.81 * (R * R) / (radiusFromCenter * radiusFromCenter);
    }
    // Game-friendly interior gravity that smoothly reaches zero at the center.
    return 9.81 * (radiusFromCenter / R);
  }

  updateOrientation() {
    const r = this.position.length();
    if (r > 1e-4) this.up = this.position.normalize();
  }

  getGravityVector() {
    const r = this.position.length();
    return r > 1e-5
      ? this.position.normalize().mul(-this.gravityStrength(r))
      : new Vec3();
  }

  getLocalUp() {
    return this.up.clone();
  }

  serialize() {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      velocity: { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z },
      crossedCore: this.crossedCore,
      atCore: this.atCore,
    };
  }
}
