export class ChunkGenerator {
  constructor(world) {
    this.world = world;
  }

  generate({ latIndex, lonIndex, depthIndex = 0 }) {
    const size = this.world.chunkSize;
    const blocks = new Uint8Array(size * size * size);

    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const lat = (latIndex * size + x) / this.world.radius - Math.PI / 2;
        const lon = (lonIndex * size + z) / this.world.radius - Math.PI;
        const surface = Math.max(1, 8 + this.world.getTerrainHeight(
          this.world.surfacePosition(lat, lon)
        ));

        for (let y = 0; y < size; y++) {
          const worldDepth = depthIndex * size + y;
          let block = 0;
          if (worldDepth <= surface) {
            if (worldDepth === surface) block = 1;      // grass
            else if (worldDepth > surface - 4) block = 2; // dirt
            else block = 3;                              // stone
          }
          blocks[(y * size + z) * size + x] = block;
        }
      }
    }

    return { latIndex, lonIndex, depthIndex, size, blocks };
  }
}
