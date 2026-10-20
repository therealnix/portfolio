import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circularDelta, getFlightFrame, getPresentation, photoOpacity, STATIONS, wrap } from '../src/flight/path.ts';
import { photoDepth, photoPoint, PHOTO_TAN, PHOTO_ASPECT } from '../src/flight/photo-scene.ts';
import { journeyAt, journeyMetrics, LOOPS, MIDDLE_LOOP, nearEdge, recenter, remapJourneyOffset, READING_CAMERA } from '../src/flight/journey.ts';
import { ARTICLE_SECTIONS } from '../src/flight/article-content.ts';
import { RIDGES, ridgePath, trailHeight, trailPath } from '../src/flight/ridges.ts';
import { CONTACT_SKETCHES, SKETCHES, strokes } from '../src/flight/sketches.ts';

test('music is one particle stage with the two tracks at its boundaries', () => {
    const musicSections = ARTICLE_SECTIONS.filter(section => section.shape === 'music');
    assert.equal(musicSections.length, 1);
    assert.equal(musicSections[0].tracks?.length, 2);
    assert.ok(!ARTICLE_SECTIONS.some(section => section.shape === 'headphones'));
});

test('the contact stage appears while the camera rests and fades as the return flight sets off', () => {
    const m = journeyMetrics(900, 4500), contactStart = m.approach + m.reading, contactEnd = contactStart + m.contact;
    assert.equal(journeyAt(contactStart - m.viewport * .5, m).contact, 0);
    // Fully shown, with the camera exactly where the article left it.
    for (let offset = contactStart + m.viewport * .4; offset <= contactEnd; offset += 17) {
        const state = journeyAt(offset, m);
        assert.equal(state.contact, 1);
        assert.equal(state.phase, READING_CAMERA);
        assert.equal(state.reading, false);
    }
    // Scrolling on: the stage fades while the camera starts to move, slowly at first.
    const setOff = journeyAt(contactEnd + m.viewport * .4, m);
    assert.ok(setOff.contact > 0 && setOff.contact < 1 && setOff.leaving);
    assert.ok(setOff.phase > READING_CAMERA);
    // Starting slowly: the first stretch moves the camera far less than the same stretch mid-flight.
    const middle = contactEnd + m.departure / 2;
    assert.ok(setOff.phase - READING_CAMERA < (journeyAt(middle + m.viewport * .4, m).phase - journeyAt(middle, m).phase) / 4);
    assert.equal(journeyAt(contactEnd + m.viewport * .8, m).contact, 0);
    for (let offset = contactEnd + m.viewport * .8; offset < m.length; offset += 31)
        assert.equal(journeyAt(offset, m).contact, 0);
    // The camera never jumps: the departure eases out of the rest.
    for (let offset = contactEnd - 50; offset < contactEnd + m.viewport; offset += 5)
        assert.ok(journeyAt(offset + 5, m).phase - journeyAt(offset, m).phase < .002);
});

test('the camera holds still through the article body with short motion overlaps at either end', () => {
    for (const articleHeight of [1500, 4500, 9000]) {
        const m = journeyMetrics(900, articleHeight);
        for (let offset = m.viewport * .9; offset <= m.reading + m.contact; offset += 17) {
            const state = journeyAt(m.approach + offset, m);
            assert.equal(state.phase, READING_CAMERA);
        }
        assert.equal(m.reading, articleHeight + 900);
        const entering = journeyAt(m.approach + 300, m);
        assert.equal(entering.reading, true);
        assert.ok(entering.horizon > .9 && entering.phase < READING_CAMERA);
        const leaving = journeyAt(m.approach + m.reading - 300, m);
        assert.equal(leaving.reading, true);
        assert.ok(leaving.horizon === 1 && leaving.phase === READING_CAMERA);
        assert.ok(journeyAt(m.approach + m.reading + m.contact + 50, m).phase > READING_CAMERA);
    }
});

test('the earlier sketch transition joins the reading hold continuously', () => {
    const m = journeyMetrics(900, 4500);
    assert.equal(m.approach, 900 * 3.5);
    assert.equal(getPresentation(journeyAt(m.approach * .3, m).phase).sketch, 0);
    assert.ok(getPresentation(journeyAt(m.approach * .6, m).phase).sketch > 0);
    assert.ok(Math.abs(journeyAt(m.approach + m.viewport * .9 - .01, m).phase - READING_CAMERA) < 1e-8);
    assert.equal(getPresentation(READING_CAMERA).sketch, 1);
    assert.ok(Math.abs(journeyAt(m.approach + m.reading + m.contact + .01, m).phase - READING_CAMERA) < 1e-8);
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
        const stage = remapJourneyOffset(before.approach + before.reading + before.contact * fraction, before, after);
        assert.ok(Math.abs((stage - after.approach - after.reading) / after.contact - fraction) < 1e-10);
        const exit = remapJourneyOffset(before.approach + before.reading + before.contact + before.departure * fraction, before, after);
        assert.ok(Math.abs((exit - after.approach - after.reading - after.contact) / after.departure - fraction) < 1e-10);
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
    const m = journeyMetrics(900, 4500), contactEnd = m.approach + m.reading + m.contact;
    assert.equal(journeyAt(0, m).horizon, 0);
    assert.equal(journeyAt(m.approach * .5, m).horizon, 0);
    assert.ok(journeyAt(m.approach, m).horizon > .6);
    // Down before the first lines clear the mountains at the bottom sixth of the screen.
    assert.ok(journeyAt(m.approach + m.viewport / 6, m).horizon > .97);
    for (let offset = m.approach + m.viewport * .3; offset <= contactEnd + m.viewport * .1; offset += 31)
        assert.equal(journeyAt(offset, m).horizon, 1);
    // It rises after the camera has set off and is up long before the photograph returns.
    const rising = journeyAt(contactEnd + m.viewport * .7, m);
    assert.ok(rising.horizon > 0 && rising.horizon < 1 && rising.phase > READING_CAMERA);
    for (let offset = contactEnd + m.viewport * 1.4; offset < m.length; offset += 31) {
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
test('the return flight retraces the fly-by straight back to the opening frame', () => {
    const home = getFlightFrame(0);
    let previous = Infinity;
    for (let i = 0; i <= 1000; i++) {
        const u = i / 1000, back = getFlightFrame(READING_CAMERA + (.965 - READING_CAMERA) * u);
        // Exactly the view the fly-by passed through on the way out, so no new detours or close-ups.
        const out = getFlightFrame(READING_CAMERA - (READING_CAMERA - .045) * u);
        for (const field of ['position', 'target'] as const)
            back[field].forEach((v, k) => assert.ok(Math.abs(v - out[field][k]) < 1e-9));
        // Always getting closer to the opening view, never turning back.
        const distance = Math.hypot(...back.position.map((v, k) => v - home.position[k]));
        assert.ok(distance <= previous + 1e-9);
        previous = distance;
    }
    // Continuous where it leaves the reading view, and slowing into the opening frame.
    const from = getFlightFrame(READING_CAMERA), leave = getFlightFrame(READING_CAMERA + 1e-7);
    assert.ok(Math.hypot(...leave.position.map((v, k) => v - from.position[k])) < 1e-3);
    const step = (a: number, b: number) => Math.hypot(...getFlightFrame(a).position.map((v, k) => v - getFlightFrame(b).position[k]));
    assert.ok(step(.955, .965) < step(.70, .71) / 4);
});
test('moving the reader back to the middle loop keeps them at exactly the same point of the journey', () => {
    const m = journeyMetrics(900, 4500);
    assert.ok(LOOPS >= 3 && MIDDLE_LOOP > 0 && MIDDLE_LOOP < LOOPS - 1);
    for (let y = 0; y < m.length * LOOPS; y += 97) {
        const moved = recenter(y, m.length);
        if (Math.floor(y / m.length) === MIDDLE_LOOP) {
            assert.equal(moved, null);
            continue;
        }
        assert.ok(moved !== null && Math.floor(moved / m.length) === MIDDLE_LOOP);
        const before = journeyAt(y, m), after = journeyAt(moved, m);
        assert.ok(Math.abs(before.local - after.local) < 1e-6);
        assert.ok(Math.abs(after.phase - before.phase) < 1e-12);
    }
    // There is at least a whole loop of room on either side of the middle before an end of the page is near.
    assert.equal(nearEdge(m.length * MIDDLE_LOOP, m.length), false);
    assert.equal(nearEdge(m.length * (MIDDLE_LOOP + 1) - 1, m.length), false);
    assert.equal(nearEdge(m.length * (MIDDLE_LOOP - 1), m.length), false);
    assert.equal(nearEdge(m.length * .2, m.length), true);
    assert.equal(nearEdge(m.length * (LOOPS - .2), m.length), true);
});
