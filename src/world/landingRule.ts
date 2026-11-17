/**
 * How the opening flight lands. Everything about the resting view (where the camera stands, what
 * it looks at, and how the picture sits clear of the page's text) is blended in during the flight
 * itself, so it arrives already composed and nothing moves once it has landed.
 */

const smoothstep = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** How far the flight has handed over to the resting view, `t` being how far along its path it is (0 to 1). */
export const handover = (t: number) => smoothstep(0.72, 1, t);

/**
 * How much the camera follows the pointer, `seconds` after it came to rest. It fades in slowly
 * after a landing, so the resting view holds still first.
 */
export const driftWeight = (seconds: number) => smoothstep(1.2, 4, seconds);

/** How far through the flight the cinema bars begin to open: about a second before it lands, so they open during its last slow-down. */
export const BARS_OPEN_AT = 0.89;
