import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/PointerLockControls.js/+esm';

const scene = new THREE.Scene();
// CIELO BLU SCURO NOTTE - prima era 0x111318
scene.background = new THREE.Color(0x0a1428);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.05, 200);
camera.position.set(0, 1.65, 8.8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const R = 12.5;
const LINE_Y = 0.012;

// MODIFICA RICHIESTA: pannelli antracite tutti uguali h 3m tranne specchi centro 2.10
const PANEL_HEIGHT = 3.00;
const PANEL_RAISE = 0.12; // prima 0.20 -> ora 10/12cm come da tua specifica per vedere continuità enneagramma
const PANEL_THICKNESS = 0.10;
const PANEL_GAP = 0.10;

const CENTER_HEIGHT = 2.10; // specchi verticali centro
const CENTER_ARM_LENGTH = 2.30;
const CENTER_THICKNESS = 0.10;

const CEILING_Y = 5.80; // prima 3.35 -> più alto per dare respiro a sfera grande

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
  const den = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4);
  if (Math.abs(den) < 1e-10) throw new Error('Rette parallele');
  const A = x1 * z2 - z1 * x2;
  const B = x3 * z4 - z3 * x4;
  const x = (A * (x3 - x4) - (x1 - x2) * B) / den;
  const z = (A * (z3 - z4) - (z1 - z2) * B) / den;
  return new THREE.Vector3(x, LINE_Y, z);
}
function parallelThroughIntersection(p, v, a, b) {
  const q = new THREE.Vector3(p.x + v.x, LINE_Y, p.z + v.z);
  return lineIntersection(p, q, a, b);
}

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

// Enneagramma a pavimento - FILO D'ARIANNA 4cm nero + led continuo
const masterPaths = [
  [9, 3, 6, 9],
  [4, 2, 8, 5, 4],
  [5, 7, 1, 4]
];

function addFloorSegment(a, b) {
  const start = a.clone(); const end = b.clone();
  start.y = LINE_Y; end.y = LINE_Y;
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const len = start.distanceTo(end);
  // FASCIA NERA 4cm
  const geo = new THREE.BoxGeometry(len, 0.008, 0.04);
  const mat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(mid);
  const dx = end.x - start.x; const dz = end.z - start.z;
  mesh.rotation.y = -Math.atan2(dz, dx);
  scene.add(mesh);
  // FILO LED CONTINUO dentro fascia
  const ledGeo = new THREE.BoxGeometry(len, 0.010, 0.004);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5 });
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.position.copy(mid); led.position.y += 0.006;
  led.rotation.y = mesh.rotation.y;
  scene.add(led);
}

masterPaths.forEach(path => {
  for (let i = 0; i < path.length - 1; i++) addFloorSegment(P[path[i]], P[path[i + 1]]);
});

// Pavimento - GRIGIO CEMENTO CHIARO - prima 0x666a6d
const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(R, R, 0.12, 128),
  new THREE.MeshStandardMaterial({ color: 0xd8d6d2, roughness: 0.95, metalness: 0.02 })
);
floor.position.y = -0.06;
floor.receiveShadow = true;
scene.add(floor);

// Soffitto - VOLTA CIELO NOTTE BLU SCURO
const ceiling = new THREE.Mesh(
  new THREE.CylinderGeometry(R + 0.25, R + 0.25, 0.08, 128),
  new THREE.MeshStandardMaterial({ color: 0x0a1930, roughness: 1 })
);
ceiling.position.y = CEILING_Y;
scene.add(ceiling);

// STELLE DELICATE - non da presepe
function addStars() {
  const starCount = 600;
  const starsGeo = new THREE.BufferGeometry();
  const pos = [];
  for(let i=0;i<starCount;i++){
    const ang = Math.random()*Math.PI*2;
    const rad = Math.random()*R*0.95;
    const x = Math.cos(ang)*rad;
    const z = Math.sin(ang)*rad;
    const y = CEILING_Y - 0.04 - Math.random()*0.02;
    pos.push(x,y,z);
  }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, sizeAttenuation: true, transparent:true, opacity:0.85 });
  const stars = new THREE.Points(starsGeo, starsMat);
  scene.add(stars);
}
addStars();

// Illuminazione - più morbida, calda
scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 0.7));
const softLight = new THREE.DirectionalLight(0xfff1dd, 0.45);
softLight.position.set(3, 8, 4);
scene.add(softLight);

// 18 pannelli ANTRACITE
const panels = [
  ['I1',  'I4'], ['I1',  'I3'], ['I2',  'I3'], ['I2',  'I5'],
  [8,     'I6'], [7,     'I6'], [7,     'I10'], ['I10', 'I12'],
  ['I8',  'I16'], [5,     'I13'], ['I13', 'I18'], ['I14', 'I19'],
  [4,     'I14'], ['I17', 'I9'], [1,     'I7'], [2,     'I7'],
  [2,     'I11'], ['I11', 'I15']
];

// MATERIALE ANTRACITE - prima era bianco 0xffffff MeshBasicMaterial
const panelMaterial = new THREE.MeshStandardMaterial({
  color: 0x0e0f14,
  roughness: 0.92,
  metalness: 0.08
});

// MATERIALE FASCIA LUMINOSA - stessa larghezza testate e lati
const edgeLightMat = new THREE.MeshStandardMaterial({
  color: 0xfff0d0,
  emissive: 0xffe6b3,
  emissiveIntensity: 1.2
});

function addPanel(aName, bName) {
  const a = P[aName]; const b = P[bName];
  if (!a || !b) throw new Error(`Punto pannello non definito: ${aName} – ${bName}`);
  const dir = b.clone().sub(a); dir.y = 0;
  const len = dir.length();
  const trim = Math.min(PANEL_GAP / 2, len * 0.20);
  const unit = dir.clone().normalize();
  const start = a.clone().add(unit.clone().multiplyScalar(trim));
  const end = b.clone().add(unit.clone().multiplyScalar(-trim));
  const dx = end.x - start.x; const dz = end.z - start.z;
  const finalLen = Math.hypot(dx, dz);
  const geometry = new THREE.BoxGeometry(finalLen, PANEL_HEIGHT, PANEL_THICKNESS);
  const wall = new THREE.Mesh(geometry, panelMaterial);
  wall.position.set((start.x + end.x)/2, PANEL_RAISE + PANEL_HEIGHT/2, (start.z + end.z)/2);
  wall.rotation.y = -Math.atan2(dz, dx);
  wall.castShadow = true; wall.receiveShadow = true;
  wall.userData.name = `${aName}–${bName}`;
  scene.add(wall);

  // TESTATA LUMINOSA 7/10cm sporgente - luce calda non fredda
  const headGeo = new THREE.BoxGeometry(finalLen + 0.08, 0.08, PANEL_THICKNESS + 0.06);
  const head = new THREE.Mesh(headGeo, edgeLightMat);
  head.position.set(wall.position.x, PANEL_RAISE + PANEL_HEIGHT + 0.04, wall.position.z);
  head.rotation.y = wall.rotation.y;
  scene.add(head);
  const headLight = new THREE.PointLight(0xffddaa, 1.2, 4.5, 2);
  headLight.position.set(head.position.x, head.position.y - 0.3, head.position.z);
  scene.add(headLight);

  // FASCE LUMINOSE LATERALI stessa larghezza testate
  const sideH = PANEL_HEIGHT;
  const sideGeo = new THREE.BoxGeometry(0.02, sideH, 0.02);
  const leftSide = new THREE.Mesh(sideGeo, edgeLightMat);
  const rightSide = new THREE.Mesh(sideGeo, edgeLightMat);
  const perp = new THREE.Vector3(-Math.sin(wall.rotation.y),0,Math.cos(wall.rotation.y));
  // offset laterale
  leftSide.position.copy(start).add(new THREE.Vector3(0,PANEL_RAISE + PANEL_HEIGHT/2,0));
  leftSide.position.add(perp.clone().multiplyScalar(-0.02));
  rightSide.position.copy(end).add(new THREE.Vector3(0,PANEL_RAISE + PANEL_HEIGHT/2,0));
  rightSide.position.add(perp.clone().multiplyScalar(0.02));
  scene.add(leftSide); scene.add(rightSide);
}

panels.forEach(([a,b])=>addPanel(a,b));

// FIGURA CENTRALE - TRIANGOLO VERTICALE DI SPECCHI 2.10m - MOVIMENTO / IMMAGINE / SUONO
const centerMirrorMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.92,
  roughness: 0.12,
  transmission: 0.05,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  side: THREE.DoubleSide
});

function addCenterArm(angleDeg) {
  const a = THREE.MathUtils.degToRad(angleDeg);
  const end = new THREE.Vector3(CENTER_ARM_LENGTH*Math.cos(a),0,-CENTER_ARM_LENGTH*Math.sin(a));
  const dx = end.x; const dz = end.z; const len = Math.hypot(dx,dz);
  const geometry = new THREE.BoxGeometry(len, CENTER_HEIGHT, CENTER_THICKNESS);
  const arm = new THREE.Mesh(geometry, centerMirrorMaterial);
  arm.position.set(end.x/2, CENTER_HEIGHT/2, end.z/2);
  arm.rotation.y = -Math.atan2(dz,dx);
  arm.castShadow = true; arm.receiveShadow = true;
  scene.add(arm);
}
[150, 30, -90].forEach(addCenterArm);

// SFERA GRANDISSIMA SOSPESA FRA CIELO E TERRA SENZA SUPPORTI - COSCIENZA
// Prima era 0.45m vicino a punto 9, ora è al centro, enorme, 1.4m raggio (2.8m diametro)
const THIRD_EYE_RADIUS = 1.40;
const THIRD_EYE_CENTER_Y = 4.20; // sospesa fra terra e cielo
const thirdEyeCenter = new THREE.Vector3(0, THIRD_EYE_CENTER_Y, 0);

const thirdEyeGeometry = new THREE.IcosahedronGeometry(THIRD_EYE_RADIUS, 4);
const positions = thirdEyeGeometry.attributes.position;
for (let i=0;i<positions.count;i++){
  const v = new THREE.Vector3(positions.getX(i),positions.getY(i),positions.getZ(i));
  const variation = 1 + (Math.random()-0.5)*0.08; // più disomogeneo
  v.multiplyScalar(variation);
  positions.setXYZ(i,v.x,v.y,v.z);
}
positions.needsUpdate = true;
thirdEyeGeometry.computeVertexNormals();

const thirdEyeMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.85,
  roughness: 0.15,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  flatShading: true
});
const thirdEyeSphere = new THREE.Mesh(thirdEyeGeometry, thirdEyeMaterial);
thirdEyeSphere.position.copy(thirdEyeCenter);
scene.add(thirdEyeSphere);

// Rotazione lenta sfera - coscienza che conosce se stessa
function animateSphere(dt){
  thirdEyeSphere.rotation.y += dt*0.08;
  thirdEyeSphere.rotation.x += dt*0.03;
}

// Rimosso specchio curvo punto 9 di prova - ora è la grande fascia panoramica
// Mantengo alberi e panorama se presenti
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4b3621, roughness: 1 });
const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x27452d, roughness: 1 });
function addTree(x,z,scale=1){
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12*scale,0.16*scale,1.6*scale,12), trunkMaterial);
  trunk.position.set(x,0.8*scale,z); scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.75*scale,16,12), foliageMaterial);
  crown.position.set(x,1.9*scale,z); scene.add(crown);
}
// addTree(-0.40, R + 0.45, 0.32); // disattivati per pulizia visione orizzonte
// addTree( 0.05, R + 0.65, 0.48);
// addTree( 0.48, R + 0.50, 0.35);

// Navigazione
const controls = new PointerLockControls(camera, renderer.domElement);
let topView = false;
document.body.addEventListener('click', () => { if (!topView) controls.lock(); });
const keys = {};
addEventListener('keydown', e=>{ keys[e.code]=true; if(e.code==='KeyT'&&!e.repeat) toggleTopView(); });
addEventListener('keyup', e=>{ keys[e.code]=false; });
const savedCamera = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), up: new THREE.Vector3(0,1,0) };
function toggleTopView(){
  if(!topView){
    savedCamera.position.copy(camera.position);
    savedCamera.quaternion.copy(camera.quaternion);
    savedCamera.up.copy(camera.up);
    controls.unlock(); topView=true; ceiling.visible=false;
    camera.position.set(0,26,0); camera.up.set(0,0,-1); camera.lookAt(0,0,0);
  } else {
    topView=false; ceiling.visible=true;
    camera.up.copy(savedCamera.up); camera.position.copy(savedCamera.position); camera.quaternion.copy(savedCamera.quaternion);
  }
}
const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(),0.05);
  if(controls.isLocked && !topView){
    const speed = 3.2*dt;
    if(keys.KeyW) controls.moveForward(speed);
    if(keys.KeyS) controls.moveForward(-speed);
    if(keys.KeyA) controls.moveRight(-speed);
    if(keys.KeyD) controls.moveRight(speed);
    camera.position.y = 1.65;
    const d = Math.hypot(camera.position.x, camera.position.z);
    if(d>R-0.25){ const q=(R-0.25)/d; camera.position.x*=q; camera.position.z*=q; }
  }
  animateSphere(dt);
  renderer.render(scene,camera);
}
animate();
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

const bottoneTop = document.createElement('button');
bottoneTop.textContent = 'VISTA DALL’ALTO';
bottoneTop.style.position='fixed'; bottoneTop.style.top='20px'; bottoneTop.style.right='20px'; bottoneTop.style.zIndex='9999'; bottoneTop.style.padding='10px 16px'; bottoneTop.style.cursor='pointer';
bottoneTop.addEventListener('click', (e)=>{ e.stopPropagation(); toggleTopView(); });
document.body.appendChild(bottoneTop);

// FONDALE PANORAMICO - fascia indistinta forme colorate orizzonte - ponte con calotta stellata
const PANORAMA_DISTANCE_FROM_GALLERY = 20.0;
const PANORAMA_HEIGHT = 3.2;
const PANORAMA_BASE_Y = 0.0;
const PANORAMA_RADIUS = R + PANORAMA_DISTANCE_FROM_GALLERY;
const panoramaLoader = new THREE.TextureLoader();
const panoramaTexture = panoramaLoader.load("../images/sfondo_panorama_v definitivo.jpg");
panoramaTexture.wrapS = THREE.RepeatWrapping; panoramaTexture.wrapT = THREE.ClampToEdgeWrapping; panoramaTexture.repeat.set(1,1);
const panoramaGeometry = new THREE.CylinderGeometry(PANORAMA_RADIUS,PANORAMA_RADIUS,PANORAMA_HEIGHT,128,1,true);
const panoramaMaterial = new THREE.MeshBasicMaterial({ map: panoramaTexture, transparent:true, opacity:1.0, side:THREE.BackSide, depthWrite:false });
const panoramaBackdrop = new THREE.Mesh(panoramaGeometry,panoramaMaterial);
panoramaBackdrop.position.y = PANORAMA_BASE_Y + PANORAMA_HEIGHT/2;
scene.add(panoramaBackdrop);

// FORTUN - esempio mantenuto
const fortunLoader = new THREE.TextureLoader();
const benvenutoTexture = fortunLoader.load("../images/1975 Padova        cm. 60x80   Omaggio a       Benvenuto.jpg");
benvenutoTexture.colorSpace = THREE.SRGBColorSpace;
const d6A = P.I2; const d6B = P.I5;
const d6Dir = d6B.clone().sub(d6A); d6Dir.y=0;
const d6Center = d6A.clone().add(d6B).multiplyScalar(0.5);
const d6Unit = d6Dir.clone().normalize();
const d6Normal = new THREE.Vector3(-d6Unit.z,0,d6Unit.x).multiplyScalar(-1);
const benvenutoGeometry = new THREE.PlaneGeometry(0.84,1.12);
const benvenutoMaterial = new THREE.MeshBasicMaterial({ map: benvenutoTexture, side:THREE.DoubleSide, toneMapped:false });
const benvenutoD6 = new THREE.Mesh(benvenutoGeometry,benvenutoMaterial);
benvenutoD6.position.copy(d6Center); benvenutoD6.position.y=1.55;
benvenutoD6.position.add(d6Normal.clone().multiplyScalar(0.06));
benvenutoD6.rotation.y = -Math.atan2(d6B.z-d6A.z,d6B.x-d6A.x);
scene.add(benvenutoD6);
