import * as THREE from "three";
import { caption } from "../overlayState";

const point = new THREE.Vector3();
/** Whichever part of the world last pinned the caption. Only it may take the caption down. */
let owner = "";

/**
 * Pins the page's caption to a point in the world, saying `title` and `text`. Call it every frame
 * while the thing is on show, so the caption follows it as the view turns.
 */
export function pin(who: string, title: string, text: string, x: number, y: number, z: number, camera: THREE.Camera, size: { width: number; height: number }) {
  point.set(x, y, z).project(camera);
  owner = who;
  // Not when the point is behind the camera.
  caption.on = point.z < 1;
  caption.x = (point.x * 0.5 + 0.5) * size.width;
  caption.y = (-point.y * 0.5 + 0.5) * size.height;
  caption.title = title;
  caption.text = text;
}

/** Takes the caption down, if `who` was the one that pinned it. Safe to call every frame. */
export function unpin(who: string) {
  if (owner !== who) return;
  owner = "";
  caption.on = false;
}
