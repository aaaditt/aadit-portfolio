/**
 * The finger or button holding the Lightbox's sheet, or -1. While it is held, dragging scrubs the
 * sheet instead of turning the view (see OrbitInput). A plain object: reading it costs nothing.
 */
export const lightbox = {
  held: -1,
  /** The exhibit whose sheet took hold. Leaving it mid-drag keeps the finger claimed, so the rest
   * of that drag neither turns the world nor scrubs the next sheet; letting go frees it. */
  owner: "",
  /** How far the open sheet's stages are pulled apart, 0 to 1: the camera stands back a little for it. */
  spread: 0,
};
