"use client";

import { useSyncExternalStore } from "react";
import { engine, sfx } from "./engine";
import { SOUND_KEY, initialSound } from "./soundRule";

let on = false;
let ready = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function save(value: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, value ? "on" : "off");
  } catch {
    // Storage can be blocked; the choice then lasts until the page is closed.
  }
}

/**
 * On first use, read the visitor's last choice. If they had sound on, it comes back on with
 * their first click or key press, as browsers will not play audio before that.
 */
function prepare() {
  if (ready || typeof window === "undefined") return;
  ready = true;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(SOUND_KEY);
  } catch {
    stored = null;
  }
  on = initialSound(stored);
  if (on) {
    const wake = () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      if (on) engine.start();
    };
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
  }
  document.addEventListener("visibilitychange", () => engine.pause(document.hidden));
}

export const soundSetting = {
  get() {
    prepare();
    return on;
  },
  set(next: boolean) {
    prepare();
    on = next;
    save(next);
    if (next) {
      engine.start();
      // A little chime to say it worked.
      window.setTimeout(() => sfx.chime(), 120);
    } else engine.stop();
    notify();
  },
  toggle() {
    soundSetting.set(!soundSetting.get());
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSound(): boolean {
  return useSyncExternalStore(subscribe, soundSetting.get, () => false);
}
