"use client";

import { useEffect, useRef } from "react";
import { bubbleAnchor } from "@/world/bubbleAnchor";
import { poke } from "@/world/pokeStore";

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
        // Until the visitor has tried it, he suggests clicking him.
        el.classList.toggle("bubble-hint", !poke.seen());
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <p ref={ref} className="bubble" aria-hidden="true">
      Hi, I&apos;m Aadit!
      <span className="bubble-tip">Click me to say hi</span>
    </p>
  );
}
