import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projectsIn } from "@/content/projects";
import { getSection } from "@/content/sections";
import { ProjectThumb } from "@/ui/ProjectThumb";
import styles from "../page.module.css";

type Props = { params: Promise<{ section: string; project: string }> };

/**
 * One page per project, for each section the parent route generates. A section with no projects
 * (About) still has to name one page, so it names a placeholder, which shows "not found".
 */
export function generateStaticParams({ params: { section } }: { params: { section: string } }) {
  const pages = projectsIn(section).map((p) => ({ project: p.id }));
  return pages.length > 0 ? pages : [{ project: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, project } = await params;
  const found = getProject(section, project);
  return { title: found?.title ?? "Not found", description: found?.blurb };
}

export default function ProjectPage({ params }: Props) {
  // The project comes from the URL, so it is read inside Suspense to keep navigation instant.
  return (
    <Suspense fallback={null}>
      <ProjectCard params={params} />
    </Suspense>
  );
}

/** A project, shown like an item card in a game: picture, name, one line, and its stats. */
async function ProjectCard({ params }: Props) {
  const { section: sectionId, project: projectId } = await params;
  const section = getSection(sectionId);
  const project = getProject(sectionId, projectId);
  if (!section || !project) notFound();

  return (
    <main className={`${styles.card} reveal`}>
      <Link href={section.href} className={styles.back}>
        <span aria-hidden="true">◀</span> {section.title}
      </Link>
      <ProjectThumb project={project} className={styles.picture} />
      {project.sample && <p className={styles.badge}>Sample · real project coming soon</p>}
      <h1 className={styles.itemTitle}>{project.title}</h1>
      <p className={styles.blurb}>{project.blurb}</p>
      <dl className={styles.stats}>
        <dt>Role</dt>
        <dd>{project.role}</dd>
        <dt>Tools</dt>
        <dd>{project.tools.join(", ")}</dd>
        <dt>Year</dt>
        <dd>{project.year}</dd>
      </dl>
      {project.links.length > 0 && (
        <p className={styles.links}>
          {project.links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.button}>
              {link.label} <span aria-hidden="true">▶</span>
            </Link>
          ))}
        </p>
      )}
    </main>
  );
}
