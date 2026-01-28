# Snake 3D Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based 3D Snake game (top-down, Nokia-style mono palette) with keyboard controls, wall collisions, and speed-up per fruit.

**Architecture:** Separate pure game-logic (grid, collisions, RNG) from rendering (Three.js scene/meshes) and input mapping. The render loop runs every frame, while gameplay advances on fixed timesteps to keep movement consistent.

**Tech Stack:** Vanilla HTML/CSS/JS (ES modules), Three.js via CDN (ES module), Node built-in test runner for logic tests.

---

### Task 1: Core game state + movement logic

**Files:**
- Create: `src/game.js`
- Create: `tests/game.test.js`

**Step 1: Write the failing tests**

```js
// tests/game.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, step, DIRECTIONS } from '../src/game.js';

const fixedRng = (() => {
  const seq = [0.1, 0.2, 0.3, 0.4];
  let i = 0;
  return () => seq[(i++) % seq.length];
})();

test('moves one cell per tick', () => {
  const state = createState(16, fixedRng);
  const next = step(state, fixedRng);
  assert.equal(next.snake[0].x, state.snake[0].x + 1);
});

test('wall collision ends game', () => {
  const state = createState(4, fixedRng);
  // force head near right edge
  state.snake[0] = { x: 3, z: 1 };
  const next = step(state, fixedRng);
  assert.equal(next.alive, false);
});

test('eating fruit grows snake and speeds up', () => {
  const state = createState(8, fixedRng);
  // place fruit directly ahead
  state.fruit = { x: state.snake[0].x + 1, z: state.snake[0].z };
  const next = step(state, fixedRng);
  assert.equal(next.snake.length, state.snake.length + 1);
  assert.ok(next.tickMs < state.tickMs);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/game.test.js`
Expected: FAIL with "Cannot find module '../src/game.js'"

**Step 3: Write minimal implementation**

```js
// src/game.js
export const DIRECTIONS = {
  UP: { x: 0, z: -1 },
  DOWN: { x: 0, z: 1 },
  LEFT: { x: -1, z: 0 },
  RIGHT: { x: 1, z: 0 },
};

export function createState(size, rng = Math.random) {
  const mid = Math.floor(size / 2);
  const snake = [
    { x: mid, z: mid },
    { x: mid - 1, z: mid },
    { x: mid - 2, z: mid },
  ];
  const state = {
    size,
    snake,
    dir: DIRECTIONS.RIGHT,
    nextDir: DIRECTIONS.RIGHT,
    fruit: null,
    alive: true,
    tickMs: 120,
    minTickMs: 50,
    tickStep: 5,
  };
  state.fruit = randomFreeCell(state, rng);
  return state;
}

export function step(state, rng = Math.random) {
  if (!state.alive) return state;
  const dir = state.nextDir;
  const head = state.snake[0];
  const nextHead = { x: head.x + dir.x, z: head.z + dir.z };

  if (hitsWall(nextHead, state.size) || hitsSelf(nextHead, state.snake)) {
    return { ...state, alive: false };
  }

  const ate = state.fruit && nextHead.x === state.fruit.x && nextHead.z === state.fruit.z;
  const nextSnake = [nextHead, ...state.snake];
  if (!ate) nextSnake.pop();

  const nextState = {
    ...state,
    dir,
    snake: nextSnake,
  };

  if (ate) {
    nextState.fruit = randomFreeCell(nextState, rng);
    nextState.tickMs = Math.max(nextState.minTickMs, nextState.tickMs - nextState.tickStep);
  }

  return nextState;
}

function hitsWall(pos, size) {
  return pos.x < 0 || pos.z < 0 || pos.x >= size || pos.z >= size;
}

function hitsSelf(pos, snake) {
  return snake.some((p) => p.x === pos.x && p.z === pos.z);
}

function randomFreeCell(state, rng) {
  while (true) {
    const x = Math.floor(rng() * state.size);
    const z = Math.floor(rng() * state.size);
    if (!hitsSelf({ x, z }, state.snake)) return { x, z };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/game.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game.js tests/game.test.js
git commit -m "feat: add core snake game logic"
```

---

### Task 2: Input mapping (arrows + WASD, no reverse)

**Files:**
- Create: `src/input.js`
- Create: `tests/input.test.js`
- Modify: `src/game.js`

**Step 1: Write the failing tests**

```js
// tests/input.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { keyToDirection, isReverse } from '../src/input.js';
import { DIRECTIONS } from '../src/game.js';

test('maps Arrow keys and WASD', () => {
  assert.deepEqual(keyToDirection('ArrowUp'), DIRECTIONS.UP);
  assert.deepEqual(keyToDirection('w'), DIRECTIONS.UP);
  assert.deepEqual(keyToDirection('a'), DIRECTIONS.LEFT);
});

test('blocks reverse direction', () => {
  assert.equal(isReverse(DIRECTIONS.LEFT, DIRECTIONS.RIGHT), true);
  assert.equal(isReverse(DIRECTIONS.UP, DIRECTIONS.LEFT), false);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/input.test.js`
Expected: FAIL with "Cannot find module '../src/input.js'"

**Step 3: Write minimal implementation**

```js
// src/input.js
import { DIRECTIONS } from './game.js';

const KEY_MAP = {
  ArrowUp: DIRECTIONS.UP,
  ArrowDown: DIRECTIONS.DOWN,
  ArrowLeft: DIRECTIONS.LEFT,
  ArrowRight: DIRECTIONS.RIGHT,
  w: DIRECTIONS.UP,
  s: DIRECTIONS.DOWN,
  a: DIRECTIONS.LEFT,
  d: DIRECTIONS.RIGHT,
};

export function keyToDirection(key) {
  const normalized = key.length === 1 ? key.toLowerCase() : key;
  return KEY_MAP[normalized] || null;
}

export function isReverse(current, next) {
  return current.x + next.x === 0 && current.z + next.z === 0;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/input.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/input.js tests/input.test.js src/game.js
git commit -m "feat: add input mapping and reverse guard"
```

---

### Task 3: Three.js rendering module (scene, camera, meshes)

**Files:**
- Create: `src/render.js`

**Step 1: Create render module skeleton**

```js
// src/render.js
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
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const viewSize = camera.top - camera.bottom;
    camera.left = -viewSize * aspect / 2;
    camera.right = viewSize * aspect / 2;
    camera.updateProjectionMatrix();
  }
}
```

**Step 2: Manual verification**

Run a local server and confirm no runtime errors (see Task 4 for full wiring).

**Step 3: Commit**

```bash
git add src/render.js
git commit -m "feat: add Three.js renderer and mesh updates"
```

---

### Task 4: Wire main loop + UI overlay

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `src/main.js`
- Modify: `src/game.js`

**Step 1: Create HTML + CSS overlay**

```html
<!-- index.html -->
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Snake 3D</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div id="hud">
      <div id="status">Pressione Enter</div>
      <div id="score">Pontos: 0</div>
    </div>
    <canvas id="c"></canvas>
    <script type="module" src="src/main.js"></script>
  </body>
</html>
```

```css
/* style.css */
html, body { margin: 0; height: 100%; background: #2a2a2a; color: #e0e0e0; font-family: monospace; }
#c { width: 100%; height: 100%; display: block; }
#hud { position: fixed; top: 12px; left: 12px; display: grid; gap: 6px; }
```

**Step 2: Implement main loop with fixed timestep**

```js
// src/main.js
import { createState, step } from './game.js';
import { keyToDirection, isReverse } from './input.js';
import { createRenderer, updateSnakeMesh, updateFruitMesh, resizeRenderer } from './render.js';

const canvas = document.querySelector('#c');
const statusEl = document.querySelector('#status');
const scoreEl = document.querySelector('#score');

let state = createState(16);
let mode = 'idle';
let last = performance.now();
let acc = 0;

const { renderer, scene, camera, snakeMesh, fruit } = createRenderer(canvas, state.size);
updateSnakeMesh(snakeMesh, state.snake, state.size);
updateFruitMesh(fruit, state.fruit, state.size);

window.addEventListener('keydown', (e) => {
  if (mode === 'idle' && e.key === 'Enter') {
    mode = 'playing';
    statusEl.textContent = '';
    return;
  }
  if (mode === 'gameover' && e.key.toLowerCase() === 'r') {
    state = createState(16);
    mode = 'playing';
    statusEl.textContent = '';
    return;
  }

  const next = keyToDirection(e.key);
  if (next && !isReverse(state.dir, next)) {
    state = { ...state, nextDir: next };
  }
});

function animate(t) {
  const dt = t - last;
  last = t;
  acc += dt;

  while (mode === 'playing' && acc >= state.tickMs) {
    acc -= state.tickMs;
    state = step(state);
    updateSnakeMesh(snakeMesh, state.snake, state.size);
    updateFruitMesh(fruit, state.fruit, state.size);

    scoreEl.textContent = `Pontos: ${state.snake.length - 1}`;

    if (!state.alive) {
      mode = 'gameover';
      statusEl.textContent = 'Game Over — R para reiniciar';
    }
  }

  resizeRenderer(renderer, camera);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

**Step 3: Manual verification**

Run: `python3 -m http.server` and open `http://localhost:8000`.
Expected: grid appears; Enter starts; arrows/WASD move; collisions end game; speed increases per fruit.

**Step 4: Commit**

```bash
git add index.html style.css src/main.js

git commit -m "feat: wire main loop and UI overlay"
```

---

### Task 5: Polish + small fixes

**Files:**
- Modify: `src/render.js`
- Modify: `style.css`

**Step 1: Add minor polish**
- Slightly bevel fruit size or color contrast
- Tweak background or grid contrast for Nokia vibe

**Step 2: Manual verification**
- Confirm visuals readable and input feels responsive

**Step 3: Commit**

```bash
git add src/render.js style.css
git commit -m "chore: polish visuals"
```
