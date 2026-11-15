"use client";

import { useEffect, useRef } from "react";
import { bubbleAnchor } from "@/world/bubbleAnchor";

/** The character's speech bubble: ordinary page text that follows the character around the screen. */
export function SpeechBubble() {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let frame = 0;
    const follow = () => {
      const el = ref.current;
      if (el) {
        el.style.left = `${bubbleAnchor.x}px`;
        el.style.top = `${bubbleAnchor.y}px`;
        el.classList.toggle("bubble-on", bubbleAnchor.visible);
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <p ref={ref} className="bubble" aria-hidden="true">
      Hi, I&apos;m Aadit!
    </p>
  );
}
