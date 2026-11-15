"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { sectionForPath } from "@/content/sections";
import styles from "./World.module.css";

const Inner = dynamic(() => import("./WorldInner"), { ssr: false });

/** The 3D island, fixed behind every page. It stays running as visitors move between sections. */
export function World() {
  const section = sectionForPath(usePathname());
  const router = useRouter();
  return (
    <div className={styles.world}>
      {/* Clicking a landmark in the world opens its section, the same as using the bar. */}
      <Inner section={section} onOpen={(href) => router.push(href)} />
    </div>
  );
}
