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
    const phase = local < metrics.approach
        ? READING_CAMERA * smoothstep(0, metrics.approach, local)
        : reading ? READING_CAMERA
            : READING_CAMERA + (1 - READING_CAMERA) * smoothstep(0, metrics.departure, readOffset - metrics.reading);
    const reveal = reading ? smoothstep(0, metrics.viewport * .65, readOffset)
        * (1 - smoothstep(metrics.reading - metrics.viewport * .8, metrics.reading, readOffset)) : 0;
    return { local, phase: Math.min(phase, 1 - 1e-9), reading, readOffset, reveal };
}
export function remapJourneyOffset(offset: number, before: JourneyMetrics, after: JourneyMetrics) {
    const state = journeyAt(offset, before);
    if (state.local < before.approach)
        return state.local / before.approach * after.approach;
    if (state.reading)
        return after.approach + clamp(state.readOffset / before.reading) * after.reading;
    return after.approach + after.reading + (state.readOffset - before.reading) / before.departure * after.departure;
}
