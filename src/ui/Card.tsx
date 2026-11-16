"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "@/app/[section]/page.module.css";

/** How far a drag on the handle must go, in pixels, to open or close the sheet. */
const DRAG = 24;

/**
 * The page's card over the world. On a wide screen it sits down the left side. On a phone it is
 * a sheet along the bottom, kept low so the world shows above it; tapping or dragging its handle
 * pulls it up to read more, and back down again.
 */
export function Card({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const from = useRef<number | null>(null);
  /** Set when a drag has just opened or closed it, so the click that ends the drag is ignored. */
  const dragged = useRef(false);

  return (
    <main className={`${styles.card} reveal`} data-open={open}>
      <button
        type="button"
        className={styles.handle}
        aria-expanded={open}
        aria-label={open ? "Show less" : "Show more"}
        onPointerDown={(event) => {
          from.current = event.clientY;
          dragged.current = false;
        }}
        onPointerUp={(event) => {
          if (from.current === null) return;
          const moved = event.clientY - from.current;
          from.current = null;
          if (Math.abs(moved) < DRAG) return;
          dragged.current = true;
          setOpen(moved < 0);
        }}
        onClick={() => {
          if (dragged.current) dragged.current = false;
          else setOpen((was) => !was);
        }}
      />
      {children}
    </main>
  );
}
