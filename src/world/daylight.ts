/**
 * How far into night the world is: 0 by day, 1 by night, easing between the two when the theme
 * changes. Daylight writes it every frame and anything that changes at night reads it.
 */
export const daylight = { night: 0 };

/** The colour the far distance fades to at night. Keep in step with --haze at night in globals.css. */
export const NIGHT_HAZE = "#1a2140";
/** The same by day. Keep in step with --haze in globals.css. */
export const DAY_HAZE = "#eef0dc";
