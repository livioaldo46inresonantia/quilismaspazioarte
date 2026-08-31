
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000046);
const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.05, 500);
camera.position.set(0, 1.65, 8.8);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.innerHTML='';
document.body.appendChild(renderer.domElement);

const R=12.5;
const floor=new THREE.Mesh(new THREE.CylinderGeometry(R,R,0.12,64), new THREE.MeshStandardMaterial({color:0xbebebe}));
floor.position.y=-0.06; scene.add(floor);

const ceilGeo=new THREE.SphereGeometry(45,32,16,0,Math.PI*2,0,Math.PI*0.52);
const ceilMat=new THREE.MeshBasicMaterial({color:0x000046, side:THREE.BackSide});
const ceiling=new THREE.Mesh(ceilGeo,ceilMat); ceiling.position.y=-8; scene.add(ceiling);

const light=new THREE.HemisphereLight(0xffffff, 0x222233, 1.2); scene.add(light);
const dir=new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(3,6,2); scene.add(dir);

function addBox(x,z,col){
  const m=new THREE.Mesh(new THREE.BoxGeometry(1.2,3,0.1), new THREE.MeshStandardMaterial({color:col}));
  m.position.set(x,1.5,z); scene.add(m);
}
addBox(2,0,0x373a3f);
addBox(-2,0,0x373a3f);
addBox(0,-3,0xf5f5f0);

const controls=new PointerLockControls(camera, renderer.domElement);
document.body.addEventListener('click', ()=>controls.lock());
const keys={};
addEventListener('keydown', e=>keys[e.code]=true);
addEventListener('keyup', e=>keys[e.code]=false);

function animate(){
  requestAnimationFrame(animate);
  if(controls.isLocked){
    const s=0.06;
    if(keys.KeyW||keys.ArrowUp) controls.moveForward(s);
    if(keys.KeyS||keys.ArrowDown) controls.moveForward(-s);
    if(keys.KeyA||keys.ArrowLeft) controls.moveRight(-s);
    if(keys.KeyD||keys.ArrowRight) controls.moveRight(s);
    camera.position.y=1.65;
  }
  renderer.render(scene,camera);
}
animate();
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

// testo debug
const d=document.createElement('div');
d.style.position='fixed'; d.style.top='10px'; d.style.left='10px'; d.style.color='white'; d.style.background='rgba(0,0,0,0.7)'; d.style.padding='8px'; d.style.zIndex='9999';
d.innerText='TEST BASE 0-0-70 - se vedi questo e il pavimento grigio, Three.js funziona';
document.body.appendChild(d);
