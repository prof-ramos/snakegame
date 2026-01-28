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
