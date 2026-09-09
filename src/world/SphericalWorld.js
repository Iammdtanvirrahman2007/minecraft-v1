import { Vec3, directionFromLatLon, gravityDirection, tangentFrame } from './math.js';

export class SphericalWorld {
  constructor({ radius = 256, seed = 1, chunkSize = 16, seaLevel = 0 } = {}) {
    this.radius = radius;
    this.seed = seed >>> 0;
    this.chunkSize = chunkSize;
    this.seaLevel = seaLevel;
    this.center = new Vec3(0, 0, 0);
  }

  surfacePosition(lat, lon, altitude = 0) {
    return directionFromLatLon(lat, lon).mul(this.radius + altitude);
  }

  getGravity(globalPosition) {
    const distance = globalPosition.length();
    if (distance < 1e-6) return new Vec3(0, 0, 0);
    const outward = globalPosition.normalize();
    return outward.mul(-1);
  }

  getLocalFrame(globalPosition) {
    return tangentFrame(globalPosition, this.center);
  }

  // Deterministic integer hash for terrain generation.
  hash(x, y, z) {
    let h = this.seed ^ Math.imul(x, 374761393);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= Math.imul(y, 668265263);
    h ^= Math.imul(z, 2246822519);
    h ^= h >>> 16;
    return h >>> 0;
  }

  getTerrainHeight(globalPosition) {
    const direction = globalPosition.normalize();
    const lat = Math.asin(direction.y);
    const lon = Math.atan2(direction.z, direction.x);
    const sx = Math.sin(lat * 7.0 + this.seed * 0.0001);
    const sz = Math.cos(lon * 11.0 - this.seed * 0.00013);
    return Math.round((sx + sz) * 2.0);
  }

  getChunkKey(latIndex, lonIndex, depthIndex = 0) {
    return `${latIndex}:${lonIndex}:${depthIndex}`;
  }

  getChunkIndices(lat, lon, depth = 0) {
    const latBlock = Math.floor((lat + Math.PI / 2) * this.radius);
    const lonBlock = Math.floor((lon + Math.PI) * this.radius);
    return {
      latIndex: Math.floor(latBlock / this.chunkSize),
      lonIndex: Math.floor(lonBlock / this.chunkSize),
      depthIndex: Math.floor(depth / this.chunkSize),
    };
  }
}
