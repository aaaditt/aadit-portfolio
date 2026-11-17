"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ABOUT, CREDENTIALS, asks } from "@/content/about";
import type { SectionId } from "@/content/sections";
import { sfx } from "@/audio/engine";
import { say } from "../bubbleStore";
import { daylight } from "../daylight";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { cue, hover, mailbox } from "../overlayState";
import { asked, lanterns } from "../pickStore";
import { walker } from "../walker";
import { b, type Box } from "../voxel/box";
import * as M from "../voxel/models";
import { STANDS, standFacing, type Stand } from "../voxel/routes";
import { plateau } from "../voxel/terrain";
import { Voxels } from "../voxel/Voxels";
import { FLIGHT_SECONDS, MAILBOX, armSwing, lanternGlow, lanternSlot, linePoint, planeDown, planeOut } from "./campRule";
import { pin, unpin } from "./pin";

const cube = new THREE.BoxGeometry(1, 1, 1);
const UNLIT = new THREE.Color("#6b5335");
const LIT = new THREE.Color("#fff0a0");

/** Where he goes to answer each question, and which way he turns there. */
export function askStand(ask: string): Stand {
  const camp = plateau("lookout");
  const at = (x: number, z: number): [number, number] => [camp.x + x, camp.z + z];
  // On the log, turned a little towards the fire.
  if (ask === "who") return { node: "campLog", facing: 0.45, exhibit: null };
  if (ask === "where") return standFacing("campSign", at(...M.SIGNPOST_AT));
  if (ask === "study") return standFacing("campSign", at(0.5, -0.3));
  // Beside the mailbox, not in front of it, so its flag can be seen going up.
  if (ask === "reach") return standFacing("campLog", at(MAILBOX.x, MAILBOX.z));
  if (ask === "cv") return standFacing("campTent", at(-3.5, -0.4));
  // Out at the edge, looking down the valley at everything he has made.
  if (ask === "done") return { node: "lookout", facing: Math.PI, exhibit: null };
  return STANDS.about;
}

/** The string the lanterns hang from, as short straight pieces that follow its sag. */
function string(): Box[] {
  const PIECES = 14;
  return Array.from({ length: PIECES }, (_, i) => {
    const from = linePoint(i / PIECES);
    const to = linePoint((i + 1) / PIECES);
    return b(from.x, (from.y + to.y) / 2 - 0.02, from.z - 0.02, to.x - from.x + 0.01, 0.04, 0.04, M.K.woodD);
  });
}

type Flight = {
  phase: "none" | "out" | "down";
  at: number;
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
  /** The last cue from the page that has been dealt with. */
  seen: number;
  /** How the sending turned out, once known, while the plane is still out. */
  result: "" | "sent" | "failed";
};

/**
 * Everything at the lookout camp that answers a question from the About page:
 * - asked where he is based, the signpost's arms swing out;
 * - asked what he has studied, the lanterns on the line light one by one, one per course;
 * - asked for his CV, the tent's flap opens;
 * - a note sent from the card flies off as a paper plane and lands in the mailbox.
 * It also sends him to the right spot for each answer.
 */
export function Camp({ current }: { current: SectionId }) {
  const animate = useMotion();
  const camp = plateau("lookout");
  const here = current === "about";
  const armA = useRef<THREE.Group>(null);
  const armB = useRef<THREE.Group>(null);
  const flap = useRef<THREE.Group>(null);
  const hung = useRef<(THREE.Group | null)[]>([]);
  const plane = useRef<THREE.Group>(null);
  const lastAsk = useRef("");
  const askedAt = useRef(0);
  const swing = useRef(0);
  const opened = useRef(0);
  const lifts = useRef(CREDENTIALS.map(() => 0));
  const flight = useRef<Flight>({ phase: "none", at: 0, from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 }, seen: 0, result: "" });

  const models = useMemo(() => ({ string: string(), lantern: M.hangingLantern(), plane: M.paperPlane(), flap: M.tentFlap(), teal: M.signArm(M.K.teal), coral: M.signArm(M.K.coral) }), []);
  const flames = useMemo(() => CREDENTIALS.map(() => new THREE.MeshBasicMaterial({ color: UNLIT, toneMapped: false })), []);
  const slots = useMemo(() => CREDENTIALS.map((_, i) => lanternSlot(i, CREDENTIALS.length)), []);
  const based = ABOUT.facts.find((fact) => fact.label === "Based in")?.text ?? "";

  // Leaving the camp takes its caption and name tags with it.
  useEffect(() => {
    if (!here) return;
    return () => {
      unpin("camp");
      hover.text = "";
      document.body.style.cursor = "";
    };
  }, [here]);

  useFrame(({ clock, camera, size }, delta) => {
    const step = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const ease = animate ? 1 - Math.exp(-8 * step) : 1;
    const ask = here ? asked.get() : "";

    // A new question: he goes to where its answer is, and says a word about it.
    if (ask !== lastAsk.current) {
      lastAsk.current = ask;
      askedAt.current = t;
      if (here && walker.section === "about") {
        const stand = askStand(ask);
        if (animate) walker.to("about", stand);
        else walker.stand("about", stand);
      }
      const answer = asks().find((a) => a.id === ask);
      if (answer) say(answer.says, 5);
    }
    const since = t - askedAt.current;

    // The signpost.
    swing.current = ask === "where" ? (animate ? armSwing(since) : 1) : swing.current + (0 - swing.current) * ease;
    if (armA.current) armA.current.rotation.y = (Math.PI / 2) * (1 - swing.current);
    if (armB.current) armB.current.rotation.y = (Math.PI / 2) * (1 + swing.current);

    // The tent.
    opened.current += ((ask === "cv" ? 1 : 0) - opened.current) * ease;
    if (flap.current) flap.current.rotation.y = -opened.current * 1.9;

    // The lantern line.
    const picked = here ? CREDENTIALS.findIndex((c) => c.id === lanterns.get()) : -1;
    CREDENTIALS.forEach((credential, i) => {
      const glow = lanternGlow(i, credential.state, { asked: ask === "study", since, night: daylight.night, still: !animate });
      flames[i].color.copy(UNLIT).lerp(LIT, glow);
      const group = hung.current[i];
      if (!group) return;
      lifts.current[i] += ((picked === i ? 0.5 : 0) - lifts.current[i]) * ease;
      group.position.y = camp.h + slots[i].y + lifts.current[i];
      group.rotation.z = animate ? Math.sin(t * 1.3 + i * 0.8) * 0.06 : 0;
    });

    // The caption: the picked lantern, or else where he is based.
    if (picked >= 0) {
      const c = CREDENTIALS[picked];
      const at = slots[picked];
      pin("camp", c.title, `${c.from} · ${c.when}${c.state === "in progress" ? " · in progress" : ""}`, camp.x + at.x, camp.h + at.y + lifts.current[picked] + 0.1, camp.z + at.z, camera, size);
    } else if (ask === "where" && based) {
      pin("camp", "Based in", based, camp.x + M.SIGNPOST_AT[0] + 0.9, camp.h + 4.7, camp.z + M.SIGNPOST_AT[1], camera, size);
    } else {
      unpin("camp");
    }

    // The paper plane.
    const f = flight.current;
    /** The note has arrived, or come back: the mailbox's flag goes up, or he is told. */
    const settle = (sent: boolean) => {
      f.result = "";
      if (sent) {
        mailbox.flagAt = performance.now();
        if (animate) sfx.chime();
      } else {
        mailbox.backAt = performance.now();
        say("Hmm. That one came back.", 4);
      }
    };
    if (cue.at !== f.seen) {
      f.seen = cue.at;
      /** Thrown from his hand. */
      const launch = () => {
        f.phase = "out";
        f.at = t;
        f.from = { x: walker.x - camp.x, y: walker.y - camp.h + 2.7, z: walker.z - camp.z };
      };
      if (cue.kind === "mail-sending") {
        mailbox.flagAt = 0;
        f.result = "";
        if (animate) launch();
      } else if (cue.kind === "mail-sent" || cue.kind === "mail-failed") {
        // An answer that came back before the throw was even seen still gets its flight.
        if (f.phase === "none" && animate) launch();
        // With a plane in the air, the news waits for it to come down. Without one, it is told at once.
        if (f.phase === "out") f.result = cue.kind === "mail-sent" ? "sent" : "failed";
        else settle(cue.kind === "mail-sent");
      } else if (cue.kind === "") {
        // The visitor has left: the flag goes back down.
        mailbox.flagAt = 0;
        f.result = "";
        f.phase = "none";
      }
    }
    // It stays out long enough to be seen, then comes down where it was last: into the mailbox, or back to him.
    if (f.phase === "out" && f.result && t - f.at >= FLIGHT_SECONDS) {
      const now = planeOut(t - f.at, f.from);
      f.to = f.result === "sent" ? MAILBOX : { x: walker.x - camp.x, y: walker.y - camp.h + 2.4, z: walker.z - camp.z };
      f.from = { x: now.x, y: now.y, z: now.z };
      f.phase = "down";
      f.at = t;
    }
    const model = plane.current;
    if (!model) return;
    if (f.phase === "none") {
      model.visible = false;
      return;
    }
    const now = f.phase === "out" ? { ...planeOut(t - f.at, f.from), landed: false } : planeDown(t - f.at, f.from, f.to);
    model.visible = !now.landed;
    model.position.set(camp.x + now.x, camp.h + now.y, camp.z + now.z);
    model.rotation.set(0, now.heading, f.phase === "out" ? -0.35 : 0);
    if (now.landed) {
      f.phase = "none";
      settle(f.result === "sent");
    }
  });

  const [sx, sz] = M.SIGNPOST_AT;
  const [fx, fy, fz] = M.TENT_FLAP_AT;

  return (
    <>
      <group position={[camp.x, camp.h, camp.z]}>
        <group ref={armA} position={[sx, 2.75, sz]} rotation={[0, Math.PI / 2, 0]}>
          <Voxels boxes={models.teal} />
        </group>
        <group ref={armB} position={[sx, 2.05, sz]} rotation={[0, Math.PI / 2, 0]}>
          <Voxels boxes={models.coral} />
        </group>
        <group ref={flap} position={[fx, fy, fz]}>
          <Voxels boxes={models.flap} />
        </group>
        <Voxels boxes={models.string} shadows={false} />
      </group>
      {CREDENTIALS.map((credential, i) => (
        <group key={credential.id} ref={(el) => void (hung.current[i] = el)} position={[camp.x + slots[i].x, camp.h + slots[i].y, camp.z + slots[i].z]}>
          <Voxels boxes={models.lantern.solid} shadows={false} />
          {models.lantern.flame.map(([x, y, z, w, h, d], k) => (
            <mesh key={k} geometry={cube} material={flames[i]} position={[x + w / 2, y + h / 2, z + d / 2]} scale={[w, h, d]} />
          ))}
          {here && (
            <mesh
              position={[0, -0.45, 0]}
              onPointerOver={(event) => {
                event.stopPropagation();
                if (intro.get() !== "done") return;
                hover.text = credential.id === lanterns.get() ? "" : credential.title;
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
                lanterns.pick(credential.id);
              }}
            >
              <boxGeometry args={[0.8, 1.1, 0.8]} />
              {/* Drawn fully see-through: it is there to be pointed at, not seen. */}
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}
      <group ref={plane} visible={false}>
        <Voxels boxes={models.plane} shadows={false} />
      </group>
    </>
  );
}
