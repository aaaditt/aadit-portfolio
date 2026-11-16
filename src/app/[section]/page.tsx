import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projectsIn } from "@/content/projects";
import { SECTIONS, getSection } from "@/content/sections";
import { ProjectThumb } from "@/ui/ProjectThumb";
import styles from "./page.module.css";

type Props = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return SECTIONS.filter((s) => s.id !== "home").map((s) => ({ section: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = getSection((await params).section);
  return { title: section?.title ?? "Not found" };
}

export default function SectionPage({ params }: Props) {
  // The section comes from the URL, so it is read inside Suspense to keep navigation instant.
  return (
    <Suspense fallback={null}>
      <SectionCard params={params} />
    </Suspense>
  );
}

async function SectionCard({ params }: Props) {
  const section = getSection((await params).section);
  if (!section || section.id === "home") notFound();
  const projects = projectsIn(section.id);

  return (
    <main className={`${styles.card} reveal`}>
      <p className={styles.eyebrow}>{section.label}</p>
      <h1 className={styles.title}>{section.title}</h1>
      <p className={styles.blurb}>{section.blurb}</p>
      {projects.length > 0 ? (
        // The projects as inventory slots, like a game's item bag. Each is also an exhibit in the world.
        <ul className={styles.inventory} aria-label="Projects">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`${section.href}/${p.id}`} className={styles.slot}>
                <ProjectThumb project={p} className={styles.slotPicture} />
                <span className={styles.slotName}>{p.title.replace(/^Sample /, "")}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.soon}>A short bio and contact links are coming soon.</p>
      )}
      {projects.some((p) => p.sample) && <p className={styles.note}>These are samples; real projects are on the way.</p>}
    </main>
  );
}
