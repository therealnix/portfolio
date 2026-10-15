import { clamp, smoothstep, wrap } from './path.ts';
export const READING_CAMERA = .48;
export function journeyMetrics(viewport: number, articleHeight: number) {
    const approach = viewport * 3.5;
    const reading = articleHeight + viewport;
    // "Let's connect." is shown while the camera still rests where the article left it.
    const contact = viewport;
    const departure = viewport * 3.5;
    return { viewport, articleHeight, approach, reading, contact, departure, length: approach + reading + contact + departure };
}
export type JourneyMetrics = ReturnType<typeof journeyMetrics>;
export function journeyAt(offset: number, metrics: JourneyMetrics) {
    const { viewport: vh, approach } = metrics;
    const local = wrap(offset / metrics.length) * metrics.length;
    const readOffset = local - approach;
    const reading = readOffset >= 0 && readOffset <= metrics.reading;
    const contactStart = approach + metrics.reading, contactEnd = contactStart + metrics.contact;
    // The camera settles as the article arrives and then rests through the article and the contact stage.
    // It only sets off again once the reader scrolls past "Let's connect.", starting slowly.
    const holdStart = approach + vh * .9;
    const holding = local >= holdStart && local <= contactEnd;
    const phase = local < holdStart
        ? READING_CAMERA * smoothstep(0, holdStart, local)
        : holding ? READING_CAMERA
            : READING_CAMERA + (1 - READING_CAMERA) * smoothstep(contactEnd, metrics.length, local);
    const reveal = reading ? smoothstep(0, vh * .65, readOffset)
        * (1 - smoothstep(metrics.reading - vh * .8, metrics.reading, readOffset)) : 0;
    // The contact stage fades in as the last lines leave and fades out as the camera starts to move.
    const contact = smoothstep(contactStart - vh * .2, contactStart + vh * .4, local) * (1 - smoothstep(contactEnd, contactEnd + vh * .8, local));
    const leaving = local > contactEnd;
    // The horizon glides down as the fly-by settles, so the first lines rise from behind the mountains.
    // It stays low through the article and the contact stage and rises once the camera has set off.
    const horizon = smoothstep(-vh * .95, vh * .25, readOffset) * (1 - smoothstep(contactEnd + vh * .1, contactEnd + vh * 1.4, local));
    // The route runs from the first line of the article to the last.
    const progress = clamp(readOffset / metrics.reading);
    return { local, phase: Math.min(phase, 1 - 1e-9), reading, holding, readOffset, reveal, horizon, contact, leaving, progress };
}
export function remapJourneyOffset(offset: number, before: JourneyMetrics, after: JourneyMetrics) {
    const state = journeyAt(offset, before);
    if (state.local < before.approach)
        return state.local / before.approach * after.approach;
    if (state.reading)
        return after.approach + clamp(state.readOffset / before.reading) * after.reading;
    const contactLocal = state.readOffset - before.reading;
    if (contactLocal < before.contact)
        return after.approach + after.reading + contactLocal / before.contact * after.contact;
    return after.approach + after.reading + after.contact + (contactLocal - before.contact) / before.departure * after.departure;
}
