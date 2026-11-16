"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, type Theme } from "./themeRule";

export type { Theme };

const listeners = new Set<() => void>();

/** The theme on the page now. The head script (THEME_SCRIPT) sets it before first paint. */
function read(): Theme {
  return document.documentElement.dataset.theme === "night" ? "night" : "day";
}

export const theme = {
  get: read,
  set(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts until the page is closed.
    }
    listeners.forEach((listener) => listener());
  },
  toggle() {
    theme.set(read() === "night" ? "day" : "night");
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "day" as const);
}
