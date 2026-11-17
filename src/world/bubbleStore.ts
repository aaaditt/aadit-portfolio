/**
 * Something he has to say for a moment: a line on reaching a place, an answer, a thank-you.
 * A plain object, read every frame by the speech bubble. Times are the page's clock, in milliseconds.
 */
export const said = { text: "", until: 0 };

/** Has him say a line for a few seconds. An empty line stops him. */
export function say(text: string, seconds = 4, now = performance.now()) {
  said.text = text;
  said.until = text ? now + seconds * 1000 : 0;
}

/** What he is saying at the moment, or an empty string. */
export const lineAt = (now: number) => (now < said.until ? said.text : "");
