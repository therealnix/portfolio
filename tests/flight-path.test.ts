import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circularDelta, getFlightFrame, photoOpacity, STATIONS, terrainHeight, wrap } from '../src/flight/path.ts';

test('the loop returns to the exact starting camera and photograph', () => {
  assert.deepEqual(getFlightFrame(0), getFlightFrame(1));
  assert.deepEqual(getFlightFrame(-1), getFlightFrame(0));
  assert.equal(photoOpacity(0), 1);
  assert.equal(photoOpacity(1), 1);
  const left = getFlightFrame(1 - 1e-6), right = getFlightFrame(1e-6);
  assert.ok(Math.hypot(...left.position.map((v, i) => v - right.position[i])) < 0.001);
});
test('wrapping never sends the camera backwards across the entire path', () => {
  assert.ok(Math.abs(circularDelta(0.999, 0.001) - 0.002) < 1e-9);
  assert.ok(Math.abs(circularDelta(0.001, 0.999) + 0.002) < 1e-9);
  assert.equal(wrap(-0.25), 0.75);
});
test('the entire flight is finite and clears the terrain', () => {
  for (let i = 0; i < 5000; i++) {
    const frame = getFlightFrame(i / 5000);
    assert.ok([...frame.position, ...frame.target, frame.fov, frame.roll].every(Number.isFinite));
    assert.ok(frame.position[1] >= terrainHeight(frame.position[0], frame.position[2]) + 3.999);
    assert.ok(frame.photo >= 0 && frame.photo <= 1);
  }
});
test('every project has a clear stop outside the photographic transitions', () => {
  for (const station of STATIONS) {
    const frame = getFlightFrame(station.phase);
    assert.equal(frame.photo, 0);
    assert.ok(Math.abs(frame.target[0] - station.x) < 0.001);
    assert.ok(Math.abs(frame.target[2] - station.z) < 0.001);
  }
});

