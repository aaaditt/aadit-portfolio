import Link from "next/link";
import { MOODS } from "@/world/moods";
import { StudyCanvas } from "@/world/study/StudyCanvas";
import styles from "./StudiesGrid.module.css";

export function StudiesGrid() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Stage 0 · look studies</p>
        <h1 className={styles.title}>Pick a look</h1>
        <p className={styles.lead}>
          The same tiny scene, drawn three ways. Open one full screen to drag it around. You can pick one, or mix
          parts of several.
        </p>
      </header>

      <ol className={styles.grid}>
        {MOODS.map((mood, i) => (
          <li key={mood.id} className={styles.card}>
            <div className={styles.canvas}>
              <StudyCanvas mood={mood} />
            </div>
            <div className={styles.caption}>
              <h2 className={styles.name}>
                <span className={styles.number}>{i + 1}</span>
                {mood.name}
              </h2>
              <p className={styles.tagline}>{mood.tagline}</p>
              <Link className={styles.link} href={`/studies/${mood.id}`}>
                Open full screen<span aria-hidden="true"> →</span>
                <span className={styles.srOnly}> ({mood.name})</span>
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
