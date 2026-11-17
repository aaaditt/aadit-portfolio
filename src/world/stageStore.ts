import type { StagePlace } from "./stageRule";

/**
 * The Stage as the scene leaves it each frame: how far it is up, which place's grade it wears, and
 * the middle of the show it lights. Read by the light, the fog, the camera, the voxel shader and
 * the page. A plain object, so following it costs no re-renders.
 */
export const stage = {
  /** 0 the ordinary world, 1 fully staged. */
  level: 0,
  /** How brightly the light on the show shines, 0 to 1. */
  key: 0,
  place: "design" as StagePlace,
  /** A stage that is a whole view, not one show: the world dims, but the lens and framing stay wide. */
  wide: false,
  x: 0,
  y: 0,
  z: 0,
};

/** Shared with every voxel material, so one write dims the whole world but the show. */
export const stageUniforms = {
  uStageCentre: { value: [0, 0, 0] as [number, number, number] },
  /** x: the radius beyond which things are dimmed; y: how far the dimming has gone, 0 to 1. */
  uStageDim: { value: [14, 0] as [number, number] },
};

/** How far the camera's move between places has got, 0 to 1. Written by CameraRig. */
export const cameraMove = { progress: 1 };
