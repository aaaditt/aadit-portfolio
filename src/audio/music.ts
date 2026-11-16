import { hash } from "../world/voxel/box";

/** One note: when it starts and how long it lasts (in beats from the start of its bar), its pitch and its voice. */
export type Note = { at: number; length: number; midi: number; voice: "lead" | "bell" | "bass" | "pad" };
export type Mood = "day" | "night";

export const BEATS_PER_BAR = 4;
/** The tune repeats after this many bars. */
export const LOOP_BARS = 8;
/** Beats per minute: unhurried by day, slower still at night. */
export const TEMPO: Record<Mood, number> = { day: 72, night: 58 };

/** A note's frequency in hertz. */
export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Chords as their three notes, all in C major.
const C = [60, 64, 67];
const Am = [57, 60, 64];
const F = [53, 57, 60];
const G = [55, 59, 62];
const Em = [52, 55, 59];

const PROGRESSION: Record<Mood, number[][]> = {
  day: [C, Am, F, G, C, Em, F, G],
  night: [Am, F, C, G, Am, Em, F, G],
};

/** The notes a tune may use: the friendly five-note scale, C D E G A. */
const PENTATONIC = [0, 2, 4, 7, 9];

/** A pentatonic note near `around` that, on a strong beat, also belongs to the chord. */
function pick(seed: number, chord: number[], around: number, strong: boolean) {
  const choices: number[] = [];
  for (let midi = around - 7; midi <= around + 7; midi++) {
    const pc = ((midi % 12) + 12) % 12;
    if (!PENTATONIC.includes(pc)) continue;
    if (strong && !chord.some((c) => c % 12 === pc)) continue;
    choices.push(midi);
  }
  return choices[Math.floor(hash(seed, 3, 81) * choices.length)] ?? around;
}

/** The notes of one bar of the tune. The same bar number always gives the same notes. */
export function bar(index: number, mood: Mood): Note[] {
  const n = ((index % LOOP_BARS) + LOOP_BARS) % LOOP_BARS;
  const chord = PROGRESSION[mood][n];
  const root = chord[0];
  const notes: Note[] = [];

  if (mood === "day") {
    // A long, low bass note under each half of the bar, and a soft chord held throughout.
    notes.push({ at: 0, length: 2, midi: root - 24, voice: "bass" }, { at: 2, length: 2, midi: chord[2] - 24, voice: "bass" });
    for (const midi of chord) notes.push({ at: 0, length: 4, midi, voice: "pad" });
    // A gentle, singing tune: a few long notes a bar, starting on a chord note.
    let last = 72;
    for (let beat = 0; beat < 4; ) {
      const strong = beat === 0 || beat === 2;
      if (!strong && hash(n, beat, 82) < 0.5) {
        beat++;
        continue;
      }
      const midi = pick(n * 31 + beat, chord, last, strong);
      const length = beat < 3 && hash(n, beat, 83) < 0.55 ? 2 : 1;
      notes.push({ at: beat, length, midi, voice: "lead" });
      last = midi;
      beat += length;
    }
  } else {
    // Slow and low: one long bass note, a quiet low chord, and a few bell notes.
    notes.push({ at: 0, length: 3.5, midi: root - 24, voice: "bass" });
    for (const midi of chord) notes.push({ at: 0, length: 4, midi: midi - 12, voice: "pad" });
    let last = 67;
    for (let beat = 0; beat < 4; beat++) {
      if (hash(n, beat, 84) > 0.4) continue;
      const midi = pick(n * 17 + beat + 500, chord, last, beat === 0);
      notes.push({ at: beat, length: 1, midi, voice: "bell" });
      last = midi;
    }
  }
  return notes;
}
