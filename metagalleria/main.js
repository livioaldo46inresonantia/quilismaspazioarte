import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/PointerLockControls.js/+esm';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111318);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.05, 200);
camera.position.set(0, 1.65, 8.8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const R = 10.0;
const LINE_Y = 0.012;

const PANEL_HEIGHT = 3.00;
const PANEL_RAISE = 0.10;
const PANEL_THICKNESS = 0.10;
const PANEL_GAP = 0.10;

const CENTER_HEIGHT = 2.10;
const CENTER_ARM_LENGTH = 2.30;
const CENTER_THICKNESS = 0.10;

const CEILING_Y = 3.35;

const angles = {
  9: 90,
  1: 50,
  2: 10,
  3: -30,
  4: -70,
  5: -110,
  6: -150,
  7: 170,
  8: 130
};

function pt(deg, r = R) {
  const a = THREE.MathUtils.degToRad(deg);
  return new THREE.Vector3(
    r * Math.cos(a),
    LINE_Y,
    -r * Math.sin(a)
  );
}

const P = {};
Object.entries(angles).forEach(([k, a]) => {
  P[k] = pt(a);
});

function lineIntersection(a, b, c, d) {
  const x1 = a.x, z1 = a.z;
  const x2 = b.x, z2 = b.z;
  const x3 = c.x, z3 = c.z;
  const x4 = d.x, z4 = d.z;

  const den =
    (x1 - x2) * (z3 - z4) -
    (z1 - z2) * (x3 - x4);

  if (Math.abs(den) < 1e-10) {
    throw new Error('Rette parallele: intersezione non definita');
  }

  const A = x1 * z2 - z1 * x2;
  const B = x3 * z4 - z3 * x4;

  const x =
    (A * (x3 - x4) - (x1 - x2) * B) / den;
  const z =
    (A * (z3 - z4) - (z1 - z2) * B) / den;

  return new THREE.Vector3(x, LINE_Y, z);
}

function parallelThroughIntersection(p, v, a, b) {
  const q = new THREE.Vector3(
    p.x + v.x,
    LINE_Y,
    p.z + v.z
  );
  return lineIntersection(p, q, a, b);
}

// Punti interni I1-I15
P.I1  = lineIntersection(P[6], P[9], P[2], P[8]);
P.I2  = lineIntersection(P[9], P[3], P[7], P[1]);
P.I3  = lineIntersection(P[2], P[8], P[7], P[1]);
P.I4  = lineIntersection(P[6], P[9], P[7], P[1]);
P.I5  = lineIntersection(P[9], P[3], P[2], P[8]);
P.I6  = lineIntersection(P[8], P[5], P[7], P[1]);
P.I7  = lineIntersection(P[2], P[8], P[1], P[4]);
P.I8  = lineIntersection(P[6], P[9], P[8], P[5]);
P.I9  = lineIntersection(P[9], P[3], P[1], P[4]);
P.I10 = lineIntersection(P[6], P[9], P[5], P[7]);
P.I11 = lineIntersection(P[9], P[3], P[4], P[2]);
P.I12 = lineIntersection(P[3], P[6], P[5], P[7]);
P.I13 = lineIntersection(P[3], P[6], P[8], P[5]);
P.I14 = lineIntersection(P[3], P[6], P[1], P[4]);
P.I15 = lineIntersection(P[3], P[6], P[4], P[2]);

const sideLeft = P[6].clone().sub(P[9]);
const sideRight = P[3].clone().sub(P[9]);

P.I16 = parallelThroughIntersection(P.I3, sideLeft, P.I10, P.I11);
P.I17 = parallelThroughIntersection(P.I3, sideRight, P.I10, P.I11);

P.I18 = lineIntersection(P.I5, P[5], P.I13, P.I14);
P.I19 = lineIntersection(P.I4, P[4], P.I13, P.I14);

// Enneagramma a pavimento
const masterPaths = [
  [9, 3, 6, 9],
  [4, 2, 8, 5, 4],
  [5, 7, 1, 4]
];

function addFloorSegment(a, b) {
  const start = a.clone();
  const end = b.clone();

  start.y = LINE_Y;
  end.y = LINE_Y;

  const mid = start.clone().add(end).multiplyScalar(0.5);
  const len = start.distanceTo(end);

  const geo = new THREE.BoxGeometry(len, 0.018, 0.03);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x34383d,
    emissive: 0x34383d,
    emissiveIntensity: 0.32,
    roughness: 0.70
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(mid);

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  mesh.rotation.y = -Math.atan2(dz, dx);

  scene.add(mesh);
}

masterPaths.forEach(path => {
  for (let i = 0; i < path.length - 1; i++) {
    addFloorSegment(P[path[i]], P[path[i + 1]]);
  }
});

// Pavimento
const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(R, R, 0.12, 128),
  new THREE.MeshStandardMaterial({
    color: 0x666a6d,
    roughness: 0.95
  })
);

floor.position.y = -0.06;
floor.receiveShadow = true;
scene.add(floor);

// Soffitto
const ceiling = new THREE.Mesh(
  new THREE.CylinderGeometry(R + 0.25, R + 0.25, 0.08, 128),
  new THREE.MeshStandardMaterial({
    color: 0x20242a,
    roughness: 1
  })
);

ceiling.position.y = CEILING_Y;
scene.add(ceiling);

// Illuminazione
scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0x777777,
    0.85
  )
);

const softLight = new THREE.DirectionalLight(0xffffff, 0.55);
softLight.position.set(3, 8, 4);
scene.add(softLight);

// 18 pannelli bianchi
const panels = [
  ['I1',  'I4'],
  ['I1',  'I3'],
  ['I2',  'I3'],
  ['I2',  'I5'],
  [8,     'I6'],
  [7,     'I6'],
  [7,     'I10'],
  ['I10', 'I12'],
  ['I8',  'I16'],
  [5,     'I13'],
  ['I13', 'I18'],
  ['I14', 'I19'],
  [4,     'I14'],
  ['I17', 'I9'],
  [1,     'I7'],
  [2,     'I7'],
  [2,     'I11'],
  ['I11', 'I15']
];

const panelMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  roughness: 1.0,
  metalness: 0.0
});

function addPanel(aName, bName) {
  const a = P[aName];
  const b = P[bName];

  if (!a || !b) {
    throw new Error(`Punto pannello non definito: ${aName} – ${bName}`);
  }

  const dir = b.clone().sub(a);
  dir.y = 0;

  const len = dir.length();
  const trim = Math.min(PANEL_GAP / 2, len * 0.20);
  const unit = dir.clone().normalize();

  const start = a.clone().add(unit.clone().multiplyScalar(trim));
  const end = b.clone().add(unit.clone().multiplyScalar(-trim));

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const finalLen = Math.hypot(dx, dz);

  const geometry = new THREE.BoxGeometry(
    finalLen,
    PANEL_HEIGHT,
    PANEL_THICKNESS
  );

  const wall = new THREE.Mesh(geometry, panelMaterial);

  wall.position.set(
    (start.x + end.x) / 2,
    PANEL_RAISE + PANEL_HEIGHT / 2,
    (start.z + end.z) / 2
  );

  wall.rotation.y = -Math.atan2(dz, dx);
  wall.castShadow = true;
  wall.receiveShadow = true;
  wall.userData.name = `${aName}–${bName}`;

  scene.add(wall);
}

panels.forEach(([a, b]) => addPanel(a, b));

// Figura centrale antracite h 2,10 m
const centerMaterial = new THREE.MeshStandardMaterial({
  color: 0x25292e,
  roughness: 0.95
});

function addCenterArm(angleDeg) {
  const a = THREE.MathUtils.degToRad(angleDeg);

  const end = new THREE.Vector3(
    CENTER_ARM_LENGTH * Math.cos(a),
    0,
    -CENTER_ARM_LENGTH * Math.sin(a)
  );

  const dx = end.x;
  const dz = end.z;
  const len = Math.hypot(dx, dz);

  const geometry = new THREE.BoxGeometry(
    len,
    CENTER_HEIGHT,
    CENTER_THICKNESS
  );

  const arm = new THREE.Mesh(geometry, centerMaterial);

  arm.position.set(
    end.x / 2,
    CENTER_HEIGHT / 2,
    end.z / 2
  );

  arm.rotation.y = -Math.atan2(dz, dx);
  arm.castShadow = true;
  arm.receiveShadow = true;

  scene.add(arm);
}

// Tre bracci centrali
[150, 30, -90].forEach(addCenterArm);

// Navigazione
const controls = new PointerLockControls(camera, document.body);

let topView = false;

document.body.addEventListener('click', () => {
  if (!topView) controls.lock();
});

const keys = {};

addEventListener('keydown', e => {
  keys[e.code] = true;

  if (e.code === 'KeyT' && !e.repeat) {
    toggleTopView();
  }
});

addEventListener('keyup', e => {
  keys[e.code] = false;
});

const savedCamera = {
  position: new THREE.Vector3(),
  quaternion: new THREE.Quaternion(),
  up: new THREE.Vector3(0, 1, 0)
};

function toggleTopView() {
  if (!topView) {
    savedCamera.position.copy(camera.position);
    savedCamera.quaternion.copy(camera.quaternion);
    savedCamera.up.copy(camera.up);

    controls.unlock();
    topView = true;
ceiling.visible = false;
    camera.position.set(0, 26, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
  } else {
    topView = false;
ceiling.visible = true;
    camera.up.copy(savedCamera.up);
    camera.position.copy(savedCamera.position);
    camera.quaternion.copy(savedCamera.quaternion);
  }
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);

  if (controls.isLocked && !topView) {
    const speed = 3.2 * dt;

    if (keys.KeyW) controls.moveForward(speed);
    if (keys.KeyS) controls.moveForward(-speed);
    if (keys.KeyA) controls.moveRight(-speed);
    if (keys.KeyD) controls.moveRight(speed);

    camera.position.y = 1.65;

    const d = Math.hypot(
      camera.position.x,
      camera.position.z
    );

    if (d > 9.75) {
      const q = 9.75 / d;
      camera.position.x *= q;
      camera.position.z *= q;
    }
  }

  renderer.render(scene, camera);
}

animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

console.table(
  Object.fromEntries(
    Object.entries(P)
      .filter(([k]) => String(k).startsWith('I'))
      .map(([k, v]) => [
        k,
        {
          x: Number(v.x.toFixed(6)),
          z: Number(v.z.toFixed(6))
        }
      ])
  )
);
const bottoneTop = document.createElement('button');
bottoneTop.textContent = 'VISTA DALL’ALTO';
bottoneTop.style.position = 'fixed';
bottoneTop.style.top = '20px';
bottoneTop.style.right = '20px';
bottoneTop.style.zIndex = '9999';
bottoneTop.style.padding = '10px 16px';
bottoneTop.style.cursor = 'pointer';

bottoneTop.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleTopView();
});


document.body.appendChild(bottoneTop);

// PLAFONIERE LINEARI CON LUCE CALDA
const LIGHT_HEIGHT = 2.80;
const LIGHT_THICKNESS = 0.035;
const LIGHT_DEPTH = 0.10;

const lightMaterial = new THREE.MeshBasicMaterial({
  color: 0xffe6b3
});

function addLinearLight(aName, bName) {
  const a = P[aName];
  const b = P[bName];

  if (!a || !b) return;

  const dir = b.clone().sub(a);
  dir.y = 0;

  const len = dir.length();
  const trim = Math.min(PANEL_GAP / 2, len * 0.20);
  const unit = dir.clone().normalize();

  const start = a.clone().add(
    unit.clone().multiplyScalar(trim)
  );

  const end = b.clone().add(
    unit.clone().multiplyScalar(-trim)
  );

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const finalLen = Math.hypot(dx, dz);

  // Corpo visibile della plafoniera
  const fixture = new THREE.Mesh(
    new THREE.BoxGeometry(
      finalLen - 0.30,
      LIGHT_THICKNESS,
      LIGHT_DEPTH
    ),
    lightMaterial
  );

  fixture.position.set(
    (start.x + end.x) / 2,
    LIGHT_HEIGHT,
    (start.z + end.z) / 2
  );

  fixture.rotation.y = -Math.atan2(dz, dx);

  scene.add(fixture);
fixture.visible = false
  // Luce calda reale
  const warmLight = new THREE.PointLight(
    0xffd6a3,
    4,
    3.5,
    2
  );

  warmLight.position.set(
    fixture.position.x,
    2.65,
    fixture.position.z
  );

  scene.add(warmLight);
}

panels.forEach(([a, b]) => {
  addLinearLight(a, b);
});

// Scorcio vetrato di prova
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xbfd7e6,
  transparent: true,
  opacity: 0.22,
  roughness: 0.08,
  transmission: 0.75,
  thickness: 0.08
});

const glassTest = new THREE.Mesh(
  new THREE.BoxGeometry(3.0, 2.6, 0.06),
  glassMaterial
);

glassTest.position.set(0, 1.40, -9.75);

scene.add(glassTest);
// Natura di prova oltre il bordo
const trunkMaterial = new THREE.MeshStandardMaterial({
  color: 0x4b3621,
  roughness: 1
});


const foliageMaterial = new THREE.MeshStandardMaterial({
  color: 0x27452d,
  roughness: 1
});


function addTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.12 * scale,
      0.16 * scale,
      1.6 * scale,
      12
    ),
    trunkMaterial
  );


  trunk.position.set(x, 0.8 * scale, z);
  scene.add(trunk);


  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.75 * scale, 16, 12),
    foliageMaterial
  );


  crown.position.set(
    x,
    1.9 * scale,
    z
  );


  scene.add(crown);
}


addTree(-2.2, -12.0, 1.2);
addTree(0.0, -13.5, 1.6);
addTree(2.4, -12.4, 1.0);

// Terzo Occhio - sfera di prova
const thirdEyeCenter = new THREE.Vector3(
  P[9].x,
  3.20,
  P[9].z
);
const thirdEyeSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.65, 48, 32),
  new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 1,
    roughness: 0.08
  })
);

thirdEyeSphere.position.copy(thirdEyeCenter);
scene.add(thirdEyeSphere);

// Espositore triangolare in vetro - primo lato
const glassShape = new THREE.Shape();

glassShape.moveTo(P[5].x, P[5].z);
glassShape.lineTo(P[13].x, P[13].z);
glassShape.lineTo(P[18].x, P[18].z);
glassShape.closePath();

const glassGeometry = new THREE.ShapeGeometry(glassShape);

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.22,
  transmission: 0.85,
  roughness: 0.08,
  metalness: 0,
  side: THREE.DoubleSide
});

const glassTable1 = new THREE.Mesh(
  glassGeometry,
  glassMaterial
);

glassTable1.rotation.x = Math.PI / 2;
glassTable1.position.y = 0.85;

scene.add(glassTable1);


