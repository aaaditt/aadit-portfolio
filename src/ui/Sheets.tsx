"use client";

import type { Project } from "@/content/projects";
import { sfx } from "@/audio/engine";
import { fire } from "@/world/overlayState";
import { parts } from "@/world/pickStore";
import { sheets } from "@/world/sheetStore";
import { Chips } from "./Chips";
import styles from "./Sheets.module.css";

/**
 * The stages of a design project. Picking one brings that sheet up in front of the easel. Under
 * them, the project's three colours, which are also the paint in the studio's buckets.
 */
export function Sheets({ project }: { project: Project }) {
  const list = project.show?.sheets ?? [];
  return (
    <Chips
      heading="How it was made"
      items={list.map((sheet) => ({ id: sheet.kind, label: sheet.label, note: sheet.note }))}
      store={sheets}
      hint="Pick a stage to bring its sheet forward."
      sample={project.sample}
    >
      <p className={styles.swatches}>
        <span className={styles.swatchLabel}>Colours</span>
        {project.colours.map((colour) => (
          <span key={colour} className={styles.swatch} style={{ background: colour }} title={colour} />
        ))}
      </p>
    </Chips>
  );
}

/**
 * The working parts of a code project, in the order data flows through them. Picking one lights
 * its block on the machine. Under them, what comes out, and a button to run it again.
 */
export function Parts({ project }: { project: Project }) {
  const list = project.show?.parts ?? [];
  return (
    <Chips heading="How it works" items={list} store={parts} hint="Pick a part to lift it out of the machine." sample={project.sample}>
      <p className={styles.result}>
        <span className={styles.swatchLabel}>Out comes</span>
        {project.show?.result}
      </p>
      <button
        type="button"
        className={styles.run}
        onClick={() => {
          sfx.click();
          // The world answers: he pulls the lever and the machine runs once more.
          fire("run", project.id);
        }}
      >
        Run it again <span aria-hidden="true">▶</span>
      </button>
    </Chips>
  );
}
