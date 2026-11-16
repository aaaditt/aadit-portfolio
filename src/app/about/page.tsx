import type { Metadata } from "next";
import Link from "next/link";
import { ABOUT } from "@/content/about";
import { getSection } from "@/content/sections";
import { Card } from "@/ui/Card";
import { Contact } from "@/ui/Contact";
import styles from "../[section]/page.module.css";

const section = getSection("about")!;

export const metadata: Metadata = { title: section.title, description: ABOUT.intro };

/** Who he is and how to reach him. It has its own page because it is not a list of projects. */
export default function AboutPage() {
  return (
    <Card>
      <Link href="/" className={styles.back}>
        <span aria-hidden="true">◀</span> Home
      </Link>
      <h1 className={styles.title}>{section.title}</h1>
      <p className={styles.blurb}>{ABOUT.intro}</p>
      <dl className={styles.stats}>
        {ABOUT.facts.map((fact) => (
          <div key={fact.label} className={styles.statRow}>
            <dt>{fact.label}</dt>
            <dd>{fact.text}</dd>
          </div>
        ))}
      </dl>
      {ABOUT.sample && <p className={styles.note}>Sample text for now; the real one is on the way.</p>}
      <Contact />
    </Card>
  );
}
