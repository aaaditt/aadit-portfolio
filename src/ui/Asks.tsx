"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { sfx } from "@/audio/engine";
import { CV, asks } from "@/content/about";
import { SECTIONS } from "@/content/sections";
import { say } from "@/world/bubbleStore";
import { asked, banners, lanterns, type Pick } from "@/world/pickStore";
import styles from "./Asks.module.css";

/** Answers that are further down the card: the part of the page each one is in. */
const BELOW: Record<string, string> = { study: "study", reach: "contact" };

const PLACES = SECTIONS.filter((s) => s.id === "design" || s.id === "code" || s.id === "events");

/**
 * Questions to put to him at the camp. Picking one sends him to whatever answers it (the log by
 * the fire, the signpost, the lanterns, the mailbox) and shows the answer in full here.
 */
export function Asks() {
  const list = asks();
  const ask = useSyncExternalStore(asked.subscribe, asked.get, () => "");
  const chosen = list.find((a) => a.id === ask);

  // Leaving the page takes the question with it, so the camp settles down again.
  useEffect(
    () => () => {
      asked.clear();
      lanterns.clear();
      say("");
    },
    [],
  );

  // Bring the answer into view when it is in a part of the card further down.
  useEffect(() => {
    const target = BELOW[ask];
    if (!target) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(target)?.scrollIntoView({ block: "nearest", behavior: smooth ? "smooth" : "auto" });
  }, [ask]);

  return (
    <section className={styles.asks} aria-label="Ask me">
      <h2 className={styles.heading}>Ask me</h2>
      <div className={styles.chips} role="group" aria-label="Questions">
        {list.map((a) => (
          <button
            key={a.id}
            type="button"
            className={styles.chip}
            aria-pressed={a.id === ask}
            onClick={() => {
              sfx.click();
              asked.pick(a.id);
            }}
          >
            {a.chip}
          </button>
        ))}
      </div>
      <div className={styles.answer} aria-live="polite">
        {chosen?.answer && <p>{chosen.answer}</p>}
        {ask === "done" && (
          <p className={styles.places}>
            {PLACES.map((place) => (
              <Link key={place.id} href={place.href} className={styles.place}>
                {place.title} <span aria-hidden="true">▶</span>
              </Link>
            ))}
          </p>
        )}
        {ask === "study" && <p>One lantern on the line for each. They are listed just below; pick one to lift it.</p>}
        {ask === "reach" && <p>The quickest ways are just below.</p>}
        {ask === "cv" && CV && (
          <p className={styles.places}>
            <a href={CV} className={styles.place} download>
              Download my CV <span aria-hidden="true">▶</span>
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

export type Row = { id: string; title: string; detail: string; tag?: string };

/**
 * A short list of things that each stand somewhere in the world: lanterns on the line, banners on
 * their poles. Picking a row picks its thing in the world, and the other way round.
 */
function PickList({ id, heading, rows, store, note }: { id?: string; heading: string; rows: Row[]; store: Pick; note?: string }) {
  const picked = useSyncExternalStore(store.subscribe, store.get, () => "");
  return (
    <section id={id} className={styles.list} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <ul className={styles.rows}>
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className={styles.row}
              aria-pressed={row.id === picked}
              onClick={() => {
                sfx.click();
                store.pick(row.id);
              }}
            >
              <span className={styles.rowTitle}>
                {row.title}
                {row.tag && <span className={styles.tag}>{row.tag}</span>}
              </span>
              <span className={styles.rowDetail}>{row.detail}</span>
            </button>
          </li>
        ))}
      </ul>
      {note && <p className={styles.listNote}>{note}</p>}
    </section>
  );
}

/** What he has studied: one row, and one lantern at the camp, for each course or certificate. */
export function Credentials({ list }: { list: { id: string; title: string; from: string; when: string; state: string; sample?: boolean }[] }) {
  return (
    <PickList
      id="study"
      heading="Study"
      store={lanterns}
      rows={list.map((c) => ({ id: c.id, title: c.title, detail: `${c.from} · ${c.when}`, tag: c.sample ? "Sample" : c.state === "in progress" ? "In progress" : undefined }))}
      note={list.some((c) => c.sample) ? "Each is a lantern on the line at the camp. Samples for now; the real ones are on the way." : "Each is a lantern on the line at the camp."}
    />
  );
}

/** The clubs he is part of: one row, and one banner by the stage, for each. */
export function Clubs({ list }: { list: { id: string; name: string; role: string; when: string; sample?: boolean }[] }) {
  // Leaving the page lowers whichever banner was up.
  useEffect(() => () => banners.clear(), []);
  return (
    <PickList
      heading="Clubs and roles"
      store={banners}
      rows={list.map((c) => ({ id: c.id, title: c.name, detail: `${c.role} · ${c.when}`, tag: c.sample ? "Sample" : undefined }))}
      note="Each has a banner by the stage. Pick one to run it up."
    />
  );
}
