"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isListPage } from "./listPage";
import styles from "./ListLink.module.css";

/**
 * The way to the plain list of everything, in the corner of every page, and the way back from it.
 * A visitor in a hurry is never more than one press from the facts.
 */
export function ListLink() {
  const plain = isListPage(usePathname());
  return plain ? (
    <Link href="/" className={styles.link}>
      <span aria-hidden="true">◀</span> Back to the world
    </Link>
  ) : (
    <Link href="/work" className={`${styles.link} reveal`}>
      List view
    </Link>
  );
}
