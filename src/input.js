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
