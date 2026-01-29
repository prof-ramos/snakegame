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
