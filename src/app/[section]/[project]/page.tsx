import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, neighbours, projectsIn } from "@/content/projects";
import { getSection } from "@/content/sections";
import { Card } from "@/ui/Card";
import { ProjectThumb } from "@/ui/ProjectThumb";
import { WorkingAt } from "@/ui/WorkingAt";
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

  const { previous, next, position, count } = neighbours(project);

  return (
    <Card>
      <Link href={section.href} className={styles.back}>
        <span aria-hidden="true">◀</span> {section.title}
      </Link>
      <div className={styles.pictureFrame}>
        {project.cover ? (
          // A real screenshot, once there is one.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover} alt="" className={styles.cover} />
        ) : (
          <ProjectThumb project={project} className={styles.picture} />
        )}
        {project.sample && <p className={styles.badge}>Sample</p>}
      </div>
      <h1 className={styles.itemTitle}>{project.title}</h1>
      <WorkingAt project={project} />
      <p className={styles.blurb}>{project.blurb}</p>
      <p className={styles.outcome}>
        <span className={styles.outcomeLabel}>Outcome</span> {project.outcome}
      </p>
      <dl className={styles.stats}>
        <dt>Role</dt>
        <dd>{project.role}</dd>
        <dt>Team</dt>
        <dd>{project.team}</dd>
        <dt>Tools</dt>
        <dd>{project.tools.join(", ")}</dd>
        <dt>Status</dt>
        <dd>
          {project.status}, {project.year}
        </dd>
      </dl>
      {project.links.length > 0 && (
        <p className={styles.links}>
          {project.links.map((link) =>
            link.soon ? (
              <span key={link.label} className={`${styles.button} ${styles.soonButton}`} aria-disabled="true">
                {link.label} <span className={styles.soonTag}>Soon</span>
              </span>
            ) : (
              <Link key={link.label} href={link.href} className={styles.button}>
                {link.label} <span aria-hidden="true">▶</span>
              </Link>
            ),
          )}
        </p>
      )}
      <nav className={styles.pager} aria-label="More projects">
        <Link href={`${section.href}/${previous.id}`} className={styles.pageLink}>
          <span aria-hidden="true">◀</span> Prev
        </Link>
        <span className={styles.position}>
          {position} / {count}
        </span>
        <Link href={`${section.href}/${next.id}`} className={styles.pageLink}>
          Next <span aria-hidden="true">▶</span>
        </Link>
      </nav>
    </Card>
  );
}
