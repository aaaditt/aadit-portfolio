"use client";

import { useSyncExternalStore } from "react";
import type { Sheet } from "@/content/projects";
import { sfx } from "@/audio/engine";
import { sheets } from "@/world/sheetStore";
import styles from "./Sheets.module.css";

/**
 * The stages of a design project, as a row of chips. Picking one brings that sheet to the front
 * above the easel, and says a line about it here. Picking a sheet in the world does the same.
 */
export function Sheets({ list }: { list: Sheet[] }) {
  const front = useSyncExternalStore(sheets.subscribe, sheets.front, () => "");
  const picked = list.find((s) => s.kind === front);

  return (
    <section className={styles.sheets} aria-label="How it was made">
      <h2 className={styles.heading}>How it was made</h2>
      <div className={styles.chips} role="group" aria-label="Stages">
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
        {picked ? picked.note : "Pick a stage, or click a sheet above the easel."}
      </p>
    </section>
  );
}
