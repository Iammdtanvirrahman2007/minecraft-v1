import { ChunkGenerator } from './ChunkGenerator.js';

export class ChunkManager {
  constructor(world, renderDistance = 4) {
    this.world = world;
    this.renderDistance = renderDistance;
    this.generator = new ChunkGenerator(world);
    this.loaded = new Map();
  }

  key(latIndex, lonIndex, depthIndex) {
    return this.world.getChunkKey(latIndex, lonIndex, depthIndex);
  }

  ensureChunk(latIndex, lonIndex, depthIndex = 0) {
    const key = this.key(latIndex, lonIndex, depthIndex);
    if (!this.loaded.has(key)) {
      this.loaded.set(key, this.generator.generate({ latIndex, lonIndex, depthIndex }));
    }
    return this.loaded.get(key);
  }

  updatePlayer(lat, lon, depth = 0) {
    const center = this.world.getChunkIndices(lat, lon, depth);
    const wanted = new Set();

    for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
      for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
        const latIndex = center.latIndex + dx;
        let lonIndex = center.lonIndex + dz;
        // Longitude wraps around, eliminating a world edge.
        lonIndex = this.wrapLongitudeChunk(lonIndex);
        const key = this.key(latIndex, lonIndex, center.depthIndex);
        wanted.add(key);
        this.ensureChunk(latIndex, lonIndex, center.depthIndex);
      }
    }

    for (const key of this.loaded.keys()) {
      if (!wanted.has(key)) this.loaded.delete(key);
    }
  }

  wrapLongitudeChunk(index) {
    const chunksAround = Math.max(1, Math.floor((2 * Math.PI * this.world.radius) / this.world.chunkSize));
    return ((index % chunksAround) + chunksAround) % chunksAround;
  }
}
