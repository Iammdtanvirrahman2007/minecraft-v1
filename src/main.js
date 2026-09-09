import * as THREE from 'https://unpkg.com/three@0.181.1/build/three.module.js';
import { SphericalWorld } from './world/SphericalWorld.js';
import { PlayerPhysics } from './player/PlayerPhysics.js';
import { GlobeMap3D } from './ui/GlobeMap3D.js';

const world = new SphericalWorld({ radius: 64, seed: Math.floor(Math.random() * 0xffffffff) });
const player = new PlayerPhysics(world);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86c5ff);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(10, 20, 10);
scene.add(sun);

const localTerrain = new THREE.Group();
scene.add(localTerrain);
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const grassMat = new THREE.MeshLambertMaterial({ color: 0x5ca34a });
const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8a5a35 });
const stoneMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
const blocks = [];

function rebuildLocalTerrain() {
  for (const m of blocks) localTerrain.remove(m);
  blocks.length = 0;
  const size = 17;
  for (let x = -size; x <= size; x++) {
    for (let z = -size; z <= size; z++) {
      const h = 2 + Math.max(-1, Math.floor(2 * Math.sin(x * 0.17) + Math.cos(z * 0.23)));
      for (let y = 0; y <= h; y++) {
        const mat = y === h ? grassMat : (y > h - 2 ? dirtMat : stoneMat);
        const cube = new THREE.Mesh(blockGeo, mat);
        cube.position.set(x, y - 1, z);
        localTerrain.add(cube);
        blocks.push(cube);
      }
    }
  }
}
rebuildLocalTerrain();

const playerMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.65, 1.8, 0.65),
  new THREE.MeshLambertMaterial({ color: 0x3a55d8 })
);
playerMesh.position.y = 4;
scene.add(playerMesh);

const hud = document.createElement('div');
hud.innerHTML = `
  <div style="font-size:20px;font-weight:700">🌍 Spherical Earth Prototype</div>
  <div id="status">Seed: ${world.seed}</div>
  <button id="globe" style="margin-top:8px">🌍 3D Globe Map</button>
  <div style="opacity:.8;margin-top:8px">WASD = move • Space = rise • G = Globe</div>
`;
Object.assign(hud.style, {
  position: 'fixed', left: '18px', top: '18px', zIndex: 5,
  fontFamily: 'system-ui, sans-serif', color: 'white',
  background: 'rgba(0,0,0,.42)', padding: '14px 16px', borderRadius: '12px',
  backdropFilter: 'blur(8px)'
});
document.body.appendChild(hud);

const status = hud.querySelector('#status');
const globeMap = new GlobeMap3D(world, player);
hud.querySelector('#globe').onclick = () => globeMap.toggle();
window.addEventListener('keydown', e => {
  if (e.code === 'KeyG') globeMap.toggle();
});

const keys = new Set();
window.addEventListener('keydown', e => keys.add(e.code));
window.addEventListener('keyup', e => keys.delete(e.code));

function updateLocalCamera() {
  const frame = world.getLocalFrame(player.position);
  const speed = 9;
  const move = new THREE.Vector3();
  if (keys.has('KeyW')) move.z -= speed;
  if (keys.has('KeyS')) move.z += speed;
  if (keys.has('KeyA')) move.x -= speed;
  if (keys.has('KeyD')) move.x += speed;
  if (move.lengthSq()) move.normalize().multiplyScalar(speed);

  const right = new THREE.Vector3(frame.east.x, frame.east.y, frame.east.z);
  const forward = new THREE.Vector3(frame.north.x, frame.north.y, frame.north.z);
  const delta = right.multiplyScalar(move.x * 0.008).add(forward.multiplyScalar(-move.z * 0.008));
  player.position.x += delta.x;
  player.position.y += delta.y;
  player.position.z += delta.z;

  const length = Math.hypot(player.position.x, player.position.y, player.position.z);
  if (length > 1e-6) {
    const target = world.radius + 4;
    const scale = target / length;
    player.position.x *= scale;
    player.position.y *= scale;
    player.position.z *= scale;
  }

  playerMesh.position.set(0, 4, 0);
  status.textContent = `Seed: ${world.seed} • Radius: ${player.position.length().toFixed(1)} • Core crossed: ${player.crossedCore ? 'YES' : 'NO'}`;
}

let last = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  player.velocity = player.velocity.mul(0.92);
  player.update(Math.min(dt, 0.02));
  updateLocalCamera();
  globeMap.render(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
