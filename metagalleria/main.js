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

const R = 12.5;
const LINE_Y = 0.012;

const PANEL_HEIGHT = 3.00;
const PANEL_RAISE = 0.20;
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
floor.visible = true;
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
  toneMapped: false
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
const controls = new PointerLockControls(camera, renderer.domElement);

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

if (d > R - 0.25) {
  const q = (R - 0.25) / d;
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

// ======================================================
// SPECCHIO CURVO DEL PUNTO 9
// sostituisce il vecchio "scorcio vetrato di prova"
// segue la curvatura della circonferenza della galleria
// ======================================================

const MIRROR_RADIUS = R;
const MIRROR_HEIGHT = 2.60;
const MIRROR_WIDTH = 3.20;

// larghezza trasformata in angolo di circonferenza
const MIRROR_ANGLE =
  MIRROR_WIDTH / MIRROR_RADIUS;

// il punto 9 corrisponde alla direzione posteriore del cerchio
const MIRROR_CENTER_ANGLE = Math.PI;

const mirrorGeometry =
  new THREE.CylinderGeometry(
    MIRROR_RADIUS,
    MIRROR_RADIUS,
    MIRROR_HEIGHT,
    48,
    1,
    true,
    MIRROR_CENTER_ANGLE - MIRROR_ANGLE / 2,
    MIRROR_ANGLE
  );
// Piccolo raccordo della parte superiore dello specchio
const mirrorPos = mirrorGeometry.attributes.position;

for (let i = 0; i < mirrorPos.count; i++) {

  const y = mirrorPos.getY(i);

  // agiamo soltanto sul bordo superiore
  if (y > MIRROR_HEIGHT / 2 - 0.01) {

    const x = mirrorPos.getX(i);
    const z = mirrorPos.getZ(i);

    const angle = Math.atan2(x, z);

    let delta = angle - MIRROR_CENTER_ANGLE;

    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;

const t = Math.min(
  1,
  Math.abs(delta) / (MIRROR_ANGLE / 2)
);

    // taglio leggerissimo e morbido verso le estremità
const cut = 0.04 * (1 - t) * (1 - t);

    mirrorPos.setY(i, y - cut);
  }
}

mirrorPos.needsUpdate = true;
mirrorGeometry.computeVertexNormals();
// SPECCHIO CURVO - PROVA STATICA SICURA
// Per ora verifichiamo soltanto forma, posizione e curvatura.

const curvedMirrorMaterial =
  new THREE.MeshPhysicalMaterial({
    color: 0xbfc3c7,
    metalness: 0.75,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide
  });

const curvedMirror =
  new THREE.Mesh(
    mirrorGeometry,
    curvedMirrorMaterial
  );

curvedMirror.position.y = 1.40;

scene.add(curvedMirror);
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


addTree(-0.40, R + 0.45, 0.32);
addTree( 0.05, R + 0.65, 0.48);
addTree( 0.48, R + 0.50, 0.35);

// Terzo Occhio - sfera a specchi
// diametro 90 cm - quota inferiore 2.70 m
// centro 3.15 m - sommità 3.60 m

const THIRD_EYE_RADIUS = 0.45;
const THIRD_EYE_CENTER_Y = 3.15;
const THIRD_EYE_INSET = 1.30;

// dal punto 9 verso l'interno della galleria
const thirdEyeDirection = P[9].clone().normalize();

const thirdEyeCenter = new THREE.Vector3(
  P[9].x - thirdEyeDirection.x * THIRD_EYE_INSET,
  THIRD_EYE_CENTER_Y,
  P[9].z - thirdEyeDirection.z * THIRD_EYE_INSET
);

// Sfera del Terzo Occhio - specchi irregolari
const thirdEyeGeometry =
  new THREE.IcosahedronGeometry(THIRD_EYE_RADIUS, 4);

// Rendiamo leggermente irregolari le facce
const positions =
  thirdEyeGeometry.attributes.position;

for (let i = 0; i < positions.count; i++) {

  const v = new THREE.Vector3(
    positions.getX(i),
    positions.getY(i),
    positions.getZ(i)
  );

  const variation =
    1 + (Math.random() - 0.5) * 0.018;

  v.multiplyScalar(variation);

  positions.setXYZ(i, v.x, v.y, v.z);
}

positions.needsUpdate = true;
thirdEyeGeometry.computeVertexNormals();

const thirdEyeMaterial =
  new THREE.MeshPhysicalMaterial({
   color: 0xffffff,
metalness: 0.75,
roughness: 0.22,
clearcoat: 1.0,
clearcoatRoughness: 0.08,
flatShading: true
  });

const thirdEyeSphere =
  new THREE.Mesh(
    thirdEyeGeometry,
    thirdEyeMaterial
  );

thirdEyeSphere.position.copy(thirdEyeCenter);
scene.add(thirdEyeSphere);
// ======================================================
// TECHE TRIANGOLARI IN VETRO
// 5 - I13 - I18   e   4 - I14 - I19
// vetro spessore 5 mm
// lastra inferiore h = 0.70 m
// lastra superiore h = 0.75 m
// ======================================================

const GLASS_THICKNESS = 0.005;
const LOWER_HEIGHT = 0.70;
const UPPER_HEIGHT = 0.75;
const EDGE_INSET = 0.05;


// ------------------------------------------------------
// MATERIALI VETRO
// ------------------------------------------------------

// Lastra superiore: vetro limpido trasparente
const upperGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.16,
  transmission: 0.95,
  roughness: 0.03,
  metalness: 0,
  thickness: GLASS_THICKNESS,
  side: THREE.DoubleSide
});

// Lastra inferiore: vetro opalino opaco satinato
const lowerGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xf4f4f0,
  transparent: false,
  opacity: 1.0,
  transmission: 0.0,
  roughness: 0.65,
  metalness: 0,
  thickness: GLASS_THICKNESS,
  side: THREE.DoubleSide
});


// ======================================================
// TECA SINISTRA
// 5 - I13 - I18
// ======================================================

const leftInset5 =
  P[5].clone().lerp(P.I13, EDGE_INSET);

const leftInset18 =
  P.I18.clone().lerp(P.I13, EDGE_INSET);
const leftShape = new THREE.Shape();

leftShape.moveTo(
  leftInset5.x,
  leftInset5.z
);

leftShape.lineTo(
  P.I13.x,
  P.I13.z
);

leftShape.lineTo(
  leftInset18.x,
  leftInset18.z
);

leftShape.closePath();

const leftGlassGeometry =
  new THREE.ExtrudeGeometry(leftShape, {
    depth: GLASS_THICKNESS,
    bevelEnabled: false
  });


// Lastra inferiore sinistra - OPALINA
const leftGlassLower = new THREE.Mesh(
  leftGlassGeometry,
  lowerGlassMaterial
);

leftGlassLower.rotation.x = -Math.PI / 2;
leftGlassLower.scale.y = -1;
leftGlassLower.position.y = LOWER_HEIGHT;

scene.add(leftGlassLower);


// Lastra superiore sinistra - TRASPARENTE
const leftGlassUpper = new THREE.Mesh(
  leftGlassGeometry,
  upperGlassMaterial
);

leftGlassUpper.rotation.x = -Math.PI / 2;
leftGlassUpper.scale.y = -1;
leftGlassUpper.position.y = UPPER_HEIGHT;
scene.add(leftGlassUpper);


// ======================================================
// TECA DESTRA
// 4 - I14 - I19
// ======================================================

const rightInset4 =
  P[4].clone().lerp(P.I14, EDGE_INSET);

const rightInset19 =
  P.I19.clone().lerp(P.I14, EDGE_INSET);

const rightShape = new THREE.Shape();

rightShape.moveTo(
  rightInset4.x,
  rightInset4.z
);

rightShape.lineTo(
  P.I14.x,
  P.I14.z
);

rightShape.lineTo(
  rightInset19.x,
  rightInset19.z
);

rightShape.closePath();

const rightGlassGeometry =
  new THREE.ExtrudeGeometry(rightShape, {
    depth: GLASS_THICKNESS,
    bevelEnabled: false
  });


// Lastra inferiore destra - OPALINA
const rightGlassLower = new THREE.Mesh(
  rightGlassGeometry,
  lowerGlassMaterial
);

rightGlassLower.rotation.x = -Math.PI / 2;
rightGlassLower.scale.y = -1;
rightGlassLower.position.y = LOWER_HEIGHT;

scene.add(rightGlassLower);


// Lastra superiore destra - TRASPARENTE
const rightGlassUpper = new THREE.Mesh(
  rightGlassGeometry,
  upperGlassMaterial
);

rightGlassUpper.rotation.x = -Math.PI / 2;
rightGlassUpper.scale.y = -1;
rightGlassUpper.position.y = UPPER_HEIGHT;

scene.add(rightGlassUpper);
// ======================================================
// FONDALE PANORAMICO CIRCOLARE ESTERNO
// MODULO AGGIUNTIVO - NON MODIFICA LA METAGALLERIA
// Unica texture continua: sfondo_panorama_v8.jpg
// ======================================================


// ------------------------------------------------------
// PARAMETRI REGOLABILI
// ------------------------------------------------------

const PANORAMA_DISTANCE_FROM_GALLERY = 20.0;  // distanza dal limite galleria
const PANORAMA_HEIGHT = 3.2;                  // altezza complessiva
const PANORAMA_BASE_Y = 0.0;                  // parte dal livello del terreno
const PANORAMA_OPACITY = 1.0;                 // visibilità
const PANORAMA_ROTATION = 0.0;                // rotazione panoramica


// ------------------------------------------------------
// RAGGIO DEL FONDALE
// ------------------------------------------------------

const PANORAMA_RADIUS =
  R + PANORAMA_DISTANCE_FROM_GALLERY;


// ------------------------------------------------------
// CARICAMENTO DELL'UNICA IMMAGINE PANORAMICA
// ------------------------------------------------------

const panoramaLoader = new THREE.TextureLoader();

const panoramaTexture =
panoramaLoader.load("../images/sfondo_panorama_v definitivo.jpg");
panoramaTexture.wrapS = THREE.RepeatWrapping;
panoramaTexture.wrapT = THREE.ClampToEdgeWrapping;

panoramaTexture.repeat.set(1, 1);


// ------------------------------------------------------
// CILINDRO PANORAMICO CONTINUO - RIPRISTINO
// ------------------------------------------------------

const panoramaGeometry =
  new THREE.CylinderGeometry(
    PANORAMA_RADIUS,
    PANORAMA_RADIUS,
    PANORAMA_HEIGHT,
    128,
    1,
    true
  );

// ------------------------------------------------------
// MATERIALE
// ------------------------------------------------------

const panoramaMaterial =
  new THREE.MeshBasicMaterial({
    map: panoramaTexture,
    transparent: true,
    opacity: PANORAMA_OPACITY,
    side: THREE.BackSide,
    depthWrite: false
  });

// ------------------------------------------------------
// CREAZIONE FONDALE
// ------------------------------------------------------

const panoramaBackdrop =
  new THREE.Mesh(
    panoramaGeometry,
    panoramaMaterial
  );

panoramaBackdrop.position.y =
  PANORAMA_BASE_Y + PANORAMA_HEIGHT / 2;

panoramaBackdrop.rotation.y =
  PANORAMA_ROTATION;


// ------------------------------------------------------
// AGGIUNTA ALLA SCENA
// ------------------------------------------------------

scene.add(panoramaBackdrop);

