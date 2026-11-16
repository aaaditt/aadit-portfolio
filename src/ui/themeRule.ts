/** Day is the light theme, night the dark one. The world and the page change together. */
export type Theme = "day" | "night";

export const THEME_KEY = "theme";
export const PREFERS_DARK = "(prefers-color-scheme: dark)";

/** The theme to start with: a saved choice if there is one, otherwise whatever the device uses. */
export function initialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === "day" || stored === "night") return stored;
  return prefersDark ? "night" : "day";
}

/**
 * Runs in the page head before anything is drawn, so the page never flashes the wrong theme.
 * It applies the same rule as initialTheme above; keep the two in step.
 */
export const THEME_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t!=="day"&&t!=="night"){t=window.matchMedia("${PREFERS_DARK}").matches?"night":"day"}document.documentElement.dataset.theme=t})()`;
