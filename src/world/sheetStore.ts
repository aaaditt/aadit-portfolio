import { createPick } from "./pickStore";

const pick = createPick();

/**
 * Which sheet of the open design project has been picked. The card's chips and the sheets in the
 * world both set it and both follow it, so picking in either place moves the other.
 */
export const sheets = { ...pick, /** The kind of the picked sheet, or an empty string. */ front: pick.get };

/**
 * The exhibit whose show is out at the moment, or an empty string: he presents it instead of
 * working. `flick` is the scene-clock moment something last came out, was picked or was set
 * going: he gestures at each.
 */
export const table = { exhibit: "", flick: -10 };
