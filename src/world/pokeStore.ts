const KEY = "aadit-said-hi";

let said: boolean | null = null;

/**
 * Whether the visitor has ever clicked the character to say hi. Until they have, his speech
 * bubble suggests it. Remembered in the browser, so it is only suggested until it is tried.
 */
export const poke = {
  seen(): boolean {
    if (said === null) {
      try {
        said = localStorage.getItem(KEY) === "1";
      } catch {
        said = false;
      }
    }
    return said;
  },
  done() {
    said = true;
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Private browsing: remembered for this visit only.
    }
  },
};
