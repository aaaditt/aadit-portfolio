"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CREDENTIALS } from "@/content/about";
import type { SectionId } from "@/content/sections";
import { sfx } from "@/audio/engine";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { hover } from "../overlayState";
import { asked, trophies } from "../pickStore";
import { ROOM_AT, tent } from "../tentStore";
import { walker } from "../walker";
import { b, type Box } from "../voxel/box";
import { pixelText } from "../voxel/lettering";
import { K, trophy } from "../voxel/models";
import { Voxels } from "../voxel/Voxels";
import { DEPTH, OBJECT_SCALE, PER_ROW, displaySpot, roomSize, shelves, slots } from "./trophyRule";

/** One colour per shelf, in order. */
const TINTS = [K.blue, K.coral, K.teal, K.gold, K.pink, K.crop];
/** The doorway fade: in, then out, in seconds. */
const FADE_IN = 0.35;
const FADE_OUT = 0.45;

/** The room's shell and its shelves, in the room's own units (see trophyRule). */
function shell(w: number, h: number): Box[] {
  const out: Box[] = [
    // floor, back wall, side walls, ceiling
    b(-w / 2, -0.2, 0, w, 0.2, DEPTH, "#6d4c35"),
    b(-w / 2, 0, -0.3, w, h, 0.3, "#c9a77a"),
    b(-w / 2 - 0.3, 0, 0, 0.3, h, DEPTH, "#b8946a"),
    b(w / 2, 0, 0, 0.3, h, DEPTH, "#b8946a"),
    b(-w / 2 - 0.3, h, -0.3, w + 0.6, 0.3, DEPTH + 0.3, "#8b6b4a"),
    // a runner rug from the doorway up to the shelves, so the room's depth reads
    b(-1.3, 0, 1, 2.6, 0.04, DEPTH - 4, K.coralD),
    b(-1, 0.01, 1.2, 2, 0.04, DEPTH - 4.4, K.orange),
    ...Array.from({ length: Math.ceil(w / 0.8) }, (_, i) => b(-w / 2 + i * 0.8, h - 0.5, -0.05, 0.8, 0.5, 0.06, i % 2 ? K.cream : K.orange)),
  ];
  return out;
}

/**
 * The room inside the camp's tent. Asked what he has earned, he walks to the tent, its flap opens,
 * the doorway goes dark, and the camera comes out inside: a room bigger than the tent, with a shelf
 * on its back wall for each kind of certificate and an object for each one. Picking one brings it
 * forward. Any other question, or leaving the page, takes him back out the same way.
 */
export function Trophies({ current }: { current: SectionId }) {
  const animate = useMotion();
  const objects = useRef<(THREE.Group | null)[]>([]);
  const spotlight = useRef<THREE.PointLight>(null);
  const lifts = useRef(CREDENTIALS.map(() => 0));
  /** Which way the doorway fade is going: in towards the room, out of it, or nowhere. */
  const going = useRef<"" | "in" | "out">("");
  const here = current === "about";

  const layout = useMemo(() => {
    const size = roomSize(CREDENTIALS);
    const placed = slots(CREDENTIALS);
    const list = shelves(CREDENTIALS);
    const boxes: Box[] = [...shell(size.w, size.h)];
    // A plank under every row, and a name plate on the front of each shelf's first one.
    list.forEach((shelf, s) => {
      shelf.items.forEach((item, i) => {
        if (i % PER_ROW !== 0) return;
        const y = placed[item.id].y;
        // The plank the row stands on, thick enough to carry its name plate on its front.
        boxes.push(b(-size.w / 2 + 0.6, y - 0.82, 0, size.w - 1.2, 0.26, 0.6, K.woodD));
        if (i === 0) {
          const plate = pixelText(shelf.title, 0.045, K.cream);
          const width = Math.min(2.6, shelf.title.length * 0.18 + 0.3);
          const left = -size.w / 2 + 0.7;
          boxes.push(b(left, y - 0.8, 0.6, width, 0.22, 0.04, TINTS[s % TINTS.length]));
          boxes.push(...plate.map(([x, py, z, bw, bh, bd, c]) => b(x + left + width / 2, py + y - 0.77, z + 0.64, bw, bh, bd, c) as Box));
        }
      });
    });
    const models = CREDENTIALS.map((c) => {
      const s = placed[c.id].shelf;
      return trophy(list[s].shape, TINTS[s % TINTS.length]);
    });
    return { size, placed, boxes, models, spot: displaySpot(size) };
  }, []);

  // Leaving the page while inside comes straight back out, with no fade.
  useEffect(() => {
    if (here) return;
    trophies.clear();
    going.current = "";
    tent.fade = 0;
    if (tent.inside) tent.inside = false;
  }, [here]);

  useFrame(({ clock }, delta) => {
    const step = Math.min(delta, 0.05);
    const want = here && asked.get() === "earned";

    // Going in: once he is at the tent, the doorway goes dark, and at full dark the room is there.
    if (want && !tent.inside && going.current === "" && !walker.moving && walker.x < -0.5 && Math.abs(walker.z - 23) < 1.2) going.current = "in";
    if (!want && tent.inside && going.current === "") going.current = "out";

    if (going.current) {
      if (!animate) tent.fade = 1;
      tent.fade = Math.min(1, tent.fade + step / (tent.inside === (going.current === "in") ? FADE_OUT : FADE_IN));
      if (tent.fade >= 1) {
        const enter = going.current === "in";
        tent.inside = enter;
        going.current = "";
        if (enter) {
          // He stands at the right-hand end of the shelves, facing the visitor.
          walker.enter(ROOM_AT[0] + layout.size.w / 2 - 1.4, ROOM_AT[1], ROOM_AT[2] + 2.6, -0.45);
          if (animate) sfx.step();
        } else {
          trophies.clear();
        }
        // Then the dark lifts.
        tent.fade = animate ? 0.999 : 0;
      }
    } else if (tent.fade > 0) {
      tent.fade = animate ? Math.max(0, tent.fade - step / FADE_OUT) : 0;
    }

    // The picked certificate flies off its shelf to the middle of the room, large, in its own light;
    // the rest step back a little.
    const picked = CREDENTIALS.findIndex((c) => c.id === trophies.get());
    const ease = animate ? 1 - Math.exp(-9 * step) : 1;
    CREDENTIALS.forEach((c, i) => {
      const group = objects.current[i];
      if (!group) return;
      lifts.current[i] += ((picked === i ? 1 : 0) - lifts.current[i]) * ease;
      const k = lifts.current[i];
      const at = layout.placed[c.id];
      const back = picked >= 0 && picked !== i ? 0.2 : 0;
      const spot = layout.spot;
      group.position.set(ROOM_AT[0] + at.x + (spot.x - at.x) * k, ROOM_AT[1] + at.y + (spot.y - at.y) * k, ROOM_AT[2] + 0.35 - back + (spot.z - 0.35) * k);
      group.scale.setScalar(OBJECT_SCALE * (1 + k * 0.9));
      // The others dim while one is picked.
      const dim = picked >= 0 && picked !== i ? 1 - 0.55 * lifts.current[picked] : 1;
      group.traverse((part) => {
        if (part instanceof THREE.InstancedMesh) (part.material as THREE.MeshStandardMaterial).color.setScalar(dim);
      });
      group.rotation.y = animate ? Math.sin(clock.elapsedTime * 1.4) * 0.35 * k : 0;
    });
    if (spotlight.current) {
      const shown = picked >= 0 ? lifts.current[picked] : 0;
      spotlight.current.intensity = 6 * shown;
      spotlight.current.position.set(ROOM_AT[0] + layout.spot.x, ROOM_AT[1] + layout.spot.y + 1.6, ROOM_AT[2] + layout.spot.z + 1.4);
    }
  });

  return (
    <group visible>
      <group position={ROOM_AT}>
        <Voxels boxes={layout.boxes} shadows={false} />
        {/* Warm light in the room: one over the shelves, one by the door. */}
        <pointLight position={[0, layout.size.h - 0.8, 3]} color="#ffd59a" intensity={9} distance={18} decay={1} />
        <pointLight position={[0, 2, 9]} color="#ffb25c" intensity={4} distance={14} decay={1} />
      </group>
      {/* A light of its own on a picked certificate. */}
      <pointLight ref={spotlight} color="#fff1d0" intensity={0} distance={5} decay={1} />
      {CREDENTIALS.map((c, i) => (
        <group key={c.id} ref={(el) => void (objects.current[i] = el)}>
          <Voxels boxes={layout.models[i]} shadows={false} />
          {here && (
            <mesh
              onPointerOver={(event) => {
                event.stopPropagation();
                if (intro.get() !== "done" || !tent.inside) return;
                hover.text = c.title;
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                hover.text = "";
                document.body.style.cursor = "";
              }}
              onClick={(event) => {
                event.stopPropagation();
                // Letting go after turning the view is not a click.
                if (wasDrag() || intro.get() !== "done" || !tent.inside) return;
                hover.text = "";
                sfx.click();
                trophies.pick(c.id);
              }}
            >
              <boxGeometry args={[0.6, 0.7, 0.5]} />
              {/* Drawn fully see-through: it is there to be pointed at, not seen. */}
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
