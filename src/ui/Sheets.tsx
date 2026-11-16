"use client";

import { useSyncExternalStore } from "react";
import type { Sheet } from "@/content/projects";
import { sfx } from "@/audio/engine";
import { sheets } from "@/world/sheetStore";
import styles from "./Sheets.module.css";

/**
 * The stages of a design project, as a row of chips. Picking one brings that sheet up in front of
 * the easel, where it is named; picking a sheet in the world does the same. The note is repeated
 * here for anyone not looking at the world.
 */
export function Sheets({ list, sample = false }: { list: Sheet[]; sample?: boolean }) {
  const front = useSyncExternalStore(sheets.subscribe, sheets.front, () => "");
  const picked = list.find((s) => s.kind === front);

  return (
    <section className={styles.sheets} aria-label="How it was made">
      <h2 className={styles.heading}>
        How it was made
        {sample && <span className={styles.sample}>Sample</span>}
      </h2>
      <div className={styles.chips} role="group" aria-label="Stages" style={{ gridTemplateColumns: `repeat(${list.length}, 1fr)` }}>
        {list.map((sheet, i) => (
          <button
            key={sheet.kind}
            type="button"
            className={styles.chip}
            aria-pressed={sheet.kind === front}
            onClick={() => {
              sfx.click();
              sheets.pick(sheet.kind);
            }}
          >
            <span className={styles.number} aria-hidden="true">
              {i + 1}
            </span>
            {sheet.label}
          </button>
        ))}
      </div>
      <p className={styles.note} aria-live="polite">
        {picked ? picked.note : "Pick a stage to bring its sheet forward."}
      </p>
    </section>
  );
}
