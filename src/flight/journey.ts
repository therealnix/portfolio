import { clamp, smoothstep, wrap } from './path.ts';
export const READING_CAMERA = .48;
export function journeyMetrics(viewport: number, articleHeight: number) {
    const approach = viewport * 3.5;
    const reading = articleHeight + viewport;
    const departure = viewport * 3.5;
    return { viewport, articleHeight, approach, reading, departure, length: approach + reading + departure };
}
export type JourneyMetrics = ReturnType<typeof journeyMetrics>;
export function journeyAt(offset: number, metrics: JourneyMetrics) {
    const local = wrap(offset / metrics.length) * metrics.length;
    const readOffset = local - metrics.approach;
    const reading = readOffset >= 0 && readOffset <= metrics.reading;
    const holdStart = metrics.approach + metrics.viewport * .9;
    const holdEnd = metrics.approach + metrics.reading - metrics.viewport * .75;
    const holding = local >= holdStart && local <= holdEnd;
    const phase = local < holdStart
        ? READING_CAMERA * smoothstep(0, holdStart, local)
        : holding ? READING_CAMERA
            : READING_CAMERA + (1 - READING_CAMERA) * smoothstep(holdEnd, metrics.length, local);
    const reveal = reading ? smoothstep(0, metrics.viewport * .65, readOffset)
        * (1 - smoothstep(metrics.reading - metrics.viewport * .8, metrics.reading, readOffset)) : 0;
    const entrance = smoothstep(0, metrics.viewport * .65, readOffset);
    const textOpacity = entrance * (1 - smoothstep(metrics.reading - metrics.viewport * .45, metrics.reading, readOffset));
    const contactStart = metrics.approach + metrics.reading;
    const contactDuration = metrics.departure * .62;
    const contactRaw = clamp((local - contactStart) / contactDuration);
    const contact = local > contactStart ? smoothstep(0, .12, contactRaw) * (1 - smoothstep(.82, 1, contactRaw)) : 0;
    return { local, phase: Math.min(phase, 1 - 1e-9), reading, holding, readOffset, reveal, entrance, textOpacity, contact };
}
export function remapJourneyOffset(offset: number, before: JourneyMetrics, after: JourneyMetrics) {
    const state = journeyAt(offset, before);
    if (state.local < before.approach)
        return state.local / before.approach * after.approach;
    if (state.reading)
        return after.approach + clamp(state.readOffset / before.reading) * after.reading;
    return after.approach + after.reading + (state.readOffset - before.reading) / before.departure * after.departure;
}
