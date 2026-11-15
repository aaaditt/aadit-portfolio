import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SECTIONS, getSection } from "@/content/sections";
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

  return (
    <main className={`${styles.card} reveal`}>
      <p className={styles.eyebrow}>{section.label}</p>
      <h1 className={styles.title}>{section.title}</h1>
      <p className={styles.blurb}>{section.blurb}</p>
      <p className={styles.soon}>
        {section.id === "about" ? "A short bio and contact links are coming soon." : "Projects are being added here soon."}
      </p>
    </main>
  );
}
