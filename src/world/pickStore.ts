/**
 * One thing picked out of a few: a sheet, a machine part, a question. The card's chips and the
 * things in the world both set it and both follow it, so picking in either place moves the other.
 */
export function createPick() {
  let picked = "";
  const listeners = new Set<() => void>();
  const set = (next: string) => {
    if (picked === next) return;
    picked = next;
    listeners.forEach((listener) => listener());
  };
  return {
    /** What is picked, or an empty string. */
    get: () => picked,
    /** Picks something. Picking what is already picked puts it back. */
    pick: (id: string) => set(picked === id ? "" : id),
    clear: () => set(""),
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export type Pick = ReturnType<typeof createPick>;

/** The part of the open code project's machine that has been picked. */
export const parts = createPick();
/** The question put to him at the camp. */
export const asked = createPick();
/** The lantern (a course or certificate) picked at the camp. */
export const lanterns = createPick();
/** The club banner picked at the Grounds. */
export const banners = createPick();
