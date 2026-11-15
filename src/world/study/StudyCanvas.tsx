"use client";

import dynamic from "next/dynamic";
import type { Mood } from "../moods";

const Inner = dynamic(() => import("./StudyCanvasInner"), { ssr: false });

/** A 3D study of one mood, filling its parent. The canvas only loads in the browser. */
export function StudyCanvas({ mood, interactive = false }: { mood: Mood; interactive?: boolean }) {
  return (
    <div style={{ width: "100%", height: "100%", background: mood.palette.sky }}>
      <Inner mood={mood} interactive={interactive} />
    </div>
  );
}
