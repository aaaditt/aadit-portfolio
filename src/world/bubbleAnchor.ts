/**
 * Where on screen the character's speech bubble belongs, in CSS pixels.
 * The 3D scene writes it every frame; the page's bubble reads it every frame.
 * A plain object, not React state, so following the character costs no re-renders.
 */
export const bubbleAnchor = { x: 0, y: 0, visible: false };
