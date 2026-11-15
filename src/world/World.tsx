"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { sectionForPath } from "@/content/sections";
import styles from "./World.module.css";

const Inner = dynamic(() => import("./WorldInner"), { ssr: false });

/** The 3D island, fixed behind every page. It stays running as visitors move between sections. */
export function World() {
  const section = sectionForPath(usePathname());
  return (
    <div className={styles.world}>
      <Inner section={section} />
    </div>
  );
}
