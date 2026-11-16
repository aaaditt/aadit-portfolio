import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { projectsIn } from "@/content/projects";
import { SECTIONS, getSection } from "@/content/sections";
import Link from "next/link";
import { Card } from "@/ui/Card";
import { Inventory } from "@/ui/Inventory";
import styles from "./page.module.css";

type Props = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  // Home and About have pages of their own.
  return SECTIONS.filter((s) => s.id !== "home" && s.id !== "about").map((s) => ({ section: s.id }));
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
  const projects = section ? projectsIn(section.id) : [];
  if (!section || projects.length === 0) notFound();

  return (
    <Card>
      <Link href="/" className={styles.back}>
        <span aria-hidden="true">◀</span> Home
      </Link>
      <h1 className={styles.title}>{section.title}</h1>
      <p className={styles.blurb}>{section.blurb}</p>
      <Inventory projects={projects} base={section.href} />
      {projects.some((p) => p.sample) && <p className={styles.note}>Pick one, or click its exhibit in the world. Samples for now; real projects are on the way.</p>}
    </Card>
  );
}
