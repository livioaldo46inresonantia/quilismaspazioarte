import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/PointerLockControls.js/+esm';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000046);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.05, 500);
camera.position.set(0, 1.65, 8.8);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.body.appendChild(renderer.domElement);

const R = 12.5; const LINE_Y = 0.012;
const PANEL_HEIGHT = 3.00; const PANEL_RAISE = 0.12; const PANEL_THICKNESS = 0.10; const PANEL_GAP = 0.10;
const CENTER_HEIGHT = 2.10; const CENTER_ARM_LENGTH = 2.30; const CENTER_THICKNESS = 0.10;
const angles = { 9: 90, 1: 50, 2: 10, 3: -30, 4: -70, 5: -110, 6: -150, 7: 170, 8: 130 };
function pt(deg, r = R){ const a = THREE.MathUtils.degToRad(deg); return new THREE.Vector3(r*Math.cos(a), LINE_Y, -r*Math.sin(a)); }
const P = {}; Object.entries(angles).forEach(([k,a])=>{ P[k]=pt(a); });
function lineIntersection(a,b,c,d){
  const x1=a.x,z1=a.z,x2=b.x,z2=b.z,x3=c.x,z3=c.z,x4=d.x,z4=d.z;
  const den=(x1-x2)*(z3-z4)-(z1-z2)*(x3-x4); if(Math.abs(den)<1e-10) throw new Error('Rette parallele');
  const A=x1*z2-z1*x2,B=x3*z4-z3*x4; return new THREE.Vector3((A*(x3-x4)-(x1-x2)*B)/den, LINE_Y, (A*(z3-z4)-(z1-z2)*B)/den);
}
function parallelThroughIntersection(p,v,a,b){ const q=new THREE.Vector3(p.x+v.x,LINE_Y,p.z+v.z); return lineIntersection(p,q,a,b); }
P.I1=lineIntersection(P[6],P[9],P[2],P[8]); P.I2=lineIntersection(P[9],P[3],P[7],P[1]); P.I3=lineIntersection(P[2],P[8],P[7],P[1]);
P.I4=lineIntersection(P[6],P[9],P[7],P[1]); P.I5=lineIntersection(P[9],P[3],P[2],P[8]); P.I6=lineIntersection(P[8],P[5],P[7],P[1]);
P.I7=lineIntersection(P[2],P[8],P[1],P[4]); P.I8=lineIntersection(P[6],P[9],P[8],P[5]); P.I9=lineIntersection(P[9],P[3],P[1],P[4]);
P.I10=lineIntersection(P[6],P[9],P[5],P[7]); P.I11=lineIntersection(P[9],P[3],P[4],P[2]); P.I12=lineIntersection(P[3],P[6],P[5],P[7]);
P.I13=lineIntersection(P[3],P[6],P[8],P[5]); P.I14=lineIntersection(P[3],P[6],P[1],P[4]); P.I15=lineIntersection(P[3],P[6],P[4],P[2]);
const sideLeft=P[6].clone().sub(P[9]); const sideRight=P[3].clone().sub(P[9]);
P.I16=parallelThroughIntersection(P.I3,sideLeft,P.I10,P.I11); P.I17=parallelThroughIntersection(P.I3,sideRight,P.I10,P.I11);
P.I18=lineIntersection(P.I5,P[5],P.I13,P.I14); P.I19=lineIntersection(P.I4,P[4],P.I13,P.I14);
const masterPaths=[[9,3,6,9],[4,2,8,5,4],[5,7,1,4]];
function addFloorSegment(a,b){
  const start=a.clone(),end=b.clone(); start.y=LINE_Y; end.y=LINE_Y;
  const mid=start.clone().add(end).multiplyScalar(0.5); const len=start.distanceTo(end);
  const geo=new THREE.BoxGeometry(len,0.008,0.04);
  const mat=new THREE.MeshStandardMaterial({color:0x050508,roughness:0.9});
  const mesh=new THREE.Mesh(geo,mat); mesh.position.copy(mid); mesh.rotation.y=-Math.atan2(end.z-start.z,end.x-start.x); scene.add(mesh);
  const ledGeo=new THREE.BoxGeometry(len,0.010,0.004);
  const ledMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:2.5});
  const led=new THREE.Mesh(ledGeo,ledMat); led.position.copy(mid); led.position.y+=0.006; led.rotation.y=mesh.rotation.y; scene.add(led);
}
masterPaths.forEach(path=>{ for(let i=0;i<path.length-1;i++) addFloorSegment(P[path[i]],P[path[i+1]]); });
const floor=new THREE.Mesh(new THREE.CylinderGeometry(R,R,0.12,128), new THREE.MeshStandardMaterial({color:0xbebebe,roughness:0.85}));
floor.position.y=-0.06; floor.receiveShadow=true; scene.add(floor);
const ceilingGeo=new THREE.SphereGeometry(45, 64, 32, 0, Math.PI*2, 0, Math.PI*0.52);
const ceilingMat=new THREE.MeshBasicMaterial({ color: 0x000046, side: THREE.BackSide });
const ceiling=new THREE.Mesh(ceilingGeo, ceilingMat); ceiling.position.y = -8; scene.add(ceiling);
function addStars(){
  const starCount=380; const starsGeo=new THREE.BufferGeometry(); const pos=[]; const cols=[];
  for(let i=0;i<starCount;i++){ 
    const ang=Math.random()*Math.PI*2; 
    const rad= R + 12 + Math.random()*50; 
    const y = 10 + Math.random()*28; 
    const x=Math.cos(ang)*rad, z= -Math.sin(ang)*rad; 
    pos.push(x,y,z);
    const r=Math.random(); 
    if(r<0.65) cols.push(0.82,0.88,1.0); else if(r<0.85) cols.push(1.0,0.96,0.82); else cols.push(1,1,1);
  }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols,3));
  const starsMat=new THREE.PointsMaterial({size:0.18, vertexColors:true, sizeAttenuation:true, transparent:true, opacity:0.88});
  const stars=new THREE.Points(starsGeo,starsMat); scene.add(stars);
}
addStars();
scene.add(new THREE.HemisphereLight(0xdde6ff, 0x1a2a44, 1.35));
const softLight=new THREE.DirectionalLight(0xfff1dd, 1.15); softLight.position.set(3,8,4); scene.add(softLight);
const panels=[
  ['I1','I4'],['I1','I3'],['I2','I3'],['I2','I5'],[8,'I6'],[7,'I6'],[7,'I10'],['I10','I12'],['I8','I16'],[5,'I13'],['I13','I18'],['I14','I19'],[4,'I14'],['I17','I9'],[1,'I7'],[2,'I7'],[2,'I11'],['I11','I15']
];

// ANTRACITE SCURO ESATTO 55,58,63 = #373a3f - visibile in foto
const panelMaterial=new THREE.MeshStandardMaterial({ 
  color: 0x373a3f, 
  roughness: 0.85, 
  metalness: 0.04,
  emissive: 0x373a3f,
  emissiveIntensity: 0.22
});

const edgeLightMat=new THREE.MeshStandardMaterial({ color:0xfff0d0, emissive:0xffe6b3, emissiveIntensity:1.6 });
const LATERAL_WIDTH = 0.08;
function addPanel(aName,bName){
  const a=P[aName],b=P[bName]; if(!a||!b) return;
  const dir=b.clone().sub(a); dir.y=0; const len=dir.length(); const trim=Math.min(PANEL_GAP/2,len*0.20); const unit=dir.clone().normalize();
  const start=a.clone().add(unit.clone().multiplyScalar(trim)); const end=b.clone().add(unit.clone().multiplyScalar(-trim));
  const midX=(start.x+end.x)/2, midZ=(start.z+end.z)/2; const rotY=-Math.atan2(end.z-start.z,end.x-start.x);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(end.x-start.x,end.z-start.z),PANEL_HEIGHT,PANEL_THICKNESS), panelMaterial);
  wall.position.set(midX, PANEL_RAISE+PANEL_HEIGHT/2, midZ); wall.rotation.y=rotY; wall.castShadow=true; wall.receiveShadow=true; scene.add(wall);
  const sideGeo=new THREE.BoxGeometry(LATERAL_WIDTH, PANEL_HEIGHT, 0.04);
  const leftLight=new THREE.Mesh(sideGeo, edgeLightMat); leftLight.position.set(start.x, PANEL_RAISE+PANEL_HEIGHT/2, start.z); leftLight.rotation.y=rotY; scene.add(leftLight);
  const rightLight=new THREE.Mesh(sideGeo, edgeLightMat); rightLight.position.set(end.x, PANEL_RAISE+PANEL_HEIGHT/2, end.z); rightLight.rotation.y=rotY; scene.add(rightLight);
  const l1=new THREE.PointLight(0xffe8c0, 0.5, 3.5, 2); l1.position.set(leftLight.position.x, 1.5, leftLight.position.z); scene.add(l1);
  const l2=new THREE.PointLight(0xffe8c0, 0.5, 3.5, 2); l2.position.set(rightLight.position.x, 1.5, rightLight.position.z); scene.add(l2);
}
panels.forEach(([a,b])=>addPanel(a,b));


// --- QUADRI SUI 4 PANNELLI SCELTI ---
const texLoader=new THREE.TextureLoader();
function addQuadroSuPannello(aName,bName, schedaId, imgPath, larghezza){
  const a=P[aName], b=P[bName]; if(!a||!b) return;
  const dir=b.clone().sub(a); dir.y=0; const mid=a.clone().add(b).multiplyScalar(0.5);
  const rotY=-Math.atan2(b.z-a.z, b.x-a.x);
  const w=larghezza||1.2, h=w*1.25;
  const geo=new THREE.PlaneGeometry(w,h);
  let mat;
  if(imgPath){
    const tex=texLoader.load(imgPath);
    tex.colorSpace=THREE.SRGBColorSpace;
    mat=new THREE.MeshBasicMaterial({map:tex, side:THREE.DoubleSide});
  } else {
    mat=new THREE.MeshStandardMaterial({color:0x111111, emissive:0x333333, emissiveIntensity:0.3, side:THREE.DoubleSide});
  }
  const quadro=new THREE.Mesh(geo,mat);
  quadro.position.set(mid.x, 1.55, mid.z);
  // sposta leggermente fuori dal pannello
  const normal=new THREE.Vector3(-Math.sin(rotY),0,-Math.cos(rotY));
  // determina lato S o D dal nome
  const lato = schedaId.includes('fronte')||schedaId.includes('benvenuto_fronte') ? 1 : (schedaId.includes('retro') ? -1 : 1);
  quadro.position.add(normal.clone().multiplyScalar(0.06 * lato));
  quadro.rotation.y=rotY;
  quadro.userData.schedaId=schedaId;
  scene.add(quadro);
  quadriCliccabili.push(quadro);
  // cornice sottile
  const cornice=new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({color:0x000000}));
  cornice.position.copy(quadro.position); cornice.rotation.copy(quadro.rotation); cornice.position.add(normal.clone().multiplyScalar(0.001));
  scene.add(cornice);
}

// PANNELLO 2 = I2/I5? No, mappa: pannello 2 è S2/D2 che corrisponde a [7,'I6']? Dalla tua foto: 2 è S2/D2 verde vicino ingresso sx
// Dalla lista panels: panels[5]=[7,'I6'] è il pannello 2? Verifichiamo con tua foto:
// Usiamo i nomi logici: per semplicità appendiamo ai pannelli esistenti
// D2 = fronte (esterno), S2 = retro (interno)
addQuadroSuPannello('I6','7', 'benvenuto_fronte', '../images/1975 Padova        cm. 60x80   Omaggio a       Benvenuto.jpg', 1.3);
addQuadroSuPannello('7','I6', 'benvenuto_retro', '../images/1975 Padova retro 60x80 Omaggio a Benvenuto retro.jpg', 1.3);
// Pannello 13 = S13/D13 rosso a destra -> S13 = Omaggio a Livio
addQuadroSuPannello('S13','D13', 'omaggio_livio', null, 1.1);
// Pannello 3 = D3/S3 lungo a sx -> paleocapa1
addQuadroSuPannello('S1','D1', 'paleocapa_1', null, 1.2);
// Pannello 12 = S12/D1 verde a destra -> paleocapa2
addQuadroSuPannello('S12','D1', 'paleocapa_2', null, 1.2);

const centerMirrorMaterial=new THREE.MeshPhysicalMaterial({ 
  color: 0xffffff, 
  metalness: 0.1, 
  roughness: 0.02, 
  clearcoat: 1.0,
  clearcoatRoughness: 0.02,
  reflectivity: 1.0,
  emissive: 0xffffff,
  emissiveIntensity: 0.12,
  side: THREE.DoubleSide 
});
function addCenterArm(angleDeg){
  const a=THREE.MathUtils.degToRad(angleDeg);
  const end=new THREE.Vector3(CENTER_ARM_LENGTH*Math.cos(a),0,-CENTER_ARM_LENGTH*Math.sin(a));
  const len=Math.hypot(end.x,end.z);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(len,CENTER_HEIGHT,CENTER_THICKNESS), centerMirrorMaterial);
  arm.position.set(end.x/2,CENTER_HEIGHT/2,end.z/2); arm.rotation.y=-Math.atan2(end.z,end.x); 
  arm.castShadow=false; arm.receiveShadow=false;
  scene.add(arm);
  // luce forte che fa brillare lo specchio
  const spot=new THREE.PointLight(0xffffff, 1.8, 8, 1.5);
  spot.position.set(end.x*0.5, CENTER_HEIGHT*0.8, end.z*0.5);
  scene.add(spot);
  const spot2=new THREE.PointLight(0xffffff, 0.6, 4, 2);
  spot2.position.set(end.x*0.3, 0.4, end.z*0.3);
  scene.add(spot2);
}
[150,30,-90].forEach(addCenterArm);



const controls=new PointerLockControls(camera, renderer.domElement);
let topView=false;
document.body.addEventListener('click', (e)=>{
  if(e.target.closest('#schedaModal')) return;
  if(document.getElementById('schedaModal')?.style.display==='block') return;
  if(!topView) controls.lock();
});
const keys={}; 
addEventListener('keydown', e=>{ 
  keys[e.code]=true; 
  if(e.code==='KeyT'&&!e.repeat) toggleTopView();
  if(e.code==='Escape'){
    const modal=document.getElementById('schedaModal');
    if(modal && modal.style.display==='block'){ modal.style.display='none'; controls.lock(); }
  }
}); 
addEventListener('keyup', e=>{ keys[e.code]=false; });
const savedCamera={ position:new THREE.Vector3(), quaternion:new THREE.Quaternion(), up:new THREE.Vector3(0,1,0) };
function toggleTopView(){
  if(!topView){ savedCamera.position.copy(camera.position); savedCamera.quaternion.copy(camera.quaternion); savedCamera.up.copy(camera.up); controls.unlock(); topView=true; ceiling.visible=false; camera.position.set(0,26,0); camera.up.set(0,0,-1); camera.lookAt(0,0,0); }
  else { topView=false; ceiling.visible=true; camera.up.copy(savedCamera.up); camera.position.copy(savedCamera.position); camera.quaternion.copy(savedCamera.quaternion); }
}

// --- SCHEDE ---
const schedeDB = {
  'benvenuto_fronte': {
    titolo: 'ANTONIO FORTÙN — Omaggio a Benvenuto — fronte — Padova 1975',
    opera: 'Omaggio a Benvenuto, Padova 1975, acrilico su tela 60×80 cm, firmata. Opera simbolo dell’incontro padovano.',
    padova: 'Nel 1975 Antonio Fortún vive e lavora a Padova, Riviera Paleocapa 10/b. Periodo di intensa produzione.',
    tecnica: 'Acrilico su tela 60×80 cm, firmata. Collezione Livio Picotti.'
  },
  'benvenuto_retro': {
    titolo: 'ANTONIO FORTÙN — Omaggio a Benvenuto — retro — Padova 1975',
    opera: 'Il retro dipinto del celebre Omaggio a Benvenuto, conservato con cornice originale dipinta.',
    tecnica: 'Acrilico su tela 60×80 cm, retro dipinto.'
  },
  'omaggio_livio': {
    titolo: 'ANTONIO FORTÙN — Omaggio a Livio — Padova 1975',
    opera: 'Omaggio a Livio, dedicata a Livio Picotti. Testa stilizzata con occhi blu/gialli.',
    tecnica: 'Acrilico su tela — Collezione Livio Picotti.'
  },
  'paleocapa_1': {
    titolo: 'ANTONIO FORTÙN — Paleocapa 1 — Padova 1975',
    opera: 'Paleocapa 1: gesto pittorico per addensamenti successivi, tensione fra apparizione e dissoluzione.',
    tecnica: 'Acrilico su tela 50×60 cm, Padova 1975, firmata.'
  },
  'paleocapa_2': {
    titolo: 'ANTONIO FORTÙN — Paleocapa 2 — Padova 1975',
    opera: 'Paleocapa 2: formato orizzontale, trama di presenze e densità cromatiche.',
    tecnica: 'Acrilico su tela 60×50 cm, Padova 1975, firmata.'
  }
};

function apriScheda(id){
  const data = schedeDB[id];
  if(!data) return;
  const modal=document.getElementById('schedaModal');
  document.getElementById('schedaTitolo').innerText=data.titolo;
  document.getElementById('schedaCorpo').innerHTML = `<h3>L'OPERA</h3><p>${data.opera}</p><h3>SCHEDA TECNICA</h3><p>${data.tecnica}</p><hr><p style='font-size:13px;opacity:0.7'>Scheda provvisoria — sostituibile con i tuoi testi definitivi da DOCX</p>`;
  modal.style.display='block';
  controls.unlock();
}

// Raycaster per quadri
const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();
const quadriCliccabili=[];
renderer.domElement.addEventListener('click', (e)=>{
  if(!controls.isLocked) return;
  raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
  const hits=raycaster.intersectObjects(quadriCliccabili);
  if(hits.length>0){
    const obj=hits[0].object;
    if(obj.userData.schedaId) apriScheda(obj.userData.schedaId);
  }
});
const clock=new THREE.Clock();
function animate(){ requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),0.05);
  if(controls.isLocked&&!topView){ 
    let moveX=0, moveZ=0;
    const speed=2.2*dt; // promenade lenta e controllata
    if(keys.KeyW || keys.ArrowUp) moveZ = 1;
    if(keys.KeyS || keys.ArrowDown) moveZ = -1;
    if(keys.KeyA || keys.ArrowLeft) moveX = -1;
    if(keys.KeyD || keys.ArrowRight) moveX = 1;
    // movimento fluido senza scatti
    if(moveZ!==0) controls.moveForward(moveZ*speed);
    if(moveX!==0) controls.moveRight(moveX*speed);
    camera.position.y=1.65; // altezza occhi fissa, niente salto
    const d=Math.hypot(camera.position.x,camera.position.z); 
    if(d>R-0.45){ const q=(R-0.45)/d; camera.position.x*=q; camera.position.z*=q; }
  }
  renderer.render(scene,camera);
}
animate();
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

// Inietta modal scheda
const modalHTML=`<div id='schedaModal' style='display:none;position:fixed;inset:0;z-index:10000;background:rgba(10,10,20,0.88);overflow-y:auto;padding:20px;'>
<div style='max-width:820px;margin:40px auto;background:#faf8f5;color:#1a1a1a;padding:38px 42px;border-radius:4px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:Georgia, serif;'>
<button onclick="document.getElementById('schedaModal').style.display='none'" style='position:absolute;top:14px;right:14px;background:#1a1a1a;color:white;border:none;padding:8px 14px;cursor:pointer;'>X CHIUDI</button>
<h1 id='schedaTitolo' style='font-family:Playfair Display, Georgia, serif;font-size:22px;letter-spacing:0.5px;margin-bottom:22px;text-transform:uppercase;'></h1>
<div id='schedaCorpo' style='font-size:16px;line-height:1.7;'></div>
<div style='margin-top:30px;padding-top:18px;border-top:1px solid #ddd;font-size:12px;opacity:0.6'>Metagalleria di Livio Picotti — Tocca ESC per chiudere e tornare a camminare</div>
</div></div>`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

const bottoneTop=document.createElement('button'); bottoneTop.textContent='VISTA DALL’ALTO'; bottoneTop.style.position='fixed'; bottoneTop.style.top='20px'; bottoneTop.style.right='20px'; bottoneTop.style.zIndex='9999'; bottoneTop.style.padding='10px 16px'; bottoneTop.style.cursor='pointer';
bottoneTop.addEventListener('click', e=>{ e.stopPropagation(); toggleTopView(); }); document.body.appendChild(bottoneTop);
const PANORAMA_DISTANCE_FROM_GALLERY=20.0, PANORAMA_HEIGHT=3.2, PANORAMA_RADIUS=R+PANORAMA_DISTANCE_FROM_GALLERY;
const panoramaLoader=new THREE.TextureLoader();
const panoramaTexture=panoramaLoader.load("../images/sfondo_panorama_v definitivo.jpg");
panoramaTexture.wrapS=THREE.RepeatWrapping; panoramaTexture.wrapT=THREE.ClampToEdgeWrapping; panoramaTexture.repeat.set(1,1);
const panoramaGeometry=new THREE.CylinderGeometry(PANORAMA_RADIUS,PANORAMA_RADIUS,PANORAMA_HEIGHT,128,1,true);
const panoramaMaterial=new THREE.MeshBasicMaterial({ map:panoramaTexture, transparent:true, opacity:1.0, side:THREE.BackSide, depthWrite:false });
const panoramaBackdrop=new THREE.Mesh(panoramaGeometry,panoramaMaterial); panoramaBackdrop.position.y=PANORAMA_HEIGHT/2; scene.add(panoramaBackdrop);
const fortunLoader=new THREE.TextureLoader();
const benvenutoTexture=fortunLoader.load("../images/1975 Padova        cm. 60x80   Omaggio a       Benvenuto.jpg");
benvenutoTexture.colorSpace=THREE.SRGBColorSpace;
const d6A=P.I2, d6B=P.I5, d6Dir=d6B.clone().sub(d6A); d6Dir.y=0; const d6Center=d6A.clone().add(d6B).multiplyScalar(0.5); const d6Unit=d6Dir.clone().normalize(); const d6Normal=new THREE.Vector3(-d6Unit.z,0,d6Unit.x).multiplyScalar(-1);
const benvenutoGeometry=new THREE.PlaneGeometry(0.84,1.12);
const benvenutoMaterial=new THREE.MeshBasicMaterial({ map:benvenutoTexture, side:THREE.DoubleSide, toneMapped:false });
const benvenutoD6=new THREE.Mesh(benvenutoGeometry,benvenutoMaterial); benvenutoD6.position.copy(d6Center); benvenutoD6.position.y=1.55; benvenutoD6.position.add(d6Normal.clone().multiplyScalar(0.06)); benvenutoD6.rotation.y=-Math.atan2(d6B.z-d6A.z,d6B.x-d6A.x); scene.add(benvenutoD6);
