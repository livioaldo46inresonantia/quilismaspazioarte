import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01031a);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.05, 500);
camera.position.set(0, 1.70, 11.75);
camera.lookAt(0, 1.70, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
document.body.appendChild(renderer.domElement);

const R = 12.5;
const LINE_Y = 0.012;

const PANEL_HEIGHT = 3.00;
const PANEL_RAISE = 0.12;
const PANEL_THICKNESS = 0.10;
const PANEL_GAP = 0.10;

const CENTER_HEIGHT = 2.10;
const CENTER_ARM_LENGTH = 2.30;
const CENTER_THICKNESS = 0.10;

const angles = { 9: 90, 1: 50, 2: 10, 3: -30, 4: -70, 5: -110, 6: -150, 7: 170, 8: 130 };

function pt(deg, r = R){
  const a = THREE.MathUtils.degToRad(deg);
  return new THREE.Vector3(r*Math.cos(a), LINE_Y, -r*Math.sin(a));
}

const P = {};
Object.entries(angles).forEach(([k,a])=>{ P[k]=pt(a); });

function lineIntersection(a,b,c,d){
  const x1=a.x,z1=a.z,x2=b.x,z2=b.z,x3=c.x,z3=c.z,x4=d.x,z4=d.z;
  const den=(x1-x2)*(z3-z4)-(z1-z2)*(x3-x4);
  if(Math.abs(den)<1e-10) throw new Error('Rette parallele');
  const A=x1*z2-z1*x2,B=x3*z4-z3*x4;
  return new THREE.Vector3(
    (A*(x3-x4)-(x1-x2)*B)/den,
    LINE_Y,
    (A*(z3-z4)-(z1-z2)*B)/den
  );
}

function parallelThroughIntersection(p,v,a,b){
  const q=new THREE.Vector3(p.x+v.x,LINE_Y,p.z+v.z);
  return lineIntersection(p,q,a,b);
}

P.I1=lineIntersection(P[6],P[9],P[2],P[8]);
P.I2=lineIntersection(P[9],P[3],P[7],P[1]);
P.I3=lineIntersection(P[2],P[8],P[7],P[1]);
P.I4=lineIntersection(P[6],P[9],P[7],P[1]);
P.I5=lineIntersection(P[9],P[3],P[2],P[8]);
P.I6=lineIntersection(P[8],P[5],P[7],P[1]);
P.I7=lineIntersection(P[2],P[8],P[1],P[4]);
P.I8=lineIntersection(P[6],P[9],P[8],P[5]);
P.I9=lineIntersection(P[9],P[3],P[1],P[4]);
P.I10=lineIntersection(P[6],P[9],P[5],P[7]);
P.I11=lineIntersection(P[9],P[3],P[4],P[2]);
P.I12=lineIntersection(P[3],P[6],P[5],P[7]);
P.I13=lineIntersection(P[3],P[6],P[8],P[5]);
P.I14=lineIntersection(P[3],P[6],P[1],P[4]);
P.I15=lineIntersection(P[3],P[6],P[4],P[2]);

const sideLeft=P[6].clone().sub(P[9]);
const sideRight=P[3].clone().sub(P[9]);

P.I16=parallelThroughIntersection(P.I3,sideLeft,P.I10,P.I11);
P.I17=parallelThroughIntersection(P.I3,sideRight,P.I10,P.I11);
P.I18=lineIntersection(P.I5,P[5],P.I13,P.I14);
P.I19=lineIntersection(P.I4,P[4],P.I13,P.I14);

const masterPaths=[[9,3,6,9],[4,2,8,5,4],[5,7,1,4]];
// LED CALDI PUNTIFORMI CON ALONE LUMINOSO
const LED_CORE_COLOR = 0xfff0bd;
const LED_GLOW_COLOR = 0xff9b32;
const LED_SPACING = 0.065;
const LED_RADIUS = 0.028;

const ledDotGeometry =
  new THREE.SphereGeometry(LED_RADIUS,10,8);

const ledDotMaterial =
  new THREE.MeshBasicMaterial({
    color:LED_CORE_COLOR,
    toneMapped:false
  });

const ledGlowMaterial =
  new THREE.MeshBasicMaterial({
    color:LED_GLOW_COLOR,
    transparent:true,
    opacity:0.30,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
    toneMapped:false
  });

function addFloorSegment(a,b){
  const start=a.clone();
  const end=b.clone();

  start.y=LINE_Y;
  end.y=LINE_Y;

  const mid=start.clone()
    .add(end)
    .multiplyScalar(0.5);

  const len=start.distanceTo(end);

  const rotation=
    -Math.atan2(
      end.z-start.z,
      end.x-start.x
    );

  // Sede scura sottile
  const base=new THREE.Mesh(
    new THREE.BoxGeometry(len,0.008,0.055),
    new THREE.MeshStandardMaterial({
      color:0x17120d,
      roughness:0.82
    })
  );

  base.position.copy(mid);
  base.rotation.y=rotation;
  scene.add(base);

  // Alone ampio e trasparente sul pavimento
  const glow=new THREE.Mesh(
    new THREE.BoxGeometry(len,0.006,0.26),
    ledGlowMaterial
  );

  glow.position.copy(mid);
  glow.position.y=LINE_Y+0.009;
  glow.rotation.y=rotation;
  scene.add(glow);

  // Nuclei luminosi puntiformi
  const numberOfDots=
    Math.max(
      2,
      Math.ceil(len/LED_SPACING)
    );

  const dots=new THREE.InstancedMesh(
    ledDotGeometry,
    ledDotMaterial,
    numberOfDots+1
  );

  const dummy=new THREE.Object3D();

  for(let i=0;i<=numberOfDots;i++){
    const t=i/numberOfDots;

    dummy.position
      .copy(start)
      .lerp(end,t);

    dummy.position.y=LINE_Y+0.027;
    dummy.updateMatrix();

    dots.setMatrixAt(i,dummy.matrix);
  }

  dots.instanceMatrix.needsUpdate=true;
  scene.add(dots);

  // Luce reale, calda e uniforme
  const warmLight=new THREE.PointLight(
    LED_GLOW_COLOR,
    3.2,
    5.2,
    2
  );

  warmLight.position.copy(mid);
  warmLight.position.y=0.20;
  scene.add(warmLight);
}

masterPaths.forEach(path=>{
  for(let i=0;i<path.length-1;i++) addFloorSegment(P[path[i]],P[path[i+1]]);
});

const floor=new THREE.Mesh(
  new THREE.CylinderGeometry(R,R,0.12,128),
  new THREE.MeshStandardMaterial({color:0xbebebe,roughness:0.85})
);
floor.position.y=-0.06;
floor.receiveShadow=true;
scene.add(floor);

const ceilingGeo=new THREE.SphereGeometry(45, 64, 32, 0, Math.PI*2, 0, Math.PI*0.52);
const ceilingMat=new THREE.MeshBasicMaterial({color:0x01031a,side:THREE.BackSide,toneMapped:false});
const ceiling=new THREE.Mesh(ceilingGeo, ceilingMat);
ceiling.position.y = -8;
scene.add(ceiling);

function addStars(){
  const starCount=240;
  const starsGeo=new THREE.BufferGeometry();
  const pos=[];
  for(let i=0;i<starCount;i++){
    const ang=Math.random()*Math.PI*2;
    const rad= R + 14 + Math.random()*42;
    const y = 11 + Math.random()*26;
    const x=Math.cos(ang)*rad, z= -Math.sin(ang)*rad;
    pos.push(x,y,z);
  }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  const starsMat=new THREE.PointsMaterial({
    color:0xffffff,
   size:0.055,
    sizeAttenuation:true,
    transparent:true,
    opacity:0.72
  });
  scene.add(new THREE.Points(starsGeo,starsMat));
}
addStars();
// AURORA BOREALE LEGGERA NEL CIELO
function addAurora(){
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 500;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  const colors = [
    'rgba(70,255,190,0.18)',
    'rgba(60,210,255,0.14)',
    'rgba(150,90,255,0.10)'
  ];

  colors.forEach((color, layer) => {
    ctx.beginPath();

    for(let x = 0; x <= canvas.width; x += 8){
      const y =
        245 +
        Math.sin(x * 0.009 + layer * 1.8) * 55 +
        Math.sin(x * 0.021) * 20 +
        layer * 26;

      if(x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 65 - layer * 12;
    ctx.shadowColor = color;
    ctx.shadowBlur = 45;
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = 1;

  const geometry = new THREE.CylinderGeometry(
    37, 37, 18, 128, 1, true
  );

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.65,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });

  const aurora = new THREE.Mesh(geometry, material);
  aurora.position.y = 13.5;
  aurora.rotation.y = 0.35;
  scene.add(aurora);
}
// addAurora();

// FONDALE PANORAMICO CIRCOLARE ESTERNO
const PANORAMA_DISTANCE_FROM_GALLERY = 20.0;
const PANORAMA_HEIGHT = 3.2;
const PANORAMA_BASE_Y = 0.0;
const PANORAMA_OPACITY = 1.0;
const PANORAMA_ROTATION = 0.0;

const PANORAMA_RADIUS =
  R + PANORAMA_DISTANCE_FROM_GALLERY;

const panoramaLoader = new THREE.TextureLoader();

const panoramaTexture =
  panoramaLoader.load("../images/sfondo_panorama_v definitivo.jpg");

panoramaTexture.wrapS = THREE.RepeatWrapping;
panoramaTexture.wrapT = THREE.ClampToEdgeWrapping;
panoramaTexture.repeat.set(1, 1);

const panoramaGeometry =
  new THREE.CylinderGeometry(
    PANORAMA_RADIUS,
    PANORAMA_RADIUS,
    PANORAMA_HEIGHT,
    128,
    1,
    true
  );

const panoramaMaterial =
  new THREE.MeshBasicMaterial({
    map: panoramaTexture,
    transparent: true,
    opacity: PANORAMA_OPACITY,
    side: THREE.BackSide,
    depthWrite: false
  });

const panoramaBackdrop =
  new THREE.Mesh(
    panoramaGeometry,
    panoramaMaterial
  );

panoramaBackdrop.position.y =
  PANORAMA_BASE_Y + PANORAMA_HEIGHT / 2;

panoramaBackdrop.rotation.y =
  PANORAMA_ROTATION;

scene.add(panoramaBackdrop);
scene.add(new THREE.HemisphereLight(0xdde6ff, 0x1a2a44, 1.2));

const softLight=new THREE.DirectionalLight(0xfff1dd, 0.9);
softLight.position.set(3,8,4);
scene.add(softLight);
// TRE ALBERELLI STILIZZATI DIETRO L’INGRESSO 4–5
const trunkMaterial = new THREE.MeshStandardMaterial({
  color: 0x4b3621,
  roughness: 1
});

const foliageMaterial = new THREE.MeshStandardMaterial({
  color: 0x27452d,
  roughness: 1
});

function addTree(x, z, scale = 1){
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.12 * scale,
      0.16 * scale,
      1.6 * scale,
      12
    ),
    trunkMaterial
  );

  trunk.position.set(
    x,
    0.8 * scale,
    z
  );

  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.75 * scale,
      16,
      12
    ),
    foliageMaterial
  );

  crown.position.set(
    x,
    1.9 * scale,
    z
  );

  scene.add(crown);
}

// PICCOLO PARCO STILIZZATO OLTRE L’INGRESSO

// Prima fila
addTree(-2.20, R + 1.60, 0.88);
addTree( 0.10, R + 1.80, 1.18);
addTree( 2.35, R + 1.55, 0.92);

// Seconda fila
addTree(-4.10, R + 3.10, 1.05);
addTree(-1.25, R + 3.45, 0.82);
addTree( 1.55, R + 3.30, 1.08);
addTree( 4.25, R + 3.00, 0.86);

// Terza fila
addTree(-3.00, R + 5.00, 0.78);
addTree( 0.35, R + 5.25, 1.28);
addTree( 3.40, R + 4.85, 0.96);
const panels=[
  ['I1','I4'],['I1','I3'],['I2','I3'],['I2','I5'],
  [8,'I6'],[7,'I6'],[7,'I10'],['I10','I12'],
  ['I8','I16'],[5,'I13'],['I13','I18'],['I14','I19'],
  [4,'I14'],['I17','I9'],[1,'I7'],[2,'I7'],
  [2,'I11'],['I11','I15']
];

const panelMaterial=new THREE.MeshStandardMaterial({
  color:0x373a3f,
  roughness:0.85,
  metalness:0.04,
  emissive:0x373a3f,
  emissiveIntensity:0.20
});

const edgeLightMat=new THREE.MeshStandardMaterial({
  color:0xfff0d0,
  emissive:0xffe6b3,
  emissiveIntensity:1.4
});

const LATERAL_WIDTH = 0.08;
const panelRegistry = new Map();

function panelKey(a,b){ return `${a}|${b}`; }

function addPanel(aName,bName){
  const a=P[aName],b=P[bName];
  if(!a||!b) return;

  const dir=b.clone().sub(a);
  dir.y=0;
  const len=dir.length();
  const trim=Math.min(PANEL_GAP/2,len*0.20);
  const unit=dir.clone().normalize();

  const start=a.clone().add(unit.clone().multiplyScalar(trim));
  const end=b.clone().add(unit.clone().multiplyScalar(-trim));

  const midX=(start.x+end.x)/2;
  const midZ=(start.z+end.z)/2;
  const finalLen=Math.hypot(end.x-start.x,end.z-start.z);
  const rotY=-Math.atan2(end.z-start.z,end.x-start.x);

  const wall=new THREE.Mesh(
    new THREE.BoxGeometry(finalLen,PANEL_HEIGHT,PANEL_THICKNESS),
    panelMaterial
  );
  wall.position.set(midX,PANEL_RAISE+PANEL_HEIGHT/2,midZ);
  wall.rotation.y=rotY;
  scene.add(wall);

  const sideGeo=new THREE.BoxGeometry(LATERAL_WIDTH,PANEL_HEIGHT,0.04);

  const leftLight=new THREE.Mesh(sideGeo,edgeLightMat);
  leftLight.position.set(start.x,PANEL_RAISE+PANEL_HEIGHT/2,start.z);
  leftLight.rotation.y=rotY;
  scene.add(leftLight);

  const rightLight=new THREE.Mesh(sideGeo,edgeLightMat);
  rightLight.position.set(end.x,PANEL_RAISE+PANEL_HEIGHT/2,end.z);
  rightLight.rotation.y=rotY;
  scene.add(rightLight);

  panelRegistry.set(panelKey(aName,bName),{
    start,end,midX,midZ,rotY,width:finalLen,wall
  });
}

panels.forEach(([a,b])=>addPanel(a,b));

const clickableArtworks=[];
const textureLoader=new THREE.TextureLoader();

function addPanelFaceImage(aName,bName,imageUrl,options={}){
  const info=panelRegistry.get(panelKey(aName,bName));
  if(!info) return;

  const panelWidth=options.panelWidth ?? 3.30;
  const panelHeight=options.panelHeight ?? 3.00;

  const normal=new THREE.Vector3(
    Math.sin(info.rotY),0,Math.cos(info.rotY)
  );

  const toCenter=new THREE.Vector3(-info.midX,0,-info.midZ);
  const centerSign=normal.dot(toCenter)>=0 ? 1 : -1;
  const faceSign=options.face==='opposite' ? -centerSign : centerSign;

 const texture=new THREE.TextureLoader().load(imageUrl);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=renderer.capabilities.getMaxAnisotropy();

  const face=new THREE.Mesh(
    new THREE.PlaneGeometry(panelWidth,panelHeight),
  new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide,toneMapped:false})
  );

  face.rotation.y=info.rotY+(faceSign<0 ? Math.PI : 0);

  const offset=PANEL_THICKNESS/2+0.006;
  face.position.set(
    info.midX+normal.x*offset*faceSign,
    PANEL_RAISE+panelHeight/2,
    info.midZ+normal.z*offset*faceSign
  );
  scene.add(face);

  const hit=new THREE.Mesh(
    new THREE.PlaneGeometry(1.50,2.00),
    new THREE.MeshBasicMaterial({
      transparent:true,
      opacity:0,
      side:THREE.DoubleSide,
      depthWrite:false
    })
  );

  hit.rotation.y=face.rotation.y;

  const tangent=new THREE.Vector3(
    Math.cos(info.rotY),0,-Math.sin(info.rotY)
  );

  const visualXSign=faceSign>0 ? 1 : -1;

  hit.position.set(
    face.position.x+tangent.x*(-0.30)*visualXSign+normal.x*0.002*faceSign,
    PANEL_RAISE+1.50,
    face.position.z+tangent.z*(-0.30)*visualXSign+normal.z*0.002*faceSign
  );

  hit.userData={
    type:'artwork',
    title:'Omaggio a Benvenuto',
    artist:'Antonio Fortún',
    details:'Padova, 1975 · Acrilico su tela · 60 × 80 cm'
  };

  scene.add(hit);
  clickableArtworks.push(hit);
}

// D15 — MAPPA DELLA METAGALLERIA
addPanelFaceImage(
  'I14','I19',
  './PANNELLO D15 MAPPA.jpg',
  {panelWidth:3.30,panelHeight:3.00,face:'opposite'}
);

// S15 — OMAGGIO A BENVENUTO
addPanelFaceImage(
  'I14','I19',
  '../images/D15_OMAGGIO_A_BENVENUTO.jpg',
  {panelWidth:3.30,panelHeight:3.00,face:'center'}
);
// 17D — ANTONIO FORTÚN, FOTO E PAROLE
addPanelFaceImage(
  5,'I13',
  '../images/17D_FORTUN_FOTO_ALTRI_20CM_DESTRA_SOLO_PIL.jpg',
  {panelWidth:5.50,panelHeight:3.00,face:'center'}
);
// D1 — OMAGGIO A LIVIO — segmento I10-I12
addPanelFaceImage(
  'I10','I12',
  './PANNELLO_373A3F_CORNICE_NERA_GROSSA_OMAGGIO_LIVIO.jpg',
  {panelWidth:3.30,panelHeight:3.00,face:'center'}
);
// D2 — PALEOCAPA — segmento I8-I16
addPanelFaceImage(
  'I8','I16',
  './PANNELLO_D2_ULTIME_DUE_FOTO.jpg',
  {panelWidth:4.40,panelHeight:3.00,face:'center'}
);
// S13 — PALEOCAPA — segmento I9-I17
addPanelFaceImage(
  'I17','I9',
  './PANNELLO S 13 -.jpg',
 {panelWidth:4.40,panelHeight:3.00,face:'center'}
);
// D4 — PALEOCAPA — segmento 7-I6
addPanelFaceImage(
  7,'I6',
  './PANNELLO D4  7 - I6.jpg',
  {panelWidth:4.80,panelHeight:3.00,face:'center'}
);
// S11 — PALEOCAPA — segmento 2-I7
addPanelFaceImage(
  2,'I7',
  './PANNELLO_S11  2 - I7.jpg',
  {panelWidth:4.80,panelHeight:3.00,face:'center'}
);
// D18 — segmento I13-I18
addPanelFaceImage(
  'I13','I18',
  './D18  I13 - I18.jpg',
  {panelWidth:3.30,panelHeight:3.00,face:'opposite'}
);
// S18 — DISEGNO BIANCO SU ANTRACITE — segmento I13-I18
addPanelFaceImage(
  'I13','I18',
  './PANNELLO S 18 SEG. I13 - I18.jpg',
  {panelWidth:3.30,panelHeight:3.00,face:'center'}
);
// S14 — PALEOCAPA 6 — segmento I11-I15
addPanelFaceImage(
  'I11','I15',
  './PANNELLO S14    SEG. 11 - 15.jpg',
  {panelWidth:3.30,panelHeight:3.00,face:'center'}
);
// S10 — SALUTO RIVOLTO VERSO IL MARE — segmento 1-I7
addPanelFaceImage(
  1,'I7',
 './PROVA_S10_ROSSO_SANGUE_PIU_SCURO.jpg',
  {panelWidth:5.50,panelHeight:3.00,face:'center'}
);

// D5 — ARRIVO DALL’ORIZZONTE — segmento 8-I6
addPanelFaceImage(
  8,'I6',
  './PANNELLO_D5_ARRIVO_ORIZZONTE (1).jpg',
  {panelWidth:5.50,panelHeight:3.00,face:'center'}
);
// D3 — PALEOCAPA 11, 16 E 17 — segmento 7-I10
addPanelFaceImage(
  7,'I10',
  './PANNELLO 3  -  SEG. 7 - I10.jpg',
  {panelWidth:5.50,panelHeight:3.00,face:'center'}
);
// S16 — LOGO E PLANIMETRIA DELLA METAGALLERIA
// segmento 4-I14
addPanelFaceImage(
  4,'I14',
 './PANNELLO_S16_LOGO_CENTRATO.jpg',
  {panelWidth:5.40,panelHeight:3.00,face:'center'}
);
const centerMaterial=new THREE.MeshPhysicalMaterial({
  color:0xf5f5f0,
  metalness:0.05,
  roughness:0.18,
  transmission:0.15,
  emissive:0xfffff0,
  emissiveIntensity:0.18,
  side:THREE.DoubleSide
});

function addCenterFace(arm,imageUrl,sideSign){
  const texture=textureLoader.load(imageUrl);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=renderer.capabilities.getMaxAnisotropy();

  const face=new THREE.Mesh(
    new THREE.PlaneGeometry(2.20,2.10),
    new THREE.MeshBasicMaterial({
      map:texture,
      side:THREE.FrontSide,
      toneMapped:false
    })
  );

  face.position.set(
    0,
    0,
    sideSign*(CENTER_THICKNESS/2+0.006)
  );

  if(sideSign<0){
    face.rotation.y=Math.PI;
  }

  arm.add(face);
}

function addCenterArm(angleDeg,frontImage,backImage){
  const a=THREE.MathUtils.degToRad(angleDeg);

  const end=new THREE.Vector3(
    CENTER_ARM_LENGTH*Math.cos(a),0,
    -CENTER_ARM_LENGTH*Math.sin(a)
  );

  const len=Math.hypot(end.x,end.z);

  const arm=new THREE.Mesh(
    new THREE.BoxGeometry(
      len,
      CENTER_HEIGHT,
      CENTER_THICKNESS
    ),
    centerMaterial
  );

  arm.position.set(
    end.x/2,
    CENTER_HEIGHT/2,
    end.z/2
  );

  arm.rotation.y=-Math.atan2(end.z,end.x);
  scene.add(arm);

  addCenterFace(arm,frontImage,1);
  addCenterFace(arm,backImage,-1);
}

// BRACCIO SINISTRO: C4 e C3
addCenterArm(
  150,
  './PANNELLO_C4.jpg.jpg',
  './PANNELLO_C5.jpg.jpg'
);

// BRACCIO DESTRO: C2 e C1
addCenterArm(
  30,
  './PANNELLO_C2.jpg.jpg',
  './PANNELLO_C1.jpg.jpg'
);

// BRACCIO VERSO L’INGRESSO: C6 e C5
addCenterArm(
  -90,
  './PANNELLO_C6.jpg.jpg',
  './PANNELLO_C3.jpg.jpg'
);
// SCHEDA INFORMATIVA
const modal=document.createElement('div');
modal.id='schedaModal';
modal.style.cssText=`
display:none;position:fixed;inset:0;z-index:10000;
background:rgba(0,0,0,.58);align-items:center;justify-content:center;
font-family:Arial,sans-serif;`;

const card=document.createElement('div');
card.style.cssText=`
width:min(520px,88vw);background:#f6f3eb;color:#161616;
padding:28px 30px;border-radius:12px;position:relative;`;

const closeBtn=document.createElement('button');
closeBtn.textContent='×';
closeBtn.style.cssText=`
position:absolute;right:12px;top:8px;border:0;background:transparent;
font-size:30px;cursor:pointer;`;

const modalTitle=document.createElement('div');
modalTitle.style.cssText='font-size:25px;font-weight:700;margin-bottom:8px;';

const modalArtist=document.createElement('div');
modalArtist.style.cssText='font-size:18px;margin-bottom:12px;';

const modalDetails=document.createElement('div');
modalDetails.style.cssText='font-size:15px;line-height:1.5;';

card.append(closeBtn,modalTitle,modalArtist,modalDetails);
modal.appendChild(card);
document.body.appendChild(modal);

const controls=new PointerLockControls(camera,renderer.domElement);
controls.minPolarAngle=Math.PI/2;
controls.maxPolarAngle=Math.PI/2;
function openArtworkModal(data){
  modalTitle.textContent=data.title||'';
  modalArtist.textContent=data.artist||'';
  modalDetails.textContent=data.details||'';
  modal.style.display='flex';
  controls.unlock();
}

function closeArtworkModal(){
  modal.style.display='none';
}

closeBtn.addEventListener('click',e=>{
  e.stopPropagation();
  closeArtworkModal();
});

modal.addEventListener('click',e=>{
  e.stopPropagation();
  if(e.target===modal) closeArtworkModal();
});

let topView=false;
const raycaster=new THREE.Raycaster();

const bottoneTop=document.createElement('button');
bottoneTop.textContent="VISTA DALL'ALTO";
bottoneTop.style.position='fixed';
bottoneTop.style.top='20px';
bottoneTop.style.right='20px';
bottoneTop.style.zIndex='9999';
bottoneTop.style.padding='10px 16px';
bottoneTop.style.cursor='pointer';
document.body.appendChild(bottoneTop);

document.body.addEventListener('click',e=>{
  if(e.target.closest?.('#schedaModal')) return;
  if(e.target===bottoneTop) return;
  if(topView) return;

  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=raycaster.intersectObjects(clickableArtworks,false);

  if(hits.length){
    openArtworkModal(hits[0].object.userData);
    return;
  }

if(modal.style.display!=='flex' && !isTouchDevice) controls.lock();
});

const keys={};

addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='KeyT'&&!e.repeat) toggleTopView();
  if(e.code==='Escape'&&modal.style.display==='flex') closeArtworkModal();
});

addEventListener('keyup',e=>{
  keys[e.code]=false;
});

const savedCamera={
  position:new THREE.Vector3(),
  quaternion:new THREE.Quaternion(),
  up:new THREE.Vector3(0,1,0)
};

function toggleTopView(){
  if(!topView){
    savedCamera.position.copy(camera.position);
    savedCamera.quaternion.copy(camera.quaternion);
    savedCamera.up.copy(camera.up);
    controls.unlock();
    topView=true;
    ceiling.visible=false;
    camera.position.set(0,26,0);
    camera.up.set(0,0,-1);
    camera.lookAt(0,0,0);
  }else{
    topView=false;
    ceiling.visible=true;
    camera.up.copy(savedCamera.up);
    camera.position.copy(savedCamera.position);
    camera.quaternion.copy(savedCamera.quaternion);
  }
}

bottoneTop.addEventListener('click',e=>{
  e.stopPropagation();
  toggleTopView();
});

// COMANDI TATTILI PER CELLULARE
const isTouchDevice =
  ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

if(isTouchDevice){

  // Impedisce lo scorrimento della pagina durante la visita
  renderer.domElement.style.touchAction='none';

  // Movimento dello sguardo trascinando un dito
  let touchX=0;
  let touchY=0;
  let touchLooking=false;

  const touchEuler=new THREE.Euler(0,0,0,'YXZ');

  renderer.domElement.addEventListener('touchstart',e=>{
    if(e.touches.length!==1 || topView) return;

    touchLooking=true;
    touchX=e.touches[0].clientX;
    touchY=e.touches[0].clientY;
  },{passive:false});

  renderer.domElement.addEventListener('touchmove',e=>{
    if(!touchLooking || e.touches.length!==1 || topView) return;

    e.preventDefault();

    const x=e.touches[0].clientX;
    const y=e.touches[0].clientY;
    const dx=x-touchX;
    const dy=y-touchY;

    touchX=x;
    touchY=y;

    touchEuler.setFromQuaternion(camera.quaternion);
    touchEuler.y-=dx*0.004;
  touchEuler.x=0;
  
    camera.quaternion.setFromEuler(touchEuler);
  },{passive:false});

  renderer.domElement.addEventListener('touchend',()=>{
    touchLooking=false;
  });

  // Pulsanti per camminare
  const mobileControls=document.createElement('div');

  mobileControls.style.cssText=`
    position:fixed;
    left:18px;
    bottom:25px;
    width:150px;
    height:150px;
    z-index:9998;
    touch-action:none;
    user-select:none;
  `;

  document.body.appendChild(mobileControls);

  function addMoveButton(symbol,code,left,top){
    const button=document.createElement('button');

    button.textContent=symbol;
    button.style.cssText=`
      position:absolute;
      left:${left}px;
      top:${top}px;
      width:52px;
      height:52px;
      border-radius:50%;
      border:2px solid rgba(255,255,255,.85);
      background:rgba(20,24,38,.68);
      color:white;
      font-size:25px;
      font-weight:bold;
      touch-action:none;
    `;

    const start=e=>{
      e.preventDefault();
      e.stopPropagation();
      keys[code]=true;
    };

    const stop=e=>{
      e.preventDefault();
      e.stopPropagation();
      keys[code]=false;
    };

    button.addEventListener('pointerdown',start);
    button.addEventListener('pointerup',stop);
    button.addEventListener('pointercancel',stop);
    button.addEventListener('pointerleave',stop);

    mobileControls.appendChild(button);
  }

  addMoveButton('▲','KeyW',49,0);
  addMoveButton('◀','KeyA',0,49);
  addMoveButton('▶','KeyD',98,49);
  addMoveButton('▼','KeyS',49,98);
}
const clock=new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);

if((controls.isLocked||isTouchDevice)&&!topView){
    let f=0,r=0;

    if(keys.KeyW||keys.ArrowUp) f=1;
    if(keys.KeyS||keys.ArrowDown) f=-1;
    if(keys.KeyA||keys.ArrowLeft) r=-1;
    if(keys.KeyD||keys.ArrowRight) r=1;

    const speed=2.0*dt;
    if(f) controls.moveForward(f*speed);
    if(r) controls.moveRight(r*speed);

    camera.position.y=1.70;

    const d=Math.hypot(camera.position.x,camera.position.z);
    if(d>R-0.45){
      const q=(R-0.45)/d;
      camera.position.x*=q;
      camera.position.z*=q;
    }
  }

  renderer.render(scene,camera);
}

animate();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
