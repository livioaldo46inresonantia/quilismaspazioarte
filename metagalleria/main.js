import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/PointerLockControls.js/+esm';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111318);

const camera = new THREE.PerspectiveCamera(
  65,
  innerWidth / innerHeight,
  0.05,
  200
);

camera.position.set(0, 1.65, 8.8);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(
  Math.min(devicePixelRatio, 2)
);

renderer.setSize(
  innerWidth,
  innerHeight
);

document.body.appendChild(
  renderer.domElement
);

const R = 10;
const lineY = 0.012;

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

  const a =
    THREE.MathUtils.degToRad(deg);

  return new THREE.Vector3(
    r * Math.cos(a),
    lineY,
    -r * Math.sin(a)
  );
}

const N = {};

Object.entries(angles).forEach(
  ([k, a]) => N[k] = pt(a)
);

const paths = [

  [9, 3, 6, 9],

  [4, 2, 8, 5, 4],

  [5, 7, 1, 4]

];

const floor = new THREE.Mesh(

  new THREE.CylinderGeometry(
    R,
    R,
    0.12,
    128
  ),

  new THREE.MeshStandardMaterial({
    color: 0x666a6d,
    roughness: 0.95
  })

);

floor.position.y = -0.06;

scene.add(floor);

const ceiling = new THREE.Mesh(

  new THREE.CylinderGeometry(
    R + 0.25,
    R + 0.25,
    0.08,
    128
  ),

  new THREE.MeshStandardMaterial({
    color: 0x20242a,
    roughness: 1
  })

);

ceiling.position.y = 3.35;

scene.add(ceiling);

scene.add(

  new THREE.HemisphereLight(
    0xffffff,
    0x111111,
    0.75
  )

);

function addSegment(a, b) {

  const mid =
    a.clone()
     .add(b)
     .multiplyScalar(0.5);

  const len =
    a.distanceTo(b);

  const geometry =
    new THREE.BoxGeometry(
      len,
      0.018,
      0.026
    );

  const material =
    new THREE.MeshStandardMaterial({

      color: 0xbfd8ff,

      emissive: 0xbfd8ff,

      emissiveIntensity: 1.25,

      roughness: 0.35

    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.position.copy(mid);

  const dx =
    b.x - a.x;

  const dz =
    b.z - a.z;

  mesh.rotation.y =
    -Math.atan2(
      dz,
      dx
    );

  scene.add(mesh);
}

paths.forEach(path => {

  for (
    let i = 0;
    i < path.length - 1;
    i++
  ) {

    addSegment(
      N[path[i]],
      N[path[i + 1]]
    );

  }

});

const controls =
  new PointerLockControls(
    camera,
    document.body
  );

document.body.addEventListener(
  'click',
  () => controls.lock()
);

const keys = {};

addEventListener(
  'keydown',
  e => keys[e.code] = true
);

addEventListener(
  'keyup',
  e => keys[e.code] = false
);

const clock =
  new THREE.Clock();

function animate() {

  requestAnimationFrame(
    animate
  );

  const dt =
    Math.min(
      clock.getDelta(),
      0.05
    );

  if (controls.isLocked) {

    const speed =
      3.2 * dt;

    if (keys.KeyW)
      controls.moveForward(speed);

    if (keys.KeyS)
      controls.moveForward(-speed);

    if (keys.KeyA)
      controls.moveRight(-speed);

    if (keys.KeyD)
      controls.moveRight(speed);

    camera.position.y =
      1.65;

    const d =
      Math.hypot(
        camera.position.x,
        camera.position.z
      );

    if (d > 9.75) {

      const q =
        9.75 / d;

      camera.position.x *= q;

      camera.position.z *= q;

    }

  }

  renderer.render(
    scene,
    camera
  );

}

animate();

addEventListener(
  'resize',
  () => {

    camera.aspect =
      innerWidth /
      innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      innerWidth,
      innerHeight
    );

  }
);
