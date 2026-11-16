type Vec3 = [number, number, number];

/** How far the visitor may tilt and zoom away from a section's own view. */
export const LIMITS = {
  pitchUp: 0.5,
  pitchDown: -0.2,
  zoomIn: 0.55,
  zoomOut: 1.6,
  /** The camera stays at least this far above the ground beneath it, which clears trees and roofs. */
  minHeight: 8,
  /** The same, for close-up views, which have nothing tall near them. */
  minHeightClose: 2,
  /** Ground higher than this is mountainside, and the camera keeps off it. */
  mountain: 9,
};

/** The steepest and shallowest the camera may look down at its subject, whatever the tilt. */
const STEEPEST = 1.45;
const SHALLOWEST = 0.1;
/** The shallowest a wide view may look once it is swung well round. */
const SWUNG = 0.42;
/** Views nearer their subject than this count as close-ups. */
const CLOSE = 15;

/**
 * How the visitor has turned the view away from the section's own. The pointer handlers write
 * it and the camera reads it every frame, so it is a plain object, not React state.
 */
export const orbit = {
  /** Turn about the vertical, in radians. */
  yaw: 0,
  /** Tilt, in radians; positive looks from higher up. */
  pitch: 0,
  /** Distance from the subject, as a multiple of the section's own. */
  zoom: 1,
  dragging: false,
  /** How many pixels the pointer has travelled since it went down. */
  moved: 0,
  /** True once the view is no longer the section's own. */
  turned: false,
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function turnBy(dYaw: number, dPitch: number) {
  orbit.yaw += dYaw;
  orbit.pitch = clamp(orbit.pitch + dPitch, LIMITS.pitchDown, LIMITS.pitchUp);
  orbit.turned = true;
}

export function zoomBy(factor: number) {
  orbit.zoom = clamp(orbit.zoom * factor, LIMITS.zoomIn, LIMITS.zoomOut);
  orbit.turned = true;
}

export function resetOrbit() {
  orbit.yaw = 0;
  orbit.pitch = 0;
  orbit.zoom = 1;
  orbit.turned = false;
}

/** True if the pointer press that just ended was a pull on the view, not a click. */
export const wasDrag = () => orbit.moved > 6;

/**
 * Where the camera sits once the visitor's turning is applied to a section's view. It swings
 * round the subject, keeping its distance (times the zoom), and never dips into the ground.
 */
export function orbited(position: Vec3, target: Vec3, groundAt: (x: number, z: number) => number): Vec3 {
  if (orbit.yaw === 0 && orbit.pitch === 0 && orbit.zoom === 1) return position;
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const flat = Math.hypot(dx, dz);
  let distance = Math.hypot(flat, dy) * orbit.zoom;
  const own = Math.atan2(dy, flat);
  // A close-up may sit low and level. A wide view that is swung round rises as it goes, because
  // a low, level look across the valley only works from the side it was composed for.
  const close = distance < CLOSE;
  const swung = Math.min(1, Math.abs(Math.atan2(Math.sin(orbit.yaw), Math.cos(orbit.yaw))) / 0.6);
  const lowest = close ? Math.min(own, SHALLOWEST) : Math.max(Math.min(own, SHALLOWEST), SHALLOWEST + (SWUNG - SHALLOWEST) * swung);
  const elevation = clamp(own + orbit.pitch, lowest, STEEPEST);
  const around = Math.atan2(dx, dz) + orbit.yaw;
  let x = 0;
  let z = 0;
  // Swinging round to the back would put the camera in the mountains, so draw it in until it is
  // over the valley floor again.
  for (let tries = 0; tries < 14; tries++) {
    x = target[0] + Math.sin(around) * Math.cos(elevation) * distance;
    z = target[2] + Math.cos(around) * Math.cos(elevation) * distance;
    if (groundAt(x, z) <= LIMITS.mountain) break;
    distance *= 0.9;
  }
  const y = Math.max(target[1] + Math.sin(elevation) * distance, groundAt(x, z) + (close ? LIMITS.minHeightClose : LIMITS.minHeight));
  return [x, y, z];
}
