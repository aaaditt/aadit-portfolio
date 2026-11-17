"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { intro } from "./introStore";
import { orbit, turnBy, zoomBy } from "./orbit";
import { lightbox } from "./show/lightboxStore";

/** Radians turned for each pixel dragged. */
const TURN = 0.006;
const TILT = 0.004;

/**
 * Lets the visitor turn the world: drag to swing round and tilt, scroll or pinch to zoom,
 * arrow keys and plus/minus from the keyboard. Draws nothing.
 */
export function OrbitInput() {
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    /** Every finger or button currently down, and where it last was. */
    const down = new Map<number, { x: number; y: number }>();
    let spread = 0;
    const ready = () => intro.get() === "done";

    const onDown = (event: PointerEvent) => {
      if (!ready()) return;
      down.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (down.size === 1) orbit.moved = 0;
      if (down.size === 2) {
        const [a, c] = [...down.values()];
        spread = Math.hypot(a.x - c.x, a.y - c.y);
      }
    };

    const onMove = (event: PointerEvent) => {
      const last = down.get(event.pointerId);
      if (!last) return;
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      last.x = event.clientX;
      last.y = event.clientY;
      orbit.moved += Math.abs(dx) + Math.abs(dy);

      // A finger on the Lightbox's sheet is scrubbing it, not turning the world.
      if (lightbox.held === event.pointerId) return;
      if (down.size === 2) {
        // Two fingers: pinching in pulls the camera back, spreading brings it closer.
        const [a, c] = [...down.values()];
        const now = Math.hypot(a.x - c.x, a.y - c.y);
        if (spread > 0 && now > 0) zoomBy(spread / now);
        spread = now;
      } else if (orbit.moved > 6) {
        orbit.dragging = true;
        // Dragging right brings the right-hand side of the world round to the front.
        turnBy(-dx * TURN, dy * TILT);
      }
    };

    const onUp = (event: PointerEvent) => {
      down.delete(event.pointerId);
      // A finger whose sheet went away mid-drag is freed here; a live sheet frees its own.
      if (lightbox.held === event.pointerId && lightbox.owner === "") lightbox.held = -1;
      if (down.size === 0) orbit.dragging = false;
    };

    const onWheel = (event: WheelEvent) => {
      if (!ready()) return;
      event.preventDefault();
      zoomBy(Math.exp(event.deltaY * 0.001));
    };

    const onKey = (event: KeyboardEvent) => {
      if (!ready() || event.ctrlKey || event.metaKey || event.altKey) return;
      // Leave the keys alone while a link or button has the focus.
      if (document.activeElement && document.activeElement !== document.body) return;
      if (event.key === "ArrowLeft") turnBy(-0.12, 0);
      else if (event.key === "ArrowRight") turnBy(0.12, 0);
      else if (event.key === "ArrowUp") turnBy(0, 0.06);
      else if (event.key === "ArrowDown") turnBy(0, -0.06);
      else if (event.key === "+" || event.key === "=") zoomBy(0.9);
      else if (event.key === "-") zoomBy(1.1);
      else return;
      event.preventDefault();
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      orbit.dragging = false;
    };
  }, [canvas]);

  return null;
}
