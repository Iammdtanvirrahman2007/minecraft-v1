import { Vec3 } from '../world/math.js';

export class PlayerPhysics {
  constructor(world) {
    this.world = world;
    this.position = new Vec3(world.radius, 0, 0);
    this.velocity = new Vec3();
    this.up = this.position.normalize();
    this.previousRadius = this.position.length();
    this.crossedCore = false;
    this.coreTransition = 0;
  }

  update(dt) {
    const r = this.position.length();
    const center = this.world.center;

    if (r > 1e-5) {
      const outward = this.position.sub(center).normalize();
      // Outside: gravity points inward. Inside: this remains physically inward,
      // so after passing the center the same center-directed gravity automatically
      // points toward the opposite hemisphere.
      const gravityStrength = this.gravityStrength(r);
      const acceleration = outward.mul(-gravityStrength);
      this.velocity = this.velocity.add(acceleration.mul(dt));
    }

    this.position = this.position.add(this.velocity.mul(dt));
    this.updateOrientation();
  }

  gravityStrength(radiusFromCenter) {
    const R = this.world.radius;
    if (radiusFromCenter < 1e-5) return 0;
    if (radiusFromCenter >= R) return 9.81 * (R * R) / (radiusFromCenter * radiusFromCenter);
    // Game-friendly interior gravity: ramps down linearly toward zero at the core.
    return 9.81 * (radiusFromCenter / R);
  }

  updateOrientation() {
    const r = this.position.length();
    if (r < 1e-4) {
      this.coreTransition = Math.min(1, this.coreTransition + 0.08);
      // Keep previous orientation at the exact center to avoid a zero-vector flip.
      this.crossedCore = true;
      return;
    }

    const targetUp = this.position.normalize();
    this.up = this.crossedCore
      ? targetUp
      : targetUp;

    if (this.previousRadius > 1e-4 && r > 1e-4 && this.previousRadius * r < 0) {
      this.crossedCore = true;
    }

    this.previousRadius = r;
  }

  getGravityVector() {
    return this.position.length() > 1e-5
      ? this.position.normalize().mul(-this.gravityStrength(this.position.length()))
      : new Vec3();
  }

  getLocalUp() {
    return this.position.length() > 1e-5 ? this.position.normalize() : this.up;
  }

  serialize() {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      velocity: { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z },
      crossedCore: this.crossedCore,
    };
  }
}
