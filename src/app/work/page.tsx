import type { Metadata } from "next";
import { ABOUT, contactHref, contactsReady } from "@/content/about";
import { liveLinks, projectsIn } from "@/content/projects";
import { HOME, SECTIONS } from "@/content/sections";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Everything on one page",
  description: "Aadit's work as a plain list: what he made, his part in it and what came of it.",
};

/**
 * Everything on one plain page, without the world: for someone in a hurry, a slow connection,
 * a screen reader or a search engine. It reads the same content files as the world does.
 */
export default function WorkPage() {
  const contacts = contactsReady();
  const places = SECTIONS.map((section) => ({ section, projects: projectsIn(section.id) })).filter((p) => p.projects.length > 0);

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <h1 className={styles.name}>{HOME.title}</h1>
          <p className={styles.lead}>{ABOUT.intro}</p>
          {contacts.length > 0 && (
            <ul className={styles.contacts}>
              {contacts.map((c) => (
                <li key={c.id}>
                  <a href={contactHref(c)}>{c.id === "email" ? c.value : c.label}</a>
                </li>
              ))}
            </ul>
          )}
        </header>

        {places.map(({ section, projects }) => (
          <section key={section.id} className={styles.place} aria-labelledby={`work-${section.id}`}>
            <h2 id={`work-${section.id}`} className={styles.placeName}>
              {section.title}
            </h2>
            <p className={styles.placeBlurb}>{section.blurb}</p>
            <ul className={styles.items}>
              {projects.map((p) => (
                <li key={p.id} className={styles.item}>
                  <h3 className={styles.itemName}>
                    {p.title}
                    {p.sample && <span className={styles.sample}>Sample</span>}
                  </h3>
                  <p className={styles.meta}>
                    {p.role} · {p.year} · {p.status}
                  </p>
                  <p className={styles.outcome}>{p.outcome}</p>
                  <p className={styles.itemLinks}>
                    {liveLinks(p).map((link) => (
                      <a key={link.label} href={link.href}>
                        {link.label}
                      </a>
                    ))}
                    <a href={`${section.href}/${p.id}`}>See it in the world</a>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
