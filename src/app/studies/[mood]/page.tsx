import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOODS, getMood } from "@/world/moods";
import { StudyCanvas } from "@/world/study/StudyCanvas";
import styles from "./page.module.css";

type Props = { params: Promise<{ mood: string }> };

export function generateStaticParams() {
  return MOODS.map((mood) => ({ mood: mood.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mood = getMood((await params).mood);
  return { title: mood ? `${mood.name} · look study` : "Look study" };
}

export default async function StudyPage({ params }: Props) {
  const mood = getMood((await params).mood);
  if (!mood) notFound();

  return (
    <main className={styles.stage}>
      <StudyCanvas mood={mood} interactive />
      <div className={styles.overlay} style={{ color: mood.palette.text }}>
        <Link className={styles.back} href="/">
          <span aria-hidden="true">← </span>All looks
        </Link>
        <div>
          <h1 className={styles.name}>{mood.name}</h1>
          <p className={styles.hint}>Drag to look around · scroll to zoom</p>
        </div>
      </div>
    </main>
  );
}
