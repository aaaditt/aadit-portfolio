"use client";

import { useEffect, useRef } from "react";
import { bubbleAnchor } from "@/world/bubbleAnchor";
import { lineAt } from "@/world/bubbleStore";
import { poke } from "@/world/pokeStore";
import { stage } from "@/world/stageStore";

const HELLO = "Hi, I'm Aadit!";

/**
 * The character's speech bubble: ordinary page text that follows the character around the screen.
 * It shows whatever he has to say at the moment (a line on reaching a place, an answer, a
 * thank-you) and, at home with nothing else to say, his greeting.
 */
export function SpeechBubble() {
  const ref = useRef<HTMLParagraphElement>(null);
  const line = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const follow = () => {
      const el = ref.current;
      if (el) {
        const said = lineAt(performance.now());
        // While a show is staged, the card is the only words on screen.
        const on = bubbleAnchor.visible && (said !== "" || bubbleAnchor.greeting) && stage.level < 0.3;
        el.style.left = `${bubbleAnchor.x}px`;
        el.style.top = `${bubbleAnchor.y}px`;
        el.classList.toggle("bubble-on", on);
        // Something said in answer comes straight away; the greeting waits for him to settle.
        el.classList.toggle("bubble-quick", said !== "");
        // The words stay as they were while the bubble fades out.
        if (on && line.current && line.current.textContent !== (said || HELLO)) line.current.textContent = said || HELLO;
        // Until the visitor has tried it, he suggests clicking him.
        el.classList.toggle("bubble-hint", said === "" && !poke.seen());
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <p ref={ref} className="bubble" aria-hidden="true">
      <span ref={line}>{HELLO}</span>
      <span className="bubble-tip">Click me to say hi</span>
    </p>
  );
}
