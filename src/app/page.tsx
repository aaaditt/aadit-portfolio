import type { CSSProperties } from "react";
import { PixelLetter } from "@/ui/pixelArt";
import { ReplayIntro } from "@/ui/ReplayIntro";
import styles from "./page.module.css";

const NAME = "AADIT";

export default function Home() {
  return (
    <main className={styles.hero}>
      <p className={`${styles.eyebrow} reveal`}>Portfolio</p>
      <h1 className={styles.name} aria-label="Aadit">
        {[...NAME].map((letter, i) => (
          <span key={i} className="reveal" style={{ "--reveal-delay": `${0.15 + i * 0.09}s` } as CSSProperties} aria-hidden="true">
            <PixelLetter letter={letter} />
          </span>
        ))}
      </h1>
      <div className={`${styles.plate} reveal`} style={{ "--reveal-delay": "0.75s" } as CSSProperties}>
        <p className={styles.line}>Design, code and events.</p>
        <p className={styles.hint}>Pick a place to visit from the bar below, or click one in the world.</p>
        <ReplayIntro />
      </div>
    </main>
  );
}
