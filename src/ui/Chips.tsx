"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { sfx } from "@/audio/engine";
import type { Pick } from "@/world/pickStore";
import styles from "./Sheets.module.css";

export type ChipItem = { id: string; label: string; note: string };

/**
 * A few numbered chips in a row, one of which can be picked: a design project's stages, a code
 * project's parts. Picking one here picks it in the world, where it is named, and picking it in
 * the world picks it here. The note is repeated in the card for anyone not looking at the world.
 */
export function Chips({
  heading,
  items,
  store,
  hint,
  sample = false,
  children,
}: {
  heading: string;
  items: ChipItem[];
  /** What is picked, shared with the world. */
  store: Pick;
  /** What the note line says while nothing is picked. */
  hint: string;
  sample?: boolean;
  /** Anything else that belongs under the chips. */
  children?: ReactNode;
}) {
  const picked = useSyncExternalStore(store.subscribe, store.get, () => "");
  const chosen = items.find((item) => item.id === picked);

  return (
    <section className={styles.sheets} aria-label={heading}>
      <h2 className={styles.heading}>
        {heading}
        {sample && <span className={styles.sample}>Sample</span>}
      </h2>
      <div className={styles.chips} role="group" aria-label={heading} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={styles.chip}
            aria-pressed={item.id === picked}
            onClick={() => {
              sfx.click();
              store.pick(item.id);
            }}
          >
            <span className={styles.number} aria-hidden="true">
              {i + 1}
            </span>
            {item.label}
          </button>
        ))}
      </div>
      <p className={styles.note} aria-live="polite">
        {chosen ? chosen.note : hint}
      </p>
      {children}
    </section>
  );
}
