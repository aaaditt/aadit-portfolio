/**
 * Which sheet of the open design project has been picked. The card's chips and the sheets in the
 * world both set it and both follow it, so picking in either place moves the other.
 */

let front = "";
const listeners = new Set<() => void>();

function set(next: string) {
  if (front === next) return;
  front = next;
  listeners.forEach((listener) => listener());
}

export const sheets = {
  /** The kind of the picked sheet, or an empty string. */
  front: () => front,
  /** Brings a sheet forward. Picking the one already forward puts it back. */
  pick: (kind: string) => set(front === kind ? "" : kind),
  clear: () => set(""),
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
};

/**
 * The exhibit whose sheets are out at the moment, or an empty string: he points at them.
 * `flick` is the scene-clock moment a sheet last came out or was picked: he gestures at each.
 */
export const table = { exhibit: "", flick: -10 };
