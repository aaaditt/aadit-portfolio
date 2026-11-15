import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.hero}>
      <p className={styles.eyebrow}>Portfolio</p>
      <h1 className={styles.name}>Aadit</h1>
      <p className={styles.line}>Design, code, games and events.</p>
      <p className={styles.hint}>Pick a place to visit from the bar below.</p>
    </main>
  );
}
