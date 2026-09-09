import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circularDelta, getFlightFrame, getPresentation, photoOpacity, STATIONS, wrap } from '../src/flight/path.ts';
import { photoDepth, photoPoint, PHOTO_TAN, PHOTO_ASPECT } from '../src/flight/photo-scene.ts';
import { journeyAt, journeyMetrics, remapJourneyOffset, READING_CAMERA } from '../src/flight/journey.ts';

test('the camera holds exactly still until every line of the article clears the screen', () => {
    for (const articleHeight of [1500, 4500, 9000]) {
        const m = journeyMetrics(900, articleHeight);
        for (let offset = 1; offset < m.reading; offset += 17) {
            const state = journeyAt(m.approach + offset, m);
            assert.equal(state.reading, true);
            assert.equal(state.phase, READING_CAMERA);
        }
        assert.equal(m.reading, articleHeight + 900);
        assert.ok(journeyAt(m.approach + m.reading + 50, m).phase > READING_CAMERA);
    }
});

test('the approach stays colorful longer and joins the reading hold continuously', () => {
    const m = journeyMetrics(900, 4500);
    assert.equal(getPresentation(journeyAt(m.approach * .5, m).phase).sketch, 0);
    assert.ok(Math.abs(journeyAt(m.approach - .01, m).phase - READING_CAMERA) < 1e-8);
    assert.equal(getPresentation(READING_CAMERA).sketch, 1);
    assert.ok(Math.abs(journeyAt(m.approach + m.reading + .01, m).phase - READING_CAMERA) < 1e-8);
    assert.ok(journeyAt(m.length - .01, m).phase > .99999);
    assert.equal(journeyAt(m.length, m).phase, 0);
});

test('resizing preserves progress within the article and on both flight legs', () => {
    const before = journeyMetrics(900, 4500), after = journeyMetrics(700, 8000);
    for (const fraction of [.1, .5, .9]) {
        const reading = journeyAt(remapJourneyOffset(before.length + before.approach + before.reading * fraction, before, after), after);
        assert.equal(reading.phase, READING_CAMERA);
        assert.ok(Math.abs(reading.readOffset / after.reading - fraction) < 1e-10);
        assert.ok(Math.abs(remapJourneyOffset(before.approach * fraction, before, after) / after.approach - fraction) < 1e-10);
        const exit = remapJourneyOffset(before.approach + before.reading + before.departure * fraction, before, after);
        assert.ok(Math.abs((exit - after.approach - after.reading) / after.departure - fraction) < 1e-10);
    }
});
test('the clean opening reconstructs exactly and the project view is fully sketch', () => {
    assert.deepEqual(getPresentation(0), { greeting: 1, sketch: 0, work: 0, hud: 0 });
    assert.deepEqual(getPresentation(1), getPresentation(0));
    assert.equal(getPresentation(.5).sketch, 1);
    assert.equal(getPresentation(.5).work, 1);
    assert.equal(getPresentation(.5).greeting, 0);
    assert.equal(getPresentation(.99).sketch, 0);
    for (let i = 0; i < 1000; i++)
        for (const opacity of Object.values(getPresentation(i / 1000)))
            assert.ok(opacity >= 0 && opacity <= 1);
});
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
test('the flight stays finite and moves beside the hiker toward the left mountain', () => {
    for (let i = 0; i < 5000; i++) {
        const frame = getFlightFrame(i / 5000);
        assert.ok([...frame.position, ...frame.target, frame.fov, frame.roll].every(Number.isFinite));
        assert.ok(frame.position[2] > -40);
        assert.ok(frame.photo >= 0 && frame.photo <= 1);
    }
    assert.ok(getFlightFrame(.15).position[0] < -2);
    assert.ok(getFlightFrame(.38).position[0] < -15);
    assert.ok(getFlightFrame(.38).position[2] < -16);
    // The camera passes the subject's depth only after it has moved well to their left.
    for (let i = 0; i < 1000; i++) {
        const frame = getFlightFrame(i / 1000);
        if (Math.abs(frame.position[2] + 22) < 1)
            assert.ok(frame.position[0] < -15);
    }
});
test('every project has a clear stop outside the photographic transitions', () => {
    for (const station of STATIONS) {
        const frame = getFlightFrame(station.phase);
        assert.equal(frame.photo, 0);
        assert.ok(frame.target[2] < frame.position[2]);
    }
});
test('depth-projected photo coordinates reproduce the original image at the opening', () => {
    for (let row = 0; row <= 50; row++)
        for (let col = 0; col <= 50; col++) {
            const u = col / 50, v = .44 + row / 50 * .56;
            const depth = photoDepth(u, v), p = photoPoint(u, v);
            assert.ok(depth > 20 && depth < 700);
            assert.ok(Math.abs(p.x / (-p.z * PHOTO_TAN * 2 * PHOTO_ASPECT) + .5 - u) < 1e-10);
            assert.ok(Math.abs(.5 - p.y / (-p.z * PHOTO_TAN * 2) - v) < 1e-10);
        }
});
