/**
 * The trophy tent, as the scene leaves it each frame.
 * - `inside`: the camera, and he, are in the room inside the tent.
 * - `fade`: how dark the doorway fade is, 0 to 1, drawn over the world by the page.
 */
export const tent = { inside: false, fade: 0 };

/** Where the room is built: out of sight, far beneath the camp. Its back wall's foot, middle. */
export const ROOM_AT: [number, number, number] = [0, -60, 23];
