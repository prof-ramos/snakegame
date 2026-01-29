import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function createRenderer(canvas, size) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2f2f2f);

  // Ortho camera (Context7: OrthographicCamera params are left/right/top/bottom/near/far)
  const half = size / 2;
  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 100);
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);

  // Lights (ambient + directional)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(5, 10, 5);
  scene.add(dir);

  // Grid plane
  const planeGeo = new THREE.PlaneGeometry(size, size);
  const planeMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Instanced snake mesh (Context7: setMatrixAt + instanceMatrix.needsUpdate)
  const box = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  const snakeMat = new THREE.MeshStandardMaterial({ color: 0xb0b0b0 });
  const snakeMesh = new THREE.InstancedMesh(box, snakeMat, size * size);
  scene.add(snakeMesh);

  // Fruit
  const fruit = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.9, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xe0e0e0 })
  );
  scene.add(fruit);

  return { renderer, scene, camera, snakeMesh, fruit };
}

export function updateSnakeMesh(snakeMesh, snake, size) {
  const offset = size / 2 - 0.5;
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < snake.length; i++) {
    const p = snake[i];
    matrix.setPosition(p.x - offset, 0.5, p.z - offset);
    snakeMesh.setMatrixAt(i, matrix);
  }
  snakeMesh.count = snake.length;
  snakeMesh.instanceMatrix.needsUpdate = true;
}

export function updateFruitMesh(fruit, pos, size) {
  const offset = size / 2 - 0.5;
  fruit.position.set(pos.x - offset, 0.5, pos.z - offset);
}

export function resizeRenderer(renderer, camera) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  // Guard against zero dimensions to prevent division by zero
  if (width <= 0 || height <= 0) {
    return;
  }
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const viewSize = camera.top - camera.bottom;
    camera.left = -viewSize * aspect / 2;
    camera.right = viewSize * aspect / 2;
    camera.updateProjectionMatrix();
  }
}
