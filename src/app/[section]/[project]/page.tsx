import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, liveLinks, neighbours, projectsIn } from "@/content/projects";
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

/** A link out of the card. Links to other sites open in a new tab, so the world keeps running. */
function ProjectLink({ link }: { link: { label: string; href: string } }) {
  const arrow = <span aria-hidden="true">▶</span>;
  return link.href.startsWith("http") ? (
    <a href={link.href} className={styles.button} target="_blank" rel="noreferrer">
      {link.label} {arrow}
    </a>
  ) : (
    <Link href={link.href} className={styles.button}>
      {link.label} {arrow}
    </Link>
  );
}

/** A project, shown like an item card in a game: its facts first, then picture, one line, and its stats. */
async function ProjectCard({ params }: Props) {
  const { section: sectionId, project: projectId } = await params;
  const section = getSection(sectionId);
  const project = getProject(sectionId, projectId);
  if (!section || !project) notFound();

  const { previous, next, position, count } = neighbours(project);
  const [main, ...others] = liveLinks(project);

  return (
    <Card>
      <Link href={section.href} className={styles.back}>
        <span aria-hidden="true">◀</span> {section.title}
      </Link>
      {/* The facts come first, before the picture or anything that moves: a visitor in a hurry reads these and leaves. */}
      <h1 className={styles.itemTitle}>{project.title}</h1>
      <div className={styles.facts}>
        <p className={styles.factLine}>
          {project.role} · {project.year}
        </p>
        <p className={styles.factOutcome}>{project.outcome}</p>
        {main && <ProjectLink link={main} />}
      </div>
      <WorkingAt project={project} />
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
      <p className={styles.blurb}>{project.blurb}</p>
      <dl className={styles.stats}>
        <dt>Team</dt>
        <dd>{project.team}</dd>
        <dt>Tools</dt>
        <dd>{project.tools.join(", ")}</dd>
        <dt>Status</dt>
        <dd>{project.status}</dd>
      </dl>
      {others.length > 0 && (
        <p className={styles.links}>
          {others.map((link) => (
            <ProjectLink key={link.label} link={link} />
          ))}
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
