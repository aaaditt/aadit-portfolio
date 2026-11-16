export const SOUND_KEY = "sound";

/** Sound starts off, and only comes on by itself if the visitor turned it on last time. */
export const initialSound = (stored: string | null) => stored === "on";
