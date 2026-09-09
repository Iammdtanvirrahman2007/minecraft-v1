export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
  clone() { return new Vec3(this.x, this.y, this.z); }
  add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() {
    const l = this.length();
    return l > 1e-9 ? this.mul(1 / l) : new Vec3(0, 1, 0);
  }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
}

export function directionFromLatLon(lat, lon) {
  const clat = Math.cos(lat);
  return new Vec3(clat * Math.cos(lon), Math.sin(lat), clat * Math.sin(lon)).normalize();
}

export function gravityDirection(globalPosition, planetCenter = new Vec3()) {
  return planetCenter.sub(globalPosition).normalize();
}

export function surfaceUp(globalPosition, planetCenter = new Vec3()) {
  return globalPosition.sub(planetCenter).normalize();
}

// Build a stable local tangent frame. `up` is the player's local vertical.
export function tangentFrame(globalPosition, planetCenter = new Vec3()) {
  const up = surfaceUp(globalPosition, planetCenter);
  let reference = new Vec3(0, 1, 0);
  if (Math.abs(up.dot(reference)) > 0.98) reference = new Vec3(1, 0, 0);
  const east = reference.cross(up).normalize();
  const north = up.cross(east).normalize();
  return { east, north, up };
}
