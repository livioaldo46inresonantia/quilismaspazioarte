import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/PointerLockControls.js/+esm';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x223a5a);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.05, 500);
camera.position.set(0, 1.65, 8.8);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
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
const floor=new THREE.Mesh(new THREE.CylinderGeometry(R,R,0.12,128), new THREE.MeshStandardMaterial({color:0xd8d6d2,roughness:0.95}));
floor.position.y=-0.06; floor.receiveShadow=true; scene.add(floor);
const ceilingGeo=new THREE.SphereGeometry(45, 64, 32, 0, Math.PI*2, 0, Math.PI*0.52);
const ceilingMat=new THREE.MeshBasicMaterial({ color: 0x223a5a, side: THREE.BackSide });
const ceiling=new THREE.Mesh(ceilingGeo, ceilingMat); ceiling.position.y = -8; scene.add(ceiling);
function addStars(){
  const starCount=800; const starsGeo=new THREE.BufferGeometry(); const pos=[];
  for(let i=0;i<starCount;i++){ const ang=Math.random()*Math.PI*2; const rad= R + 5 + Math.random()*30; const y = 6 + Math.random()*28; const x=Math.cos(ang)*rad, z= -Math.sin(ang)*rad; pos.push(x,y,z); }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  const starsMat=new THREE.PointsMaterial({color:0xc8e0ff, size:0.18, sizeAttenuation:true, transparent:true, opacity:0.95});
  const stars=new THREE.Points(starsGeo,starsMat); scene.add(stars);
}
addStars();
scene.add(new THREE.HemisphereLight(0xdde6ff, 0x1a2a44, 0.85));
const softLight=new THREE.DirectionalLight(0xfff1dd, 0.55); softLight.position.set(3,8,4); scene.add(softLight);
const panels=[
  ['I1','I4'],['I1','I3'],['I2','I3'],['I2','I5'],[8,'I6'],[7,'I6'],[7,'I10'],['I10','I12'],['I8','I16'],[5,'I13'],['I13','I18'],['I14','I19'],[4,'I14'],['I17','I9'],[1,'I7'],[2,'I7'],[2,'I11'],['I11','I15']
];

// ANTRACITE CAMPIONATO DALLE TUE IMMAGINI - 55,58,63 = #373a3f - grigio scuro opaco, non nero mortuario
const panelMaterial=new THREE.MeshStandardMaterial({ 
  color: 0x373a3f, 
  roughness: 0.95, 
  metalness: 0.03 
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

const centerMirrorMaterial=new THREE.MeshPhysicalMaterial({ color:0xffffff, metalness:0.96, roughness:0.07, clearcoat:1.0, side:THREE.DoubleSide });
function addCenterArm(angleDeg){
  const a=THREE.MathUtils.degToRad(angleDeg);
  const end=new THREE.Vector3(CENTER_ARM_LENGTH*Math.cos(a),0,-CENTER_ARM_LENGTH*Math.sin(a));
  const len=Math.hypot(end.x,end.z);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(len,CENTER_HEIGHT,CENTER_THICKNESS), centerMirrorMaterial);
  arm.position.set(end.x/2,CENTER_HEIGHT/2,end.z/2); arm.rotation.y=-Math.atan2(end.z,end.x); scene.add(arm);
}
[150,30,-90].forEach(addCenterArm);

const THIRD_EYE_RADIUS = 1.60; const THIRD_EYE_CENTER_Y = 12.0;
const thirdEyeCenter=new THREE.Vector3(0,THIRD_EYE_CENTER_Y,0);
const thirdEyeGeometry=new THREE.IcosahedronGeometry(THIRD_EYE_RADIUS,3);
const posAttr=thirdEyeGeometry.attributes.position;
for(let i=0;i<posAttr.count;i++){ const v=new THREE.Vector3(posAttr.getX(i),posAttr.getY(i),posAttr.getZ(i)); v.multiplyScalar(1+(Math.random()-0.5)*0.06); posAttr.setXYZ(i,v.x,v.y,v.z); }
posAttr.needsUpdate=true; thirdEyeGeometry.computeVertexNormals();
const thirdEyeMaterial=new THREE.MeshPhysicalMaterial({ color:0xffffff, metalness:0.88, roughness:0.15, clearcoat:1.0, flatShading:true, emissive:0xffffff, emissiveIntensity:0.08 });
const thirdEyeSphere=new THREE.Mesh(thirdEyeGeometry,thirdEyeMaterial); thirdEyeSphere.position.copy(thirdEyeCenter); scene.add(thirdEyeSphere);
const sphereLight=new THREE.PointLight(0xffffff, 1.0, 60, 1.8); sphereLight.position.copy(thirdEyeCenter); scene.add(sphereLight);
function animateSphere(dt){ thirdEyeSphere.rotation.y+=dt*0.04; }

const controls=new PointerLockControls(camera, renderer.domElement);
let topView=false;
document.body.addEventListener('click', ()=>{ if(!topView) controls.lock(); });
const keys={}; addEventListener('keydown', e=>{ keys[e.code]=true; if(e.code==='KeyT'&&!e.repeat) toggleTopView(); }); addEventListener('keyup', e=>{ keys[e.code]=false; });
const savedCamera={ position:new THREE.Vector3(), quaternion:new THREE.Quaternion(), up:new THREE.Vector3(0,1,0) };
function toggleTopView(){
  if(!topView){ savedCamera.position.copy(camera.position); savedCamera.quaternion.copy(camera.quaternion); savedCamera.up.copy(camera.up); controls.unlock(); topView=true; ceiling.visible=false; camera.position.set(0,26,0); camera.up.set(0,0,-1); camera.lookAt(0,0,0); }
  else { topView=false; ceiling.visible=true; camera.up.copy(savedCamera.up); camera.position.copy(savedCamera.position); camera.quaternion.copy(savedCamera.quaternion); }
}
const clock=new THREE.Clock();
function animate(){ requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),0.05);
  if(controls.isLocked&&!topView){ const speed=3.2*dt; if(keys.KeyW) controls.moveForward(speed); if(keys.KeyS) controls.moveForward(-speed); if(keys.KeyA) controls.moveRight(-speed); if(keys.KeyD) controls.moveRight(speed); camera.position.y=1.65; const d=Math.hypot(camera.position.x,camera.position.z); if(d>R-0.25){ const q=(R-0.25)/d; camera.position.x*=q; camera.position.z*=q; } }
  animateSphere(dt); renderer.render(scene,camera);
}
animate();
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
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
