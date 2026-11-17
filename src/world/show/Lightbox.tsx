"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Project, Sheet } from "@/content/projects";
import { sfx } from "@/audio/engine";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { hover } from "../overlayState";
import { sheets, table } from "../sheetStore";
import { stage } from "../stageStore";
import type { Exhibit } from "../voxel/exhibitData";
import { GLYPHS } from "../voxel/lettering";
import { PAPER, sheetArt, type SheetLayout } from "../voxel/sheets";
import { HERO, IDLE_SECONDS, PEEK_AGAIN, PEEK_MAX, PEEK_SLIDE, RISE_SECONDS, SHEET_AT, autoScrub, cellAt, peekAt, planeAt, riseAt, snapTo, squashAt as squashOf, waveOrder } from "./lightboxRule";
import { lightbox } from "./lightboxStore";

/** Each stage's picture is drawn this many pixels across, then shown blocky. */
const ART_W = 128;
const ART_H = Math.round((ART_W * HERO.h) / HERO.w);
/** A tab along the top of each plane carries its name. */
const TAB_H = 14;
/** Each pixel of the lettering is this many canvas pixels, so the names stay readable on the small cards. */
const DOT = 2;
const TAB_UNITS = (TAB_H / ART_H) * HERO.h;
const INK = "#27374d";
const CREAM = "#fff4dc";
/** On a wide screen the card runs down the left, so the row of stages moves right, clear of it. */
const FAN_SHIFT = 1.1;
/** On a phone the card is below, so the row can be wider than the sheet, and easier to read. */
const PHONE_FAN = 1.15;

/** Draws a word in the three-by-five pixel font, top left at (x, y), one canvas pixel per font pixel. */
function letters(g: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, dot = DOT) {
  g.fillStyle = colour;
  [...text.toUpperCase()].forEach((ch, n) => {
    GLYPHS[ch]?.forEach((row, r) => [...row].forEach((c, k) => c === "#" && g.fillRect(x + (n * 4 + k) * dot, y + r * dot, dot, dot)));
  });
}
const wordWidth = (text: string) => (text.length * 4 - 1) * DOT;

/** A stage's picture, from the project's colours, onto the art area of its canvas. */
function drawArt(g: CanvasRenderingContext2D, sheet: Sheet, colours: [string, string, string], layout?: SheetLayout) {
  g.fillStyle = PAPER[sheet.kind];
  g.fillRect(0, TAB_H, ART_W, ART_H);
  for (const p of sheetArt(sheet.kind, colours, layout)) {
    g.fillStyle = p.colour;
    g.fillRect(Math.round(p.x * ART_W), TAB_H + Math.round((1 - p.y - p.h) * ART_H), Math.max(1, Math.round(p.w * ART_W)), Math.max(1, Math.round(p.h * ART_H)));
  }
}

/**
 * The tab, and how long the stage took if known, in the corner. The tab reads `text`: the stage's
 * name when the stages are spread out; with empty `text` there is no tab, as when they lie stacked,
 * since the card's chip already names the stage on top. Every tab of a project is as wide as its
 * longest name, so the row of them reads evenly.
 */
function drawLabels(g: CanvasRenderingContext2D, sheet: Sheet, tabWidth: number, text: string) {
  g.clearRect(0, 0, ART_W, TAB_H);
  if (text) {
    g.fillStyle = INK;
    g.fillRect(0, 0, tabWidth, TAB_H);
  }
  letters(g, text, 4, 2, CREAM);
  if (sheet.weeks) {
    const text = `${sheet.weeks} ${sheet.weeks === 1 ? "week" : "weeks"}`;
    const w = wordWidth(text) + 8;
    g.fillStyle = INK;
    g.fillRect(ART_W - w - 3, TAB_H + ART_H - 17, w, 14);
    letters(g, text, ART_W - w + 1, TAB_H + ART_H - 15, CREAM);
  }
}

/** A soft round glow, drawn once, shared by every sheet's backlight. */
let glowTexture: THREE.Texture | null = null;
function glow() {
  if (glowTexture) return glowTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  r.addColorStop(0, "rgba(255,244,220,1)");
  r.addColorStop(0.5, "rgba(255,236,200,0.35)");
  r.addColorStop(1, "rgba(255,236,200,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  glowTexture = new THREE.CanvasTexture(c);
  return glowTexture;
}

/** The grip: a paper tab with an arrow each way, to say "drag me sideways". */
let gripTexture: THREE.Texture | null = null;
function gripFace() {
  if (gripTexture) return gripTexture;
  const c = document.createElement("canvas");
  c.width = 12;
  c.height = 24;
  const g = c.getContext("2d")!;
  g.fillStyle = CREAM;
  g.fillRect(0, 0, 12, 24);
  g.fillStyle = INK;
  g.fillRect(0, 0, 12, 1);
  g.fillRect(0, 23, 12, 1);
  g.fillRect(0, 0, 1, 24);
  g.fillRect(11, 0, 1, 24);
  // Two arrowheads, pointing left and right, either side of a bar.
  for (let k = 0; k < 3; k++) {
    g.fillRect(2 + k, 11 - k, 1, 2 * k + 2);
    g.fillRect(9 - k, 11 - k, 1, 2 * k + 2);
  }
  g.fillRect(4, 11, 4, 2);
  gripTexture = new THREE.CanvasTexture(c);
  gripTexture.magFilter = THREE.NearestFilter;
  gripTexture.colorSpace = THREE.SRGBColorSpace;
  return gripTexture;
}

/** A number from 0 to 1 that is always the same for the same seed. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const cube = new THREE.BoxGeometry(1, 1, 1);
const plane = new THREE.PlaneGeometry(HERO.w, HERO.h + TAB_UNITS).translate(0, TAB_UNITS / 2, 0);
const dummy = new THREE.Object3D();
const colour = new THREE.Color();

/**
 * A design project's show, the Lightbox. When the project opens and the stage comes up, the meadow
 * in front of the easel rises in a wave of voxels that become one huge sheet behind him, lit from
 * behind. Dragging it sideways spreads its stages out like cards and settles on the nearest; the
 * card's chips follow. It hints at this on its own: a peel of the top sheet, then, left alone, one
 * scrub out and back. It packs away when the project closes.
 */
export function Lightbox({ exhibit, y, project, open }: { exhibit: Exhibit; y: number; project: Project; open: boolean }) {
  const animate = useMotion();
  const list = project.show!.sheets!;
  const n = list.length;
  const at = useMemo(() => new THREE.Vector3(exhibit.x + SHEET_AT.x, y + SHEET_AT.y, exhibit.z + SHEET_AT.z), [exhibit.x, exhibit.z, y]);

  const root = useRef<THREE.Group>(null);
  const voxels = useRef<THREE.InstancedMesh>(null);
  const planes = useRef<(THREE.Group | null)[]>([]);
  const peels = useRef<(THREE.Group | null)[]>([]);
  const halos = useRef<(THREE.Mesh | null)[]>([]);
  const grips = useRef<(THREE.Mesh | null)[]>([]);

  /** The show's own clock: when it began (scene seconds), and whether the sheet is whole yet. */
  const began = useRef(-1);
  const whole = useRef(false);
  /** Where the scrub is (a stage, or between two), and how far apart the planes are. */
  const s = useRef(n - 1);
  const spread = useRef(0);
  /** A drag in progress: where it started, and how far it has gone. */
  const drag = useRef({ x0: 0, s0: 0, moved: 0 });
  const touched = useRef(false);
  const quietSince = useRef(0);
  const scrubbedAlone = useRef(false);
  const squashAt = useRef(-10);
  /** Set on letting go; the next frame starts the squash. */
  const released = useRef(false);
  const shrink = useRef(0);

  /**
   * Each stage's two faces, one with its name on the tab (spread out) and one with its place (on
   * top), and the material that shows one or the other. Real pictures replace the drawn art once loaded.
   */
  const tabWidth = Math.min(ART_W, Math.max(...list.map((sheet) => wordWidth(sheet.label))) + 8);
  const faces = useMemo(
    () =>
      list.map((sheet) => {
        const side = (text: string) => {
          const canvas = document.createElement("canvas");
          canvas.width = ART_W;
          canvas.height = ART_H + TAB_H;
          const g = canvas.getContext("2d")!;
          drawArt(g, sheet, project.colours, project.show!.layout);
          drawLabels(g, sheet, tabWidth, text);
          const texture = new THREE.CanvasTexture(canvas);
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.LinearFilter;
          texture.colorSpace = THREE.SRGBColorSpace;
          return { g, texture, text };
        };
        const named = side(sheet.label);
        // On top, no tab at all: the card's chip already names the stage, and none peeks out from the pad.
        const placed = side("");
        const material = new THREE.MeshBasicMaterial({ map: placed.texture, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false });
        return { sheet, named, placed, material };
      }),
    [list, project.colours, project.show, tabWidth],
  );
  const voxelMaterial = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const order = useMemo(() => waveOrder(HERO.cols, HERO.rows), []);
  const count = HERO.cols * HERO.rows;

  /** The voxels take their colours from the picture they become, so the swap to the sheet is seamless. */
  const paintVoxels = (front: number) => {
    const mesh = voxels.current;
    if (!mesh) return;
    const data = faces[front].placed.g.getImageData(0, TAB_H, ART_W, ART_H).data;
    for (let i = 0; i < count; i++) {
      const col = i % HERO.cols;
      const row = Math.floor(i / HERO.cols);
      const px = Math.floor(((col + 0.5) / HERO.cols) * ART_W);
      const py = Math.floor((1 - (row + 0.5) / HERO.rows) * ART_H);
      const k = (py * ART_W + px) * 4;
      colour.setRGB(data[k] / 255, data[k + 1] / 255, data[k + 2] / 255, THREE.SRGBColorSpace);
      mesh.setColorAt(i, colour);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  // Real pictures, where a stage has one: drawn blocky into its canvas, under its labels.
  useEffect(() => {
    let live = true;
    faces.forEach((face, i) => {
      if (!face.sheet.image) return;
      const img = new Image();
      img.onload = () => {
        if (!live) return;
        for (const side of [face.named, face.placed]) {
          side.g.imageSmoothingEnabled = true;
          side.g.drawImage(img, 0, TAB_H, ART_W, ART_H);
          drawLabels(side.g, face.sheet, tabWidth, side.text);
          side.texture.needsUpdate = true;
        }
        if (i === n - 1) paintVoxels(i);
      };
      img.src = face.sheet.image;
    });
    paintVoxels(n - 1);
    return () => {
      live = false;
    };
    // paintVoxels reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faces, n, tabWidth]);

  useEffect(
    () => () => {
      faces.forEach((f) => {
        f.named.texture.dispose();
        f.placed.texture.dispose();
        f.material.dispose();
      });
    },
    [faces],
  );

  // While open: any touch anywhere counts as the visitor having taken over, and dragging the held
  // sheet scrubs it. Leaving puts everything back.
  useEffect(() => {
    if (!open) return;
    const perStage = () => window.innerWidth * (window.innerWidth <= 560 ? 0.24 : 0.14);
    const onDown = () => void (touched.current = true);
    let crossed = -1;
    const onMove = (event: PointerEvent) => {
      if (lightbox.held !== event.pointerId || lightbox.owner !== exhibit.id) return;
      const dx = event.clientX - drag.current.x0;
      drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
      // The stages stand in a row, left to right: the one picked out follows the finger.
      s.current = Math.min(n - 1 + 0.35, Math.max(-0.35, drag.current.s0 + dx / perStage()));
      const k = snapTo(s.current, n);
      if (sheets.get() !== list[k].kind) sheets.pick(list[k].kind);
      // A soft tick for each stage passed, so the drag is felt as well as seen.
      if (k !== crossed && crossed >= 0) sfx.step();
      crossed = k;
    };
    const onUp = (event: PointerEvent) => {
      if (lightbox.held !== event.pointerId || lightbox.owner !== exhibit.id) return;
      lightbox.held = -1;
      crossed = -1;
      document.body.style.cursor = "";
      // A tap, not a drag, moves on to the next stage.
      const k = drag.current.moved < 6 ? (snapTo(s.current, n) + 1) % n : snapTo(s.current, n);
      if (sheets.get() !== list[k].kind) sheets.pick(list[k].kind);
      released.current = true;
      sfx.click();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      // A finger still down stays claimed until it lifts (see lightboxStore), but no longer scrubs.
      if (lightbox.owner === exhibit.id) lightbox.owner = "";
      lightbox.spread = 0;
      sheets.clear();
      hover.text = "";
      document.body.style.cursor = "";
      if (table.exhibit === exhibit.id) table.exhibit = "";
    };
  }, [open, n, list, exhibit.id]);

  useFrame(({ clock, size }, delta) => {
    const group = root.current;
    if (!group) return;
    const t = clock.elapsedTime;
    const step = Math.min(delta, 0.05);
    const still = !animate;

    // The show begins once the stage is 70% up and the camera nearly at rest, so the whole build
    // is seen, in (almost) its final framing.
    if (open && began.current < 0 && stage.level >= 0.7) {
      began.current = t;
      whole.current = false;
      scrubbedAlone.current = false;
      touched.current = false;
      shrink.current = 1;
    }
    if (!open) {
      began.current = -1;
      shrink.current = still ? 0 : Math.max(0, shrink.current - step / 0.3);
    }
    group.visible = (open && began.current >= 0) || shrink.current > 0.01;
    if (!group.visible) return;
    if (open) table.exhibit = exhibit.id;
    const since = began.current >= 0 ? t - began.current : 99;

    // The rise: voxels from the grass to their places on the sheet.
    const rising = open && !whole.current;
    const mesh = voxels.current;
    if (mesh) {
      mesh.visible = rising;
      if (rising) {
        let all = true;
        order.forEach((cell, rank) => {
          const { p, grow, done } = riseAt(rank, since, still);
          if (!done) all = false;
          const c = cellAt(cell, HERO.cols, HERO.rows);
          // Each block lifts off the grass round the easel and arcs up to its place, landing a
          // touch large before it settles.
          const fromX = exhibit.x + (hash(cell) - 0.5) * 4.5;
          const fromZ = exhibit.z + 0.9 + hash(cell + 50) * 1.6;
          const arc = Math.sin(Math.PI * p) * (2 + hash(cell + 20) * 1.5);
          dummy.position.set(fromX + (at.x + c.x - fromX) * p, y + 0.3 + (at.y + c.y - y - 0.3) * p + arc, fromZ + (at.z - fromZ) * p);
          const land = Math.max(1, grow);
          const w = (0.6 + (HERO.w / HERO.cols - 0.6) * p) * land;
          const h = (0.6 + (HERO.h / HERO.rows - 0.6) * p) * land;
          dummy.scale.set(w * 0.985, h * 0.985, 0.6 - 0.48 * p);
          // Flat to the camera in flight, tilted only a little, so they read as the sheet's own pieces.
          dummy.rotation.set((1 - p) * 0.35, (1 - p) * (hash(cell + 9) - 0.5) * 0.6, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(cell, dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (all) {
          whole.current = true;
          quietSince.current = t;
          table.flick = t;
          // The card picks out the stage that is on top, so the chips match the sheet from the start.
          if (!sheets.get()) sheets.pick(list[n - 1].kind);
        }
      }
    }

    // The scrub: held, it follows the finger; let go, it settles on the picked stage (the final
    // piece if none is), with one scrub out and back of its own if left alone.
    const picked = list.findIndex((sheet) => sheet.kind === sheets.get());
    const rest = picked >= 0 ? picked : n - 1;
    if (touched.current) {
      touched.current = false;
      quietSince.current = t;
      scrubbedAlone.current = true;
    }
    const ease = still ? 1 : 1 - Math.exp(-10 * step);
    let want = 1;
    if (lightbox.held < 0) {
      const auto = whole.current && !scrubbedAlone.current && !still ? autoScrub(t - quietSince.current) : { offset: 0, spread: 0 };
      if (whole.current && t - quietSince.current > IDLE_SECONDS + 2) scrubbedAlone.current = true;
      const away = rest === 0 ? -auto.offset : auto.offset;
      s.current += (rest + away - s.current) * ease;
      want = Math.max(auto.spread, Math.min(1, Math.abs(s.current - rest - away) * 1.5));
    }
    spread.current += (want - spread.current) * (still ? 1 : 1 - Math.exp(-12 * step));
    if (open) lightbox.spread = spread.current;
    if (released.current) {
      released.current = false;
      squashAt.current = t;
      table.flick = t;
    }

    const front = snapTo(s.current, n);
    const settled = whole.current ? since - RISE_SECONDS : -1;
    // The peel hint, and once more if nobody has touched it yet.
    const peel = still || settled < 0 ? 0 : peekAt(settled) + (scrubbedAlone.current ? 0 : peekAt(settled - PEEK_AGAIN));
    const squash = squashOf(t - squashAt.current, still);
    const named = spread.current > 0.3;
    const out = open ? 1 : shrink.current;

    faces.forEach((face, i) => {
      const g = planes.current[i];
      if (!g) return;
      g.visible = whole.current || !open;
      const pose = planeAt(i, n, s.current, spread.current, size.width >= 900 ? { shift: FAN_SHIFT } : size.width <= 560 ? { scale: PHONE_FAN } : {});
      const sx = pose.size * out * (i === front ? squash.x : 1);
      const sy = pose.size * out * (i === front ? squash.y : 1);
      // Spread out, each tab names its stage; stacked, there are no tabs.
      const map = named ? face.named.texture : face.placed.texture;
      if (face.material.map !== map) face.material.map = map;
      const slide = i === front ? (peel / PEEK_MAX) * PEEK_SLIDE : 0;
      g.position.set(at.x + pose.x + slide, at.y + pose.y - (1 - out) * HERO.h * 0.5, at.z + pose.z);
      g.rotation.y = pose.turn;
      g.scale.set(Math.max(sx, 0.001), Math.max(sy, 0.001), 1);
      // The peel hint: the top sheet lifts its right edge towards us, like paper off a pad, and
      // springs back. (Turning it away would push it through the sheets behind.)
      const p = peels.current[i];
      if (p) p.rotation.y = i === front ? -peel : 0;
      // The sheets further from the scrub are less brightly lit.
      const d = Math.min(1, Math.abs(i - s.current));
      face.material.color.setScalar(1 - 0.4 * d);
      const grip = grips.current[i];
      if (grip) grip.visible = whole.current && open && i === front && spread.current < 0.15;
      const h = halos.current[i];
      if (h) {
        h.visible = d < 0.5;
        (h.material as THREE.MeshBasicMaterial).opacity = 0.55 * stage.key * out;
      }
    });

  });

  const startDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!open || !whole.current || intro.get() !== "done") return;
    event.stopPropagation();
    lightbox.held = event.pointerId;
    lightbox.owner = exhibit.id;
    drag.current = { x0: event.nativeEvent.clientX, s0: s.current, moved: 0 };
    document.body.style.cursor = "grabbing";
  };

  return (
    <group ref={root} visible={false}>
      <instancedMesh ref={voxels} args={[cube, voxelMaterial, count]} frustumCulled={false} />
      {faces.map((face, i) => (
        <group key={face.sheet.kind} ref={(el) => void (planes.current[i] = el)} visible={false}>
          {/* The glow behind the sheet that lights it from behind. */}
          <mesh ref={(el) => void (halos.current[i] = el)} position={[0, 0, -0.3]} scale={[HERO.w * 1.5, HERO.h * 1.6, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={glow()} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0} />
          </mesh>
          {/* Hinged at its left edge, so the peel lifts the right. */}
          <group ref={(el) => void (peels.current[i] = el)} position={[-HERO.w / 2, 0, 0]}>
            <mesh position={[HERO.w / 2, 0, 0]} geometry={plane} material={face.material} />
            {/* The grip, just inside the right edge, so it moves with the peel. */}
            <mesh ref={(el) => void (grips.current[i] = el)} position={[HERO.w - 0.75, 0, 0.12]} scale={[0.75, 1.5, 0.12]} geometry={cube} visible={false}>
              <meshBasicMaterial map={gripFace()} toneMapped={false} />
            </mesh>
          </group>
        </group>
      ))}
      {/* What is taken hold of: the whole sheet and its tab, a little larger, for fingers. */}
      {open && (
        <mesh
          position={[at.x + 0.2, at.y, at.z + 0.2]}
          onPointerDown={startDrag}
          onPointerOver={(event) => {
            event.stopPropagation();
            if (intro.get() !== "done") return;
            hover.text = "";
            if (lightbox.held < 0) document.body.style.cursor = "grab";
          }}
          onPointerOut={() => {
            if (lightbox.held < 0) document.body.style.cursor = "";
          }}
        >
          <boxGeometry args={[HERO.w * 1.08, HERO.h * 1.08, 0.2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
