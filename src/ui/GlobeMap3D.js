import * as THREE from 'https://unpkg.com/three@0.181.1/build/three.module.js';

export class GlobeMap3D {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    this.open = false;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.rotX = 0.35;
    this.rotY = -0.65;
    this.zoom = 1;

    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'fixed', inset: '0', zIndex: '20', display: 'none',
      background: 'radial-gradient(circle at 50% 45%, #112241 0%, #050914 48%, #010207 100%)',
      overflow: 'hidden', fontFamily: 'system-ui, sans-serif', color: 'white'
    });
    document.body.appendChild(this.root);

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, { width: '100%', height: '100%', display: 'block', cursor: 'grab' });
    this.root.appendChild(this.canvas);

    this.ui = document.createElement('div');
    this.ui.innerHTML = `
      <div style="font-size:25px;font-weight:800;letter-spacing:.3px">🌍 WORLD GLOBE</div>
      <div id="globeMeta" style="margin-top:6px;opacity:.72;font-size:13px"></div>
      <div style="margin-top:12px;font-size:12px;opacity:.6">Drag to orbit • Wheel to zoom • G to close</div>
    `;
    Object.assign(this.ui.style, {
      position: 'absolute', left: '24px', top: '22px', padding: '15px 18px',
      borderRadius: '16px', background: 'rgba(7,13,25,.58)', border: '1px solid rgba(255,255,255,.12)',
      boxShadow: '0 12px 40px rgba(0,0,0,.32)', backdropFilter: 'blur(16px)', zIndex: 3
    });
    this.root.appendChild(this.ui);

    this.close = document.createElement('button');
    this.close.textContent = '✕';
    Object.assign(this.close.style, {
      position: 'absolute', right: '24px', top: '22px', width: '46px', height: '46px',
      borderRadius: '14px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(7,13,25,.62)',
      color: 'white', fontSize: '20px', cursor: 'pointer', zIndex: 4
    });
    this.root.appendChild(this.close);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 8.8);

    this.scene.add(new THREE.AmbientLight(0x8ea9d7, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(5, 7, 6);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x6e8cff, 1.5);
    rim.position.set(-6, -2, -5);
    this.scene.add(rim);

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.buildGlobe();
    this.buildStars();
    this.buildAtmosphere();
    this.buildMarker();

    this.close.onclick = () => this.hide();
    this.canvas.addEventListener('pointerdown', e => {
      this.dragging = true; this.lastX = e.clientX; this.lastY = e.clientY; this.canvas.style.cursor = 'grabbing';
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', e => {
      if (!this.dragging) return;
      this.rotY += (e.clientX - this.lastX) * 0.007;
      this.rotX += (e.clientY - this.lastY) * 0.007;
      this.rotX = THREE.MathUtils.clamp(this.rotX, -1.35, 1.35);
      this.lastX = e.clientX; this.lastY = e.clientY;
    });
    const end = () => { this.dragging = false; this.canvas.style.cursor = 'grab'; };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom = THREE.MathUtils.clamp(this.zoom + e.deltaY * 0.0012, 0.72, 1.55);
    }, { passive: false });
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  buildGlobe() {
    const R = 2.35;
    const blocks = [];
    const palette = [0x5f9b55, 0x74a865, 0x8bb875, 0x5a82a8, 0x7d8c62, 0x59677d];
    const geo = new THREE.BoxGeometry(0.115, 0.115, 0.115);
    const mats = palette.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .88, metalness: .02 }));
    for (let lat = -72; lat <= 72; lat += 6) {
      const phi = THREE.MathUtils.degToRad(lat);
      const rowScale = Math.max(0.12, Math.cos(phi));
      const stepLon = 6 / rowScale;
      for (let lon = -180; lon < 180; lon += stepLon) {
        const theta = THREE.MathUtils.degToRad(lon);
        const n = this.noise(lat * 0.11, lon * 0.055);
        const land = n > -0.18;
        if (!land) continue;
        const rr = R + 0.055 + Math.max(0, n) * 0.10;
        const p = new THREE.Vector3(
          rr * Math.cos(phi) * Math.cos(theta),
          rr * Math.sin(phi),
          rr * Math.cos(phi) * Math.sin(theta)
        );
        blocks.push({ p, idx: Math.abs(Math.floor(n * 1000)) % mats.length });
      }
    }
    const perMat = mats.map((mat, idx) => {
      const list = blocks.filter(b => b.idx === idx);
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < list.length; i++) {
        const p = list[i].p;
        dummy.position.copy(p);
        dummy.lookAt(p.clone().multiplyScalar(1.5));
        dummy.rotateZ((i % 4) * 0.15);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      return mesh;
    });
    perMat.forEach(m => this.worldGroup.add(m));

    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(R - .10, 48, 32),
      new THREE.MeshStandardMaterial({ color: 0x101a24, roughness: 1, metalness: 0 })
    );
    this.worldGroup.add(inner);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(R + .17, .018, 8, 128),
      new THREE.MeshBasicMaterial({ color: 0x83a7ff, transparent: true, opacity: .24 })
    );
    this.worldGroup.add(this.ring);
  }

  noise(a, b) {
    const s = Math.sin(a * 12.9898 + b * 78.233 + this.world.seed * 0.00007) * 43758.5453;
    const r = s - Math.floor(s);
    return r * 2 - 1;
  }

  buildStars() {
    const count = 1800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 16 + Math.random() * 30;
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(t);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(t);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(geom, new THREE.PointsMaterial({ color: 0xffffff, size: .055, sizeAttenuation: true, transparent: true, opacity: .86 }));
    this.scene.add(this.stars);
  }

  buildAtmosphere() {
    this.glow = new THREE.Mesh(
      new THREE.SphereGeometry(2.56, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x4a8cff, transparent: true, opacity: .075, side: THREE.BackSide })
    );
    this.worldGroup.add(this.glow);
  }

  buildMarker() {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff465f }));
    this.marker = pin;
    this.worldGroup.add(pin);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(.012, .012, .44, 8),
      new THREE.MeshBasicMaterial({ color: 0xff465f, transparent: true, opacity: .8 })
    );
    this.markerBeam = beam;
    this.worldGroup.add(beam);
  }

  updateMarker() {
    const p = this.player.position.normalize();
    const pos = new THREE.Vector3(p.x, p.y, p.z).multiplyScalar(2.61);
    this.marker.position.copy(pos);
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p);
    this.markerBeam.position.copy(pos.clone().sub(p.clone().multiplyScalar(.22)));
    this.markerBeam.quaternion.copy(q);
  }

  show() {
    this.open = true;
    this.root.style.display = 'block';
    this.resize();
  }

  hide() {
    this.open = false;
    this.root.style.display = 'none';
  }

  toggle() { this.open ? this.hide() : this.show(); }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(dt) {
    if (!this.open) return;
    this.worldGroup.rotation.x = this.rotX;
    this.worldGroup.rotation.y = this.rotY;
    this.worldGroup.rotation.z = Math.sin(performance.now() * 0.00012) * 0.04;
    this.worldGroup.scale.setScalar(1 / this.zoom);
    this.stars.rotation.y -= dt * 0.004;
    this.updateMarker();
    const meta = this.ui.querySelector('#globeMeta');
    const p = this.player.position.normalize();
    meta.textContent = `Seed ${this.world.seed}  •  Lat ${(Math.asin(p.y) * 180 / Math.PI).toFixed(1)}°  •  Lon ${(Math.atan2(p.z, p.x) * 180 / Math.PI).toFixed(1)}°`;
    this.renderer.render(this.scene, this.camera);
  }
}
