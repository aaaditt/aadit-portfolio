"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import type { Project } from "@/content/projects";
import { sfx } from "@/audio/engine";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { hover } from "../overlayState";
import { sheets, table } from "../sheetStore";
import { b, type Box } from "./box";
import type { Exhibit } from "./exhibitData";
import { PAPER, SHEET, sheetArt, sheetTarget, type SheetKind, type SheetPose } from "./sheets";
import { Voxels } from "./Voxels";

const THICK = 0.04;

/** One sheet as blocks: its paper, a dark edge behind it, and its picture on the front. */
function sheetBoxes(kind: SheetKind, colours: [string, string, string]): Box[] {
  const { w, h } = SHEET;
  return [
    b(-w / 2 - 0.03, -h / 2 - 0.03, -0.02, w + 0.06, h + 0.06, 0.02, "#27374d"),
    b(-w / 2, -h / 2, 0, w, h, THICK, PAPER[kind]),
    ...sheetArt(kind, colours).map((p) => b(-w / 2 + p.x * w, -h / 2 + p.y * h, THICK, p.w * w, p.h * h, 0.015, p.colour)),
  ];
}

/**
 * A design project's working sheets. When its project is opened they rise off the easel one by
 * one and fan out above it; picking one, here or in the card, brings it to the front. They pack
 * away again when the visitor leaves.
 */
export function LightTable({ exhibit, y, project, open }: { exhibit: Exhibit; y: number; project: Project; open: boolean }) {
  const animate = useMotion();
  const list = project.show!.sheets;
  const groups = useRef<(THREE.Group | null)[]>([]);
  /** Where each sheet is drawn, easing towards where it should be. */
  const shown = useRef<SheetPose[]>(list.map((_, i) => ({ ...sheetTarget(i, list.length, { open: false, since: 0, front: -1 }), size: 0 })));
  const openedAt = useRef(-1);
  const out = useRef(0);
  const models = useMemo(() => list.map((s) => sheetBoxes(s.kind, project.colours)), [list, project.colours]);

  // Leaving the project puts the picked sheet back, and never leaves a name tag behind.
  useEffect(() => {
    if (!open) return;
    return () => {
      sheets.clear();
      hover.text = "";
      document.body.style.cursor = "";
      if (table.exhibit === exhibit.id) table.exhibit = "";
    };
  }, [open, exhibit.id]);

  useFrame(({ clock }, delta) => {
    const step = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    if (open && openedAt.current < 0) openedAt.current = t;
    if (!open) openedAt.current = -1;
    if (open) table.exhibit = exhibit.id;
    const front = list.findIndex((s) => s.kind === sheets.front());
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
      // A slow sway once out, each a beat behind the last, so the fan feels held, not pinned.
      const sway = animate && want.shown && front !== i ? Math.sin(t * 1.6 + i * 0.9) * 0.025 : 0;
      group.position.set(exhibit.x + now.x, y + now.y + sway, exhibit.z + now.z);
      group.rotation.z = now.turn + sway * 0.6;
      group.scale.setScalar(Math.max(now.size, 0.001));
    });

    // Each sheet that comes out makes a small sound.
    if (animate && nowOut > out.current && open) sfx.step();
    out.current = nowOut;
  });

  return (
    <>
      {list.map((sheet, i) => (
        <group key={sheet.kind} ref={(el) => void (groups.current[i] = el)} visible={false}>
          <Voxels boxes={models[i]} />
          {open && (
            <mesh
              position={[0, 0, THICK]}
              onPointerOver={(event) => {
                event.stopPropagation();
                if (intro.get() !== "done") return;
                hover.text = sheet.label;
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
                sfx.click();
                sheets.pick(sheet.kind);
              }}
            >
              <boxGeometry args={[SHEET.w, SHEET.h, 0.08]} />
              {/* Drawn fully see-through: it is there to be pointed at, not seen. */}
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
