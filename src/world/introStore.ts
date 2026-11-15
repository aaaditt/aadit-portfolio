"use client";

import { useSyncExternalStore } from "react";

/**
 * Where the opening camera move has got to.
 * "pending" until the world has loaded and decided whether to play it.
 */
export type IntroState = "pending" | "playing" | "done";

const SEEN_KEY = "intro-seen";

let state: IntroState = "pending";
const listeners = new Set<() => void>();

function set(next: IntroState) {
  if (state === next) return;
  state = next;
  listeners.forEach((listener) => listener());
}

export const intro = {
  get: () => state,
  /** True if the opening has already played in this browser tab. */
  seen() {
    try {
      return sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return false;
    }
  },
  start: () => set("playing"),
  /** Plays the opening again, on request. */
  replay: () => set("playing"),
  /** Ends the opening, whether it ran to the end or was skipped. */
  finish() {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage can be blocked; the opening will simply play again next time.
    }
    set("done");
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIntro(): IntroState {
  return useSyncExternalStore(subscribe, intro.get, () => "pending" as const);
}
