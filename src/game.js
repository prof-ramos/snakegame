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
