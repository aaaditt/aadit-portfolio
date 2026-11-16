"use client";

import { useEffect, useRef } from "react";
import { caption } from "@/world/overlayState";
import styles from "./SheetCaption.module.css";

/**
 * The name and note of the picked sheet, drawn on the page just above the sheet in the world, so
 * the eye does not have to leave it to read about it. The card says the same for screen readers.
 */
export function SheetCaption() {
  const box = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
  const text = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let frame = 0;
    const follow = () => {
      const el = box.current;
      if (el) {
        el.classList.toggle(styles.on, caption.on);
        if (caption.on) {
          // Keep it on the screen, whatever the sheet is doing.
          const half = el.offsetWidth / 2 + 8;
          const x = Math.min(Math.max(caption.x, half), window.innerWidth - half);
          const y = Math.max(caption.y, el.offsetHeight + 8);
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
          if (title.current && title.current.textContent !== caption.title) title.current.textContent = caption.title;
          if (text.current && text.current.textContent !== caption.text) text.current.textContent = caption.text;
        }
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={box} className={styles.caption} aria-hidden="true">
      <p ref={title} className={styles.title} />
      <p ref={text} className={styles.text} />
    </div>
  );
}
