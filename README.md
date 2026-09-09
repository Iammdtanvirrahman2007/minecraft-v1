# Minecraft V1

A Minecraft-style voxel game built around a finite spherical Earth world.

## Core concept

- The world is globally spherical, but active chunks are rendered on local tangent planes so the player experiences a normal Minecraft-like flat surface.
- Terrain is generated deterministically from a world seed.
- Digging can continue through the planet toward the opposite side.
- Gravity is computed relative to the planet center.
- Crossing the core transitions the player's local up direction so the opposite surface feels physically correct.
- A Globe Map shows the player's global position.

## Initial architecture

- `src/world/` global spherical coordinates, seed generation, and chunk management
- `src/player/` player state, local tangent frame, and gravity
- `src/render/` local chunk rendering abstraction
- `src/ui/` globe-map UI

This repository starts from a clean implementation so the spherical-world mechanics can be developed without legacy constraints.
