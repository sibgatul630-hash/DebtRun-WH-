import * as THREE from "three";
import "./style.css";

const canvas = document.querySelector("#c");

// ---------- Renderer / Scene ----------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070b, 0.02);

const camera = new THREE.PerspectiveCamera(
  68,
  window.innerWidth / window.innerHeight,
  0.1,
  2500
);
camera.position.set(0, 6, 14);

// ---------- Lights ----------
const hemi = new THREE.HemisphereLight(0xbad2ff, 0x0b1020, 0.85);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.15);
sun.position.set(60, 80, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 300;
sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
scene.add(sun);

// ---------- Environment ----------
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x0a0f1a,
  roughness: 1,
  metalness: 0
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Subtle grid lines (track ambiance)
const grid = new THREE.GridHelper(400, 80, 0x234070, 0x122040);
grid.material.opacity = 0.18;
grid.material.transparent = true;
grid.position.y = 0.01;
scene.add(grid);

// ---------- Track (simple closed loop) ----------
function makeTrack() {
  // A rounded rectangle-ish loop via CatmullRom
  const pts = [];
  const R = 65;
  const W = 52;
  const H = 34;

  // Build a loop: corners are arcs
  for (let i = 0; i < 80; i++) {
    const t = (i / 80) * Math.PI * 2;
    // "squircle" style
    const x = Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 0.6) * W;
    const z = Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 0.6) * (H + 14);
    pts.push(new THREE.Vector3(x * 1.25, 0, z * 1.25));
  }

  const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.25);
  const tubular = new THREE.TubeGeometry(curve, 600, 1.8, 10, true);

  // Use tube as "centerline", then create a flat ribbon for asphalt
  const asphaltGeo = new THREE.BufferGeometry();
  const pos = tubular.attributes.position.array;
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const left = new THREE.Vector3();

  // Build ribbon vertices
  const ribbon = [];
  const ribbonN = [];
  const ribbonUV = [];
  const halfWidth = 6.6;

  const frames = curve.computeFrenetFrames(600, true);
  for (let i = 0; i <= 600; i++) {
    const u = i / 600;
    const p = curve.getPointAt(u);
    tangent.copy(frames.tangents[i]);
    left.copy(up).cross(tangent).normalize();

    const a = p.clone().addScaledVector(left, halfWidth);
    const b = p.clone().addScaledVector(left, -halfWidth);

    ribbon.push(a.x, a.y + 0.02, a.z);
    ribbon.push(b.x, b.y + 0.02, b.z);

    ribbonN.push(0, 1, 0, 0, 1, 0);
    ribbonUV.push(u * 20, 0, u * 20, 1);
  }

  // Indices (triangle strip to triangles)
  const indices = [];
  for (let i = 0; i < 600; i++) {
    const i0 = i * 2;
    const i1 = i * 2 + 1;
    const i2 = (i + 1) * 2;
    const i3 = (i + 1) * 2 + 1;
    indices.push(i0, i2, i1);
    indices.push(i2, i3, i1);
  }

  asphaltGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ribbon), 3));
  asphaltGeo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(ribbonN), 3));
  asphaltGeo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(ribbonUV), 2));
  asphaltGeo.setIndex(indices);
  asphaltGeo.computeBoundingSphere();

  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x101622,
    roughness: 0.95,
    metalness: 0.0
  });

  const asphalt = new THREE.Mesh(asphaltGeo, asphaltMat);
  asphalt.receiveShadow = true;
  scene.add(asphalt);

  // Curbs
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x7a0b16,
    roughness: 0.85,
    metalness: 0.0
  });

  const curbGeo = asphaltGeo.clone();
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.scale.set(1.02, 1, 1.02);
  curb.position.y = 0.01;
  curb.receiveShadow = true;
  scene.add(curb);

  // Barriers (simple boxes along the curve)
  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0x9fb2d6,
    roughness: 0.8
  });

  const barriers = new THREE.Group();
  const barrierCount = 120;
  for (let i = 0; i < barrierCount; i++) {
    const u = i / barrierCount;
    const p = curve.getPointAt(u);
    const t = frames.tangents[Math.floor(u * 600)].clone();
    const L = up.clone().cross(t).normalize();

    for (const side of [1, -1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 0.6), barrierMat);
      b.position.copy(p).addScaledVector(L, (halfWidth + 2.8) * side);
      b.position.y = 0.6;
      b.rotation.y = Math.atan2(t.x, t.z);
      b.castShadow = true;
      b.receiveShadow = true;
      barriers.add(b);
    }
  }
  scene.add(barriers);

  // Start/finish gate
  const gate = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x1b2336, roughness: 0.6 });
  const bannerMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
  const postGeo = new THREE.BoxGeometry(0.6, 4.2, 0.6);
  const bannerGeo = new THREE.BoxGeometry(15, 1.1, 1.1);

  const p0 = curve.getPointAt(0);
  const t0 = frames.tangents[0].clone();
  const L0 = up.clone().cross(t0).normalize();

  const postA = new THREE.Mesh(postGeo, postMat);
  const postB = new THREE.Mesh(postGeo, postMat);
  postA.position.copy(p0).addScaledVector(L0, halfWidth * 0.92);
  postB.position.copy(p0).addScaledVector(L0, -halfWidth * 0.92);
  postA.position.y = 2.1;
  postB.position.y = 2.1;
  postA.castShadow = postB.castShadow = true;

  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.copy(p0);
  banner.position.y = 4.1;
  banner.rotation.y = Math.atan2(t0.x, t0.z);
  banner.castShadow = true;

  gate.add(postA, postB, banner);
  scene.add(gate);

  // Checkpoints: 12 evenly spaced along curve
  const checkpoints = [];
  const cpCount = 12;
  const cpGeo = new THREE.BoxGeometry(14, 4, 1);
  const cpMat = new THREE.MeshBasicMaterial({ color: 0x55a6ff, transparent: true, opacity: 0.08 });
  for (let i = 0; i < cpCount; i++) {
    const u = i / cpCount;
    const p = curve.getPointAt(u);
    const t = frames.tangents[Math.floor(u * 600)].clone();
    const box = new THREE.Mesh(cpGeo, cpMat);
    box.position.copy(p);
    box.position.y = 2;
    box.rotation.y = Math.atan2(t.x, t.z);
    box.visible = false; // set true to debug
    scene.add(box);
    checkpoints.push({ u, box });
  }

  return { curve, frames, halfWidth, checkpoints };
}

const TRACK = makeTrack();

// ---------- Car (visual + simple rigidbody-like physics) ----------
const car = new THREE.Group();
scene.add(car);

function makeCarMesh() {
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xff213b,
    roughness: 0.35,
    metalness: 0.25
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0d1020, roughness: 0.85 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x07070a, roughness: 0.95 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 4.4), bodyMat);
  body.position.y = 0.45;
  body.castShadow = true;

  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 1.6), bodyMat);
  nose.position.set(0, 0.37, 2.55);
  nose.castShadow = true;

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 1.2), darkMat);
  cockpit.position.set(0, 0.7, 0.4);
  cockpit.castShadow = true;

  const wingF = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.55), darkMat);
  wingF.position.set(0, 0.35, 3.15);
  wingF.castShadow = true;

  const wingR = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 0.55), darkMat);
  wingR.position.set(0, 0.75, -2.15);
  wingR.castShadow = true;

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelOffsets = [
    [0.95, 0.33, 1.6],
    [-0.95, 0.33, 1.6],
    [0.95, 0.33, -1.55],
    [-0.95, 0.33, -1.55]
  ];
  const wheels = wheelOffsets.map((o) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(o[0], o[1], o[2]);
    w.castShadow = true;
    return w;
  });

  const g = new THREE.Group();
  g.add(body, nose, cockpit, wingF, wingR, ...wheels);
  return { mesh: g, wheels };
}

const { mesh: carMesh, wheels } = makeCarMesh();
car.add(carMesh);

const carState = {
  // World position/orientation
  pos: new THREE.Vector3(0, 0.18, 0),
  yaw: 0,

  // Velocity in world space
  vel: new THREE.Vector3(),

  // Inputs
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: 0,

  // drivetrain
  gear: 0, // -1..6
  rpm: 1000
};

// Start at track start pointing along tangent
{
  const p0 = TRACK.curve.getPointAt(0);
  const t0 = TRACK.frames.tangents[0].clone();
  carState.pos.set(p0.x, 0.18, p0.z);
  carState.yaw = Math.atan2(t0.x, t0.z);
}

// ---------- Input ----------
const keys = new Map();
window.addEventListener("keydown", (e) => {
  keys.set(e.code, true);

  if (e.code === "KeyR") resetCar();
  if (e.code === "KeyC") cameraMode = (cameraMode + 1) % 2;
});
window.addEventListener("keyup", (e) => keys.set(e.code, false));

function key(code) {
  return keys.get(code) === true;
}

function resetCar() {
  const p = TRACK.curve.getPointAt(0);
  const t = TRACK.frames.tangents[0].clone();
  carState.pos.set(p.x, 0.18, p.z);
  carState.yaw = Math.atan2(t.x, t.z);
  carState.vel.set(0, 0, 0);
  lapState.cpIndex = 0;
  lapState.lap = 1;
  lapState.lapStart = performance.now();
}

// ---------- HUD ----------
const $spd = document.querySelector("#spd");
const $gear = document.querySelector("#gear");
const $lap = document.querySelector("#lap");
const $lapTotal = document.querySelector("#lapTotal");
const $cp = document.querySelector("#cp");
const $cpTotal = document.querySelector("#cpTotal");
const $time = document.querySelector("#time");
const $best = document.querySelector("#best");
const $last = document.querySelector("#last");

function fmtTime(ms) {
  const s = ms / 1000;
  return s.toFixed(3);
}

// ---------- Lap / Checkpoints ----------
const lapState = {
  lap: 1,
  lapTotal: 3,
  cpIndex: 0,
  lapStart: performance.now(),
  bestLap: Infinity,
  lastLap: Infinity
};

$lapTotal.textContent = String(lapState.lapTotal);
$cpTotal.textContent = String(TRACK.checkpoints.length);

// Detect passing checkpoint by distance to checkpoint plane box
function updateCheckpoints() {
  const cp = TRACK.checkpoints[lapState.cpIndex];
  if (!cp) return;

  const b = cp.box;
  // Convert car pos into checkpoint local space
  const inv = new THREE.Matrix4().copy(b.matrixWorld).invert();
  const p = carState.pos.clone().applyMatrix4(inv);
  // box half sizes: (7,2,0.5) due to geometry (14,4,1)
  const inside =
    Math.abs(p.x) < 7.0 &&
    Math.abs(p.y - 2.0) < 2.4 && // approximate height center
    Math.abs(p.z) < 0.85;

  if (inside) {
    lapState.cpIndex++;
    if (lapState.cpIndex >= TRACK.checkpoints.length) {
      // Completed lap
      const now = performance.now();
      const lapTime = now - lapState.lapStart;
      lapState.lastLap = lapTime;
      lapState.bestLap = Math.min(lapState.bestLap, lapTime);
      lapState.lapStart = now;
      lapState.cpIndex = 0;
      lapState.lap = Math.min(lapState.lap + 1, lapState.lapTotal);
    }
  }
}

// ---------- Physics (arcade-sim hybrid) ----------
function stepCar(dt) {
  // Inputs smoothing
  const targetThrottle = key("KeyW") ? 1 : 0;
  const targetBrake = key("KeyS") ? 1 : 0;
  const targetLeft = key("KeyA") ? -1 : 0;
  const targetRight = key("KeyD") ? 1 : 0;
  const targetSteer = targetLeft + targetRight;
  const targetHandbrake = key("Space") ? 1 : 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  carState.throttle = lerp(carState.throttle, targetThrottle, 1 - Math.exp(-dt * 10));
  carState.brake = lerp(carState.brake, targetBrake, 1 - Math.exp(-dt * 14));
  carState.steer = lerp(carState.steer, targetSteer, 1 - Math.exp(-dt * 18));
  carState.handbrake = lerp(carState.handbrake, targetHandbrake, 1 - Math.exp(-dt * 22));

  // Basis vectors
  const forward = new THREE.Vector3(Math.sin(carState.yaw), 0, Math.cos(carState.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);

  // Speed components in car local space
  const vF = carState.vel.dot(forward);
  const vR = carState.vel.dot(right);
  const speed = carState.vel.length();

  // Downforce increases grip with speed (F1 feel)
  const downforce = THREE.MathUtils.clamp((speed * speed) * 0.0022, 0, 14.0);

  // Engine / braking forces
  const engineForce = 52.0;      // tuned
  const brakeForce = 75.0;
  const drag = 0.018;            // aero drag
  const rolling = 0.10;          // rolling resistance

  // Steering sensitivity decreases a bit with speed
  const steerLimit = THREE.MathUtils.degToRad(24);
  const steer = carState.steer * steerLimit / (1 + speed * 0.03);

  // Yaw dynamics: turn rate based on steer and forward speed
  const turnStrength = 0.62; // base
  carState.yaw += steer * (vF / 12.0) * turnStrength * dt;

  // Longitudinal acceleration
  let aLong = carState.throttle * engineForce;
  // Brakes oppose forward motion
  aLong -= Math.sign(vF) * carState.brake * brakeForce;
  // Drag + rolling
  aLong -= vF * Math.abs(vF) * drag;
  aLong -= vF * rolling;

  // Lateral "tire" force tries to cancel sideways velocity; grip boosted by downforce
  const baseGrip = 10.5;
  const grip = baseGrip + downforce * 0.9;
  let aLat = -vR * grip;

  // Handbrake reduces lateral grip -> easier to rotate/drift
  aLat *= (1 - 0.65 * carState.handbrake);

  // Slip limiting (prevents infinite lateral correction)
  const maxLatAcc = 58 + downforce * 2.2; // higher at speed
  aLat = THREE.MathUtils.clamp(aLat, -maxLatAcc, maxLatAcc);

  // Apply accelerations in world space
  const acc = new THREE.Vector3()
    .addScaledVector(forward, aLong)
    .addScaledVector(right, aLat);

  carState.vel.addScaledVector(acc, dt);

  // Keep car on ground (no jumping in v1)
  carState.pos.addScaledVector(carState.vel, dt);
  carState.pos.y = 0.18;

  // Track "soft constraint": nudge car back toward center if it goes too far from centerline
  // We use closest point by sampling.
  const closest = closestOnCurve(TRACK.curve, carState.pos);
  const toCenter = closest.point.clone().sub(carState.pos);
  const dist = toCenter.length();
  if (dist > (TRACK.halfWidth + 5)) {
    // outside barriers -> heavy penalty + bounce
    carState.vel.multiplyScalar(0.82);
    carState.vel.addScaledVector(toCenter.normalize(), 14 * dt);
  } else if (dist > (TRACK.halfWidth + 1.2)) {
    // off-track friction
    carState.vel.multiplyScalar(1 - 1.8 * dt);
  }

  // Visual wheel spin
  const wheelSpin = vF * dt * 2.2;
  for (const w of wheels) w.rotation.x += wheelSpin;

  // Gear estimate (simple)
  const kmh = speed * 3.6;
  const g = kmh < 2 ? "N" : kmh < 28 ? "1" : kmh < 55 ? "2" : kmh < 90 ? "3" : kmh < 130 ? "4" : kmh < 180 ? "5" : "6";
  $gear.textContent = g;
  $spd.textContent = String(Math.max(0, Math.round(kmh)));
}

function closestOnCurve(curve, pos) {
  // Sample closest point (fast enough for v1)
  let bestU = 0;
  let bestD = Infinity;
  let bestP = null;

  const samples = 160;
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const p = curve.getPointAt(u);
    const d = p.distanceToSquared(pos);
    if (d < bestD) {
      bestD = d;
      bestU = u;
      bestP = p;
    }
  }
  return { u: bestU, point: bestP, dist2: bestD };
}

// ---------- Camera ----------
let cameraMode = 0; // 0 chase, 1 TV-ish
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

function stepCamera(dt) {
  const forward = new THREE.Vector3(Math.sin(carState.yaw), 0, Math.cos(carState.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);

  if (cameraMode === 0) {
    camTarget.copy(carState.pos).addScaledVector(forward, 6.0);
    camTarget.y += 1.2;

    camPos.copy(carState.pos)
      .addScaledVector(forward, -10.5)
      .addScaledVector(right, -1.8)
      .add(new THREE.Vector3(0, 5.2, 0));
  } else {
    // TV-ish: place camera near nearest curve point looking forward
    const c = closestOnCurve(TRACK.curve, carState.pos);
    const t = TRACK.frames.tangents[Math.floor(c.u * 600)]?.clone() || forward;
    const L = new THREE.Vector3(0, 1, 0).cross(t).normalize();

    camTarget.copy(carState.pos).add(new THREE.Vector3(0, 1.0, 0));
    camPos.copy(c.point)
      .addScaledVector(L, 18)
      .addScaledVector(t, -8)
      .add(new THREE.Vector3(0, 7.5, 0));
  }

  // Smooth
  camera.position.lerp(camPos, 1 - Math.exp(-dt * 6.5));
  camera.lookAt(camTarget);
}

// ---------- Render loop ----------
const clock = new THREE.Clock();

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function tick() {
  const dt = Math.min(1 / 30, clock.getDelta());

  stepCar(dt);

  // Update car mesh transform
  car.position.copy(carState.pos);
  car.rotation.y = carState.yaw;

  updateCheckpoints();

  // HUD update
  $lap.textContent = String(lapState.lap);
  $cp.textContent = String(lapState.cpIndex);
  const now = performance.now();
  $time.textContent = fmtTime(now - lapState.lapStart);
  $best.textContent = lapState.bestLap === Infinity ? "--" : fmtTime(lapState.bestLap);
  $last.textContent = lapState.lastLap === Infinity ? "--" : fmtTime(lapState.lastLap);

  stepCamera(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
