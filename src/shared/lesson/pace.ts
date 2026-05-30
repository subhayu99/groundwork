/**
 * Global playback pacing for annotated-canvas lesson animations.
 *
 * Every auto-play beat schedules its frames with `setInterval(fn, pace(ms))`,
 * where `ms` is the authored per-frame delay. Tuning happens in ONE place here:
 * raise PLAYBACK_SLOWDOWN to slow every lesson's animation at once, lower it
 * toward 1 to speed them back up. (1.0 = exactly as authored.)
 */
export const PLAYBACK_SLOWDOWN = 1.6;

export const pace = (ms: number) => Math.round(ms * PLAYBACK_SLOWDOWN);
