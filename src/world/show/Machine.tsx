"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Project } from "@/content/projects";
import { sfx } from "@/audio/engine";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { cue, hover } from "../overlayState";
import { parts } from "../pickStore";
import { table } from "../sheetStore";
import type { Exhibit } from "../voxel/exhibitData";
import { K } from "../voxel/models";
import { PART, builtAfter, partSlot, partTarget, runAt, type PartPose } from "./machineRule";
import { pin, unpin } from "./pin";

const cube = new THREE.BoxGeometry(1, 1, 1);
const BODY = new THREE.MeshStandardMaterial({ color: K.navyD, roughness: 1 });
const TRIM = new THREE.MeshStandardMaterial({ color: K.stoneL, roughness: 1 });
const PIPE = new THREE.MeshStandardMaterial({ color: K.stoneD, roughness: 1 });
const LIGHT = new THREE.MeshBasicMaterial({ color: "#fff1c4", toneMapped: false });
const THREAD = new THREE.MeshBasicMaterial({ color: "#bfe9ff", transparent: true, opacity: 0.7, toneMapped: false });

/** A panel's colour at full brightness, and the same colour switched off. One of each per colour. */
const lit = new Map<string, THREE.Material>();
const unlit = new Map<string, THREE.Material>();
const on = (c: string) => lit.get(c) ?? lit.set(c, new THREE.MeshBasicMaterial({ color: c, toneMapped: false })).get(c)!;
const off = (c: string) => unlit.get(c) ?? unlit.set(c, new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(0.4), roughness: 1 })).get(c)!;

/** The colour the last block turns when the run comes out right. */
const RESULT = K.crop;

/** Where the thread of light starts: the top of the terminal's screen. */
const ROOT = { y: 2.25, z: 0 };
/** Where the lever stands on the terminal's plinth. */
const LEVER = { x: 0.55, y: 0.82, z: 0.32 };

const from = new THREE.Vector3();
const to = new THREE.Vector3();

/**
 * A code project's machine. When its project is opened, one block for each of its working parts
 * comes out of the terminal and lines up above it. He pulls the lever and a packet of light runs
 * through them, left to right; the last block lights up with what comes out. Picking a part, here
 * or in the card, lifts its block and names it. It all packs away on leaving.
 */
export function Machine({ exhibit, y, project, open }: { exhibit: Exhibit; y: number; project: Project; open: boolean }) {
  const animate = useMotion();
  const list = project.show!.parts!;
  const result = project.show!.result ?? "";
  const n = list.length;
  const groups = useRef<(THREE.Group | null)[]>([]);
  const panels = useRef<(THREE.Mesh | null)[]>([]);
  const pipe = useRef<THREE.Mesh>(null);
  const flow = useRef<THREE.Mesh>(null);
  const packet = useRef<THREE.Mesh>(null);
  const thread = useRef<THREE.Mesh>(null);
  const lever = useRef<THREE.Group>(null);
  /** Where each block is drawn, easing towards where it should be. */
  const shown = useRef<PartPose[]>(list.map((_, i) => ({ ...partTarget(i, n, { open: false, since: 0, picked: -1 }), size: 0 })));
  const openedAt = useRef(-1);
  const out = useRef(0);
  /** When the lever was last pulled, by the scene clock; -1 before the first run. */
  const ranAt = useRef(-1);
  /** The last "run it" from the page that has been answered. */
  const heard = useRef(0);
  const wasDone = useRef(false);

  // Leaving the project puts everything back, and never leaves a caption or name tag behind.
  useEffect(() => {
    if (!open) return;
    const who = exhibit.id;
    return () => {
      parts.clear();
      unpin(who);
      hover.text = "";
      document.body.style.cursor = "";
      if (table.exhibit === who) table.exhibit = "";
    };
  }, [open, exhibit.id]);

  useFrame(({ clock, camera, size }, delta) => {
    const step = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    if (open && openedAt.current < 0) {
      openedAt.current = t;
      ranAt.current = -1;
      heard.current = cue.kind === "run" ? cue.at : 0;
    }
    if (!open) openedAt.current = -1;
    if (open) table.exhibit = exhibit.id;
    const since = open ? t - openedAt.current : 0;
    const picked = open ? list.findIndex((p) => p.id === parts.get()) : -1;
    const built = open && (!animate || since >= builtAfter(n));

    // The lever is pulled once the machine is built, and again whenever the page asks.
    const asked = open && cue.kind === "run" && cue.id === project.id && cue.at !== heard.current;
    if (built && (ranAt.current < 0 || asked)) {
      if (asked) heard.current = cue.at;
      ranAt.current = t;
      table.flick = t;
      if (animate) sfx.click();
    }
    const run = runAt(n, !open || ranAt.current < 0 ? -1 : animate ? t - ranAt.current : 99);
    if (run.done && !wasDone.current && animate) sfx.chime();
    wasDone.current = run.done;

    const ease = animate ? 1 - Math.exp(-9 * step) : 1;
    let nowOut = 0;
    list.forEach((_, i) => {
      const group = groups.current[i];
      if (!group) return;
      const want = partTarget(i, n, { open, since, picked, still: !animate });
      const now = shown.current[i];
      if (want.shown) nowOut++;
      now.x += (want.x - now.x) * ease;
      now.y += (want.y - now.y) * ease;
      now.z += (want.z - now.z) * ease;
      now.size += ((want.shown ? want.size : 0) - now.size) * ease;
      group.visible = now.size > 0.04;
      // Each block hums a little once it is in the row.
      const hum = animate && want.shown ? Math.sin(t * 2.2 + i * 1.1) * 0.03 : 0;
      group.position.set(exhibit.x + now.x, y + now.y + hum, exhibit.z + now.z);
      group.scale.setScalar(Math.max(now.size, 0.001));
      // Its panel lights as the packet reaches it; the last one shows the result.
      const panel = panels.current[i];
      if (panel) {
        const colour = project.colours[i % 3];
        const reached = i < run.lit || picked === i;
        panel.material = run.done && i === n - 1 ? on(RESULT) : reached ? on(colour) : off(colour);
      }
    });

    // The pipe the packet runs along, the lit stretch behind the packet, and the packet itself.
    const allOut = open && shown.current.every((p) => p.size > 0.8);
    const left = exhibit.x + partSlot(0, n).x - PART.gap * 0.6;
    const right = exhibit.x + partSlot(n - 1, n).x;
    const lineY = y + PART.y;
    const lineZ = exhibit.z + PART.z;
    if (pipe.current) {
      pipe.current.visible = allOut;
      pipe.current.position.set((left + right) / 2, lineY, lineZ);
      pipe.current.scale.set(right - left, 0.12, 0.12);
    }
    const head = Math.max(left, Math.min(right, exhibit.x + run.x));
    if (flow.current) {
      flow.current.visible = allOut && (run.on || run.done);
      flow.current.position.set((left + head) / 2, lineY, lineZ + PART.size / 2 + 0.05);
      flow.current.scale.set(Math.max(head - left, 0.001), 0.07, 0.04);
    }
    if (packet.current) {
      packet.current.visible = allOut && run.on;
      packet.current.position.set(head, lineY, lineZ + PART.size / 2 + 0.1);
      packet.current.rotation.z = t * 6;
    }

    // A thread of light from the terminal up to the middle of the row.
    if (thread.current) {
      from.set(exhibit.x, y + ROOT.y, exhibit.z + ROOT.z);
      to.set(exhibit.x, lineY - PART.size / 2, lineZ);
      const length = from.distanceTo(to);
      thread.current.visible = allOut;
      thread.current.position.copy(from).add(to).multiplyScalar(0.5);
      thread.current.lookAt(to);
      thread.current.scale.set(0.025, 0.025, length);
    }

    // The lever: thrown forward for a moment at the start of each run.
    if (lever.current) {
      const pulled = animate && ranAt.current >= 0 ? Math.max(0, 1 - (t - ranAt.current) / 0.5) : 0;
      lever.current.rotation.x = -0.6 + Math.sin(pulled * Math.PI) * 1.3;
    }

    // Name the picked part, or else say what came out.
    if (open) {
      const named = picked >= 0 ? picked : run.done ? n - 1 : -1;
      const now = named >= 0 ? shown.current[named] : null;
      if (now && picked >= 0) pin(exhibit.id, `${picked + 1} of ${n} · ${list[picked].label}`, list[picked].note, exhibit.x + now.x, y + now.y + (PART.size / 2) * now.size + 0.15, exhibit.z + now.z, camera, size);
      else if (now && result) pin(exhibit.id, "Out comes", result, exhibit.x + now.x, y + now.y + (PART.size / 2) * now.size + 0.15, exhibit.z + now.z, camera, size);
      else unpin(exhibit.id);
    }

    // Each block that comes out makes a small sound.
    if (open && nowOut > out.current && animate) sfx.step();
    out.current = nowOut;
  });

  const s = PART.size;

  return (
    <>
      <mesh ref={pipe} geometry={cube} material={PIPE} visible={false} />
      <mesh ref={flow} geometry={cube} material={LIGHT} visible={false} />
      <mesh ref={packet} geometry={cube} material={LIGHT} scale={0.26} visible={false} />
      <mesh ref={thread} geometry={cube} material={THREAD} visible={false} />
      <group position={[exhibit.x + LEVER.x, y + LEVER.y, exhibit.z + LEVER.z]}>
        <mesh geometry={cube} material={TRIM} position={[0, 0.05, 0]} scale={[0.26, 0.1, 0.26]} />
        <group ref={lever} rotation={[-0.6, 0, 0]}>
          <mesh geometry={cube} material={BODY} position={[0, 0.3, 0]} scale={[0.07, 0.5, 0.07]} />
          <mesh geometry={cube} material={on(K.red)} position={[0, 0.58, 0]} scale={0.16} />
        </group>
      </group>
      {list.map((part, i) => (
        <group key={part.id} ref={(el) => void (groups.current[i] = el)} visible={false}>
          <mesh geometry={cube} material={BODY} scale={s} castShadow />
          <mesh geometry={cube} material={TRIM} position={[0, s / 2 + 0.05, 0]} scale={[s * 0.6, 0.1, s * 0.6]} />
          <mesh geometry={cube} material={TRIM} position={[-s / 2 - 0.04, 0, 0]} scale={[0.1, 0.3, 0.3]} />
          <mesh geometry={cube} material={TRIM} position={[s / 2 + 0.04, 0, 0]} scale={[0.1, 0.3, 0.3]} />
          <mesh ref={(el) => void (panels.current[i] = el)} geometry={cube} material={off(project.colours[i % 3])} position={[0, 0, s / 2 + 0.02]} scale={[s * 0.68, s * 0.56, 0.05]} />
          {open && (
            <mesh
              onPointerOver={(event) => {
                event.stopPropagation();
                if (intro.get() !== "done") return;
                hover.text = part.id === parts.get() ? "" : part.label;
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
                parts.pick(part.id);
              }}
            >
              {/* A little larger than the block, so it is easy to hit with a finger. */}
              <boxGeometry args={[s * 1.25, s * 1.25, s * 1.25]} />
              {/* Drawn fully see-through: it is there to be pointed at, not seen. */}
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
