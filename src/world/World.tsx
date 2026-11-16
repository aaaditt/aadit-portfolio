"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { projectForPath } from "@/content/projects";
import { sectionForPath } from "@/content/sections";
import { isListPage } from "@/ui/listPage";
import styles from "./World.module.css";

const Inner = dynamic(() => import("./WorldInner"), { ssr: false });

/** The 3D island, fixed behind every page. It stays running as visitors move between sections. */
export function World() {
  const pathname = usePathname();
  const section = sectionForPath(pathname);
  const project = projectForPath(pathname);
  const router = useRouter();
  // The plain list page has no world: it is never downloaded there.
  if (isListPage(pathname)) return null;
  return (
    <div className={styles.world}>
      {/* Clicking a landmark in the world opens its section, the same as using the bar. */}
      <Inner section={section} project={project?.id ?? null} onOpen={(href) => router.push(href)} />
    </div>
  );
}
