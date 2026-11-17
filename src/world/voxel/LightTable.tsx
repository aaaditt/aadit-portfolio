"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Project } from "@/content/projects";
import { sfx } from "@/audio/engine";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { hover } from "../overlayState";
import { pin, unpin } from "../show/pin";
import { sheets, table } from "../sheetStore";
import { b } from "./box";
import type { Exhibit } from "./exhibitData";
import { PAPER, SHEET, patchShare, sheetArt, sheetTarget, stagePips, type Patch, type SheetPose } from "./sheets";
import { Voxels } from "./Voxels";

const THICK = 0.04;
const cube = new THREE.BoxGeometry(1, 1, 1);

/** One matte material per colour, shared by every sheet. */
const inks = new Map<string, THREE.Material>();
const ink = (c: string) => inks.get(c) ?? inks.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 1 })).get(c)!;

/** The threads of light from the easel up to each sheet. */
const thread = new THREE.MeshBasicMaterial({ color: "#fff1c4", transparent: true, opacity: 0.75, toneMapped: false });

/** Where the threads start: the top edge of the canvas. */
const ROOT = { y: 2.32, z: 0.3 };

const from = new THREE.Vector3();
const to = new THREE.Vector3();

/**
 * A design project's working sheets. When its project is opened they rise off the easel one by
 * one and fan out above it, each on a thread of light. Picking one, here or in the card, brings
 * it up large in front, where it draws itself again and is named. They pack away on leaving.
 */
export function LightTable({ exhibit, y, project, open }: { exhibit: Exhibit; y: number; project: Project; open: boolean }) {
  const animate = useMotion();
  const list = project.show!.sheets!;
  const layout = project.show!.layout;
  const groups = useRef<(THREE.Group | null)[]>([]);
  const threads = useRef<(THREE.Mesh | null)[]>([]);
  const patches = useRef<(THREE.Mesh | null)[][]>(list.map(() => []));
  /** Where each sheet is drawn, easing towards where it should be. */
  const shown = useRef<SheetPose[]>(list.map((_, i) => ({ ...sheetTarget(i, list.length, { open: false, since: 0, front: -1 }), size: 0 })));
  const openedAt = useRef(-1);
  const out = useRef(0);
  /** Which sheet was in front last frame, and when it got there. */
  const lastFront = useRef(-1);
  const frontAt = useRef(0);

  /** Each sheet's paper as blocks, and its picture as separate patches so they can be drawn in. */
  const models = useMemo(() => {
    const { w, h } = SHEET;
    return list.map((sheet, i) => ({
      paper: [b(-w / 2 - 0.03, -h / 2 - 0.03, -0.02, w + 0.06, h + 0.06, 0.02, "#27374d"), b(-w / 2, -h / 2, 0, w, h, THICK, PAPER[sheet.kind])],
      art: [...sheetArt(sheet.kind, project.colours, layout), ...stagePips(i)] as Patch[],
    }));
  }, [list, layout, project.colours]);

  // Leaving the project puts everything back, and never leaves a caption or name tag behind.
  useEffect(() => {
    if (!open) return;
    return () => {
      sheets.clear();
      unpin(exhibit.id);
      hover.text = "";
      document.body.style.cursor = "";
      if (table.exhibit === exhibit.id) table.exhibit = "";
    };
  }, [open, exhibit.id]);

  useFrame(({ clock, camera, size }, delta) => {
    const step = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    if (open && openedAt.current < 0) openedAt.current = t;
    if (!open) openedAt.current = -1;
    if (open) table.exhibit = exhibit.id;
    const front = open ? list.findIndex((s) => s.kind === sheets.front()) : -1;
    if (front !== lastFront.current) {
      lastFront.current = front;
      frontAt.current = t;
      if (front >= 0) table.flick = t;
    }
    const ease = animate ? 1 - Math.exp(-9 * step) : 1;
    let nowOut = 0;

    list.forEach((_, i) => {
      const group = groups.current[i];
      if (!group) return;
      const want = sheetTarget(i, list.length, { open, since: open ? t - openedAt.current : 0, front, still: !animate });
      const now = shown.current[i];
      if (want.shown) nowOut++;
      // A sheet coming out starts from the canvas; one going back shrinks into it.
      now.x += (want.x - now.x) * ease;
      now.y += (want.y - now.y) * ease;
      now.z += (want.z - now.z) * ease;
      now.turn += (want.turn - now.turn) * ease;
      now.size += ((want.shown ? want.size : 0) - now.size) * ease;
      group.visible = now.size > 0.04;
      // In the fan each sheet sways on its thread, a beat behind the last. The picked one is held still.
      const sway = animate && want.shown && front !== i ? Math.sin(t * 1.5 + i * 0.9) : 0;
      const turn = now.turn + sway * 0.045;
      group.position.set(exhibit.x + now.x + sway * 0.05, y + now.y + Math.abs(sway) * 0.03, exhibit.z + now.z);
      group.rotation.z = turn;
      group.scale.setScalar(Math.max(now.size, 0.001));

      // The picked sheet draws its picture again, patch by patch.
      const drawing = animate && front === i ? t - frontAt.current : 99;
      const art = models[i].art;
      art.forEach((p, k) => {
        const mesh = patches.current[i][k];
        if (!mesh) return;
        const share = patchShare(k, art.length, drawing);
        mesh.visible = share > 0.01;
        const w = p.w * SHEET.w * share;
        mesh.position.x = -SHEET.w / 2 + p.x * SHEET.w + w / 2;
        mesh.scale.x = Math.max(w, 0.001);
      });

      // A thread of light from the top of the canvas to the foot of the sheet.
      const line = threads.current[i];
      if (line) {
        const half = (SHEET.h / 2) * now.size;
        from.set(exhibit.x, y + ROOT.y, exhibit.z + ROOT.z);
        to.set(group.position.x + Math.sin(turn) * half, group.position.y - Math.cos(turn) * half, group.position.z);
        const length = from.distanceTo(to);
        line.visible = group.visible && now.size > 0.5 && length > 0.2;
        line.position.copy(from).add(to).multiplyScalar(0.5);
        line.lookAt(to);
        line.scale.set(0.025, 0.025, length);
      }
    });

    // The picked sheet is named on the page, just above it.
    if (open) {
      const group = front >= 0 ? groups.current[front] : null;
      if (group) {
        const top = group.position.y + (SHEET.h / 2) * shown.current[front].size + 0.12;
        pin(exhibit.id, `${front + 1} of ${list.length} · ${list[front].label}`, list[front].note, group.position.x, top, group.position.z, camera, size);
      } else {
        unpin(exhibit.id);
      }
    }

    // Each sheet that comes out makes a small sound, and he flicks his hand at it.
    if (open && nowOut > out.current) {
      table.flick = t;
      if (animate) sfx.step();
    }
    out.current = nowOut;
  });

  const { w, h } = SHEET;

  return (
    <>
      {list.map((sheet, i) => (
        <group key={sheet.kind}>
          <mesh ref={(el) => void (threads.current[i] = el)} geometry={cube} material={thread} visible={false} />
          <group ref={(el) => void (groups.current[i] = el)} visible={false}>
            <Voxels boxes={models[i].paper} />
            {models[i].art.map((p, k) => (
              <mesh
                key={k}
                ref={(el) => void (patches.current[i][k] = el)}
                geometry={cube}
                material={ink(p.colour)}
                position={[-w / 2 + (p.x + p.w / 2) * w, -h / 2 + (p.y + p.h / 2) * h, THICK + 0.008]}
                scale={[p.w * w, p.h * h, 0.016]}
              />
            ))}
            {open && (
              <mesh
                position={[0, 0, THICK]}
                onPointerOver={(event) => {
                  event.stopPropagation();
                  if (intro.get() !== "done") return;
                  hover.text = sheet.kind === sheets.front() ? "" : sheet.label;
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  hover.text = "";
                  document.body.style.cursor = "";
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  // Letting go after turning the view is not a click.
                  if (wasDrag() || intro.get() !== "done") return;
                  hover.text = "";
                  sfx.click();
                  sheets.pick(sheet.kind);
                }}
              >
                {/* A little larger than the paper, so it is easy to hit with a finger. */}
                <boxGeometry args={[w * 1.15, h * 1.15, 0.1]} />
                {/* Drawn fully see-through: it is there to be pointed at, not seen. */}
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </>
  );
}
