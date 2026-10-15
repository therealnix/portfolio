import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circularDelta, getFlightFrame, getPresentation, photoOpacity, STATIONS, wrap } from '../src/flight/path.ts';
import { photoDepth, photoPoint, PHOTO_TAN, PHOTO_ASPECT } from '../src/flight/photo-scene.ts';
import { journeyAt, journeyMetrics, remapJourneyOffset, READING_CAMERA } from '../src/flight/journey.ts';
import { ARTICLE_SECTIONS } from '../src/flight/article-content.ts';
import { RIDGES, ridgePath, trailHeight, trailPath } from '../src/flight/ridges.ts';
import { CONTACT_SKETCHES, SKETCHES, strokes } from '../src/flight/sketches.ts';

test('music is one particle stage with the two tracks at its boundaries', () => {
    const musicSections = ARTICLE_SECTIONS.filter(section => section.shape === 'music');
    assert.equal(musicSections.length, 1);
    assert.equal(musicSections[0].tracks?.length, 2);
    assert.ok(!ARTICLE_SECTIONS.some(section => section.shape === 'headphones'));
});

test('the contact stage remains visible during the return and clears before the home frame', () => {
    const m = journeyMetrics(900, 4500), start = m.approach + m.reading;
    assert.equal(journeyAt(start, m).contact, 0);
    for (const fraction of [.12, .28, .5]) {
        const state = journeyAt(start + m.departure * fraction, m);
        assert.equal(state.contact, 1);
        assert.equal(state.reading, false);
        assert.ok(state.phase > READING_CAMERA);
    }
    assert.equal(journeyAt(start + m.departure * .9, m).contact, 0);
});

test('the camera holds still through the article body with short motion overlaps at either end', () => {
    for (const articleHeight of [1500, 4500, 9000]) {
        const m = journeyMetrics(900, articleHeight);
        for (let offset = m.viewport * .9; offset < m.reading - m.viewport * .75; offset += 17) {
            const state = journeyAt(m.approach + offset, m);
            assert.equal(state.reading, true);
            assert.equal(state.phase, READING_CAMERA);
        }
        assert.equal(m.reading, articleHeight + 900);
        const entering = journeyAt(m.approach + 300, m);
        assert.equal(entering.reading, true);
        assert.ok(entering.horizon > .9 && entering.phase < READING_CAMERA);
        const leaving = journeyAt(m.approach + m.reading - 300, m);
        assert.equal(leaving.reading, true);
        assert.ok(leaving.horizon === 1 && leaving.phase > READING_CAMERA);
        assert.ok(journeyAt(m.approach + m.reading + 50, m).phase > READING_CAMERA);
    }
});

test('the earlier sketch transition joins the reading hold continuously', () => {
    const m = journeyMetrics(900, 4500);
    assert.equal(m.approach, 900 * 3.5);
    assert.equal(getPresentation(journeyAt(m.approach * .3, m).phase).sketch, 0);
    assert.ok(getPresentation(journeyAt(m.approach * .6, m).phase).sketch > 0);
    assert.ok(Math.abs(journeyAt(m.approach + m.viewport * .9 - .01, m).phase - READING_CAMERA) < 1e-8);
    assert.equal(getPresentation(READING_CAMERA).sketch, 1);
    assert.ok(Math.abs(journeyAt(m.approach + m.reading - m.viewport * .75 + .01, m).phase - READING_CAMERA) < 1e-8);
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
test('the route profile has a summit on every stop and one ridgeline for every section', () => {
    const stops = [.21, .36, .5, .66, .86];
    for (const stop of stops) {
        const summit = trailHeight(stops, stop);
        assert.ok(summit > trailHeight(stops, stop - .04) && summit > trailHeight(stops, stop + .04));
    }
    for (let i = 0; i <= 1000; i++) {
        const height = trailHeight(stops, i / 1000);
        assert.ok(height > 0 && height <= 1);
    }
    assert.ok(trailPath(stops, 1000, 100).startsWith('M0.0 '));
    assert.ok(trailPath(stops, 1000, 100, true).endsWith('Z'));
    assert.equal(RIDGES.length, ARTICLE_SECTIONS.length);
    RIDGES.forEach((_, index) => assert.match(ridgePath(index, 600, 26), /^M0\.0 [\d.]+ L/));
});
test('every section and every contact link has a line drawing made of separate strokes', () => {
    for (const section of ARTICLE_SECTIONS) {
        const drawing = strokes(SKETCHES[section.shape]);
        assert.ok(drawing.length >= 2);
        drawing.forEach(stroke => assert.match(stroke, /^M[\d.-]+ [\d.-]+ /));
    }
    assert.equal(strokes(SKETCHES.music).length, 6);
    assert.deepEqual(Object.keys(CONTACT_SKETCHES), ['linkedin', 'email', 'substack']);
});
test('the horizon lowers before the first line, stays low through the contact stage and rises on both flight legs', () => {
    const m = journeyMetrics(900, 4500), contactStart = m.approach + m.reading, contactEnd = contactStart + m.departure * .62;
    assert.equal(journeyAt(0, m).horizon, 0);
    assert.equal(journeyAt(m.approach * .5, m).horizon, 0);
    assert.ok(journeyAt(m.approach, m).horizon > .6);
    // Down before the first lines clear the mountains at the bottom sixth of the screen.
    assert.ok(journeyAt(m.approach + m.viewport / 6, m).horizon > .97);
    for (let offset = m.approach + m.viewport * .3; offset <= contactStart + m.departure * .45; offset += 31)
        assert.equal(journeyAt(offset, m).horizon, 1);
    const rising = journeyAt(contactEnd - m.departure * .04, m);
    assert.ok(rising.horizon > 0 && rising.horizon < 1 && rising.contact > 0 && rising.contact < 1);
    for (let offset = contactEnd; offset < m.length; offset += 31) {
        const state = journeyAt(offset, m);
        assert.equal(state.horizon, 0);
        assert.equal(state.contact, 0);
    }
    // No jumps anywhere along the loop.
    for (let offset = 0; offset < m.length; offset += 5)
        assert.ok(Math.abs(journeyAt(offset + 5, m).horizon - journeyAt(offset, m).horizon) < .02);
});
test('the camera is perfectly still while the photograph crossfades into the scene and back', () => {
    const home = getFlightFrame(0);
    for (let i = 0; i <= 2000; i++) {
        const phase = i / 2000;
        if (photoOpacity(phase) > 0) {
            const frame = getFlightFrame(phase);
            // Exactly the opening view (0 and -0 both count as zero).
            [...frame.position, ...frame.target, frame.roll].forEach((v, k) => assert.ok(v === [...home.position, ...home.target, home.roll][k]));
        }
    }
});
