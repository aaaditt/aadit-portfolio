"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { sfx } from "@/audio/engine";
import { asked } from "@/world/pickStore";
import { beamLabels } from "@/world/show/Beams";
import { beams } from "@/world/show/valleyRule";
import styles from "./ValleyTags.module.css";

const BEAMS = beams();

/**
 * The tags on the beams of light that rise over the valley when he is asked what he has done:
 * each says what is there and how much, and is a link to that place. The card offers the same.
 */
export function ValleyTags() {
  const on = useSyncExternalStore(
    asked.subscribe,
    () => asked.get() === "done",
    () => false,
  );
  const tags = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!on) return;
    let frame = 0;
    const follow = () => {
      /** The tags placed so far this frame, so a later one can step out of an earlier one's way. */
      const placed: { left: number; right: number; top: number; bottom: number }[] = [];
      tags.current.forEach((el, i) => {
        if (!el) return;
        const label = beamLabels[i];
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        // Kept on the screen, so a place off to one side can still be picked.
        const half = w / 2 + 12;
        const x = Math.min(Math.max(label.x, half), window.innerWidth - half);
        // The tag hangs above its point: keep its top clear of the buttons along the top of the screen.
        let y = Math.min(Math.max(label.y, h + 72), window.innerHeight - 140);
        // Never touching another tag, so each reads as its own and is easy to tap: step down past it.
        const GAP = 8;
        for (let tries = 0; tries < placed.length + 1; tries++) {
          const box = { left: x - w / 2, right: x + w / 2, top: y - h, bottom: y };
          const hit = placed.find((p) => box.left < p.right + GAP && box.right > p.left - GAP && box.top < p.bottom + GAP && box.bottom > p.top - GAP);
          if (!hit) break;
          y = hit.bottom + GAP + h;
        }
        if (label.on) placed.push({ left: x - w / 2, right: x + w / 2, top: y - h, bottom: y });
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.classList.toggle(styles.on, label.on);
      });
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [on]);

  if (!on) return null;

  return (
    <nav aria-label="What is in the valley">
      {BEAMS.map((beam, i) => (
        <Link key={beam.id} href={beam.href} ref={(el) => void (tags.current[i] = el)} className={styles.tag} onClick={() => sfx.click()}>
          <span className={styles.name}>
            {beam.name} <span aria-hidden="true">▶</span>
          </span>
          <span className={styles.line}>{beam.line}</span>
          {beam.role && <span className={styles.role}>{beam.role}</span>}
        </Link>
      ))}
    </nav>
  );
}
