import { contactHref, contactsReady } from "@/content/about";
import styles from "./Contact.module.css";

/** How to reach him: the direct links. */
export function Contact() {
  const ready = contactsReady();
  return (
    <section className={styles.contact} aria-label="Contact">
      <h2 className={styles.heading}>Say hello</h2>
      {ready.length === 0 ? (
        <p className={styles.quiet}>Contact details are on their way.</p>
      ) : (
        <ul className={styles.links}>
          {ready.map((c) => (
            <li key={c.id}>
              <a href={contactHref(c)} className={styles.link} target={c.id === "email" ? undefined : "_blank"} rel="noreferrer">
                {c.label} <span aria-hidden="true">▶</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
