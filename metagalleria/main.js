import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000046);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.05, 500);
camera.position.set(0, 1.65, 8.8);

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

function addFloorSegment(a,b){
  const start=a.clone(),end=b.clone();
  start.y=LINE_Y;
  end.y=LINE_Y;

  const mid=start.clone().add(end).multiplyScalar(0.5);
  const len=start.distanceTo(end);

  const geo=new THREE.BoxGeometry(len,0.008,0.04);
  const mat=new THREE.MeshStandardMaterial({color:0x050508,roughness:0.9});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.copy(mid);
  mesh.rotation.y=-Math.atan2(end.z-start.z,end.x-start.x);
  scene.add(mesh);

  const ledGeo=new THREE.BoxGeometry(len,0.010,0.004);
  const ledMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:2.5});
  const led=new THREE.Mesh(ledGeo,ledMat);
  led.position.copy(mid);
  led.position.y+=0.006;
  led.rotation.y=mesh.rotation.y;
  scene.add(led);
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
const ceilingMat=new THREE.MeshBasicMaterial({ color: 0x000046, side: THREE.BackSide });
const ceiling=new THREE.Mesh(ceilingGeo, ceilingMat);
ceiling.position.y = -8;
scene.add(ceiling);

function addStars(){
  const starCount=320;
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
    size:0.16,
    sizeAttenuation:true,
    transparent:true,
    opacity:0.72
  });
  scene.add(new THREE.Points(starsGeo,starsMat));
}
addStars();

scene.add(new THREE.HemisphereLight(0xdde6ff, 0x1a2a44, 1.2));

const softLight=new THREE.DirectionalLight(0xfff1dd, 0.9);
softLight.position.set(3,8,4);
scene.add(softLight);

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

  const texture=textureLoader.load(imageUrl);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=renderer.capabilities.getMaxAnisotropy();

  const face=new THREE.Mesh(
    new THREE.PlaneGeometry(panelWidth,panelHeight),
    new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide})
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

// 15D — FRONTE
addPanelFaceImage(
  'I10','I12',
  '../images/D15_OMAGGIO_A_BENVENUTO.jpg',
  {panelWidth:3.30,panelHeight:3.00,face:'center'}
);

// 15S — RETRO
addPanelFaceImage(
  'I10','I12',
  '../images/S15_OMAGGIO_A_BENVENUTO_RETRO_ANTHRACITE_PIL (1).jpg',
  {panelWidth:3.30,panelHeight:3.00,face:'opposite'}
);
// 17D — ANTONIO FORTÚN, FOTO E PAROLE
addPanelFaceImage(
  5,'I13',
  '../images/17D_FORTUN_FOTO_ALTRI_20CM_DESTRA_SOLO_PIL.jpg',
  {panelWidth:5.50,panelHeight:3.00,face:'center'}
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

function addCenterArm(angleDeg){
  const a=THREE.MathUtils.degToRad(angleDeg);
  const end=new THREE.Vector3(
    CENTER_ARM_LENGTH*Math.cos(a),0,
    -CENTER_ARM_LENGTH*Math.sin(a)
  );

  const len=Math.hypot(end.x,end.z);

  const arm=new THREE.Mesh(
    new THREE.BoxGeometry(len,CENTER_HEIGHT,CENTER_THICKNESS),
    centerMaterial
  );

  arm.position.set(end.x/2,CENTER_HEIGHT/2,end.z/2);
  arm.rotation.y=-Math.atan2(end.z,end.x);
  scene.add(arm);
}

[150,30,-90].forEach(addCenterArm);

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

  if(modal.style.display!=='flex') controls.lock();
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

const clock=new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);

  if(controls.isLocked&&!topView){
    let f=0,r=0;

    if(keys.KeyW||keys.ArrowUp) f=1;
    if(keys.KeyS||keys.ArrowDown) f=-1;
    if(keys.KeyA||keys.ArrowLeft) r=-1;
    if(keys.KeyD||keys.ArrowRight) r=1;

    const speed=2.0*dt;
    if(f) controls.moveForward(f*speed);
    if(r) controls.moveRight(r*speed);

    camera.position.y=1.65;

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
