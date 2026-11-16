import { expect, test } from "vitest";
import { BEATS_PER_BAR, LOOP_BARS, TEMPO, bar, hz, type Note } from "./music";

const SCALE = new Set([0, 2, 4, 5, 7, 9, 11]); // C major: every note stays in key

const loop = (mood: "day" | "night") => Array.from({ length: LOOP_BARS }, (_, i) => bar(i, mood));

test("every note is in key and fits inside its bar", () => {
  for (const mood of ["day", "night"] as const) {
    for (const notes of loop(mood)) {
      for (const n of notes) {
        expect(SCALE.has(((n.midi % 12) + 12) % 12), `${mood} ${n.midi}`).toBe(true);
        expect(n.at).toBeGreaterThanOrEqual(0);
        expect(n.at + n.length).toBeLessThanOrEqual(BEATS_PER_BAR + 1e-9);
      }
    }
  }
});

test("the tune is the same every time and loops", () => {
  expect(bar(3, "day")).toEqual(bar(3, "day"));
  expect(bar(3, "day")).toEqual(bar(3 + LOOP_BARS, "day"));
  expect(bar(5, "night")).toEqual(bar(5 + LOOP_BARS * 3, "night"));
});

test("every bar has a bass and a broken chord under the tune, high enough for laptop speakers", () => {
  for (const mood of ["day", "night"] as const) {
    for (const notes of loop(mood)) {
      const bass = notes.filter((n) => n.voice === "bass");
      expect(bass.length).toBeGreaterThan(0);
      // Below about 80 Hz (midi 40) small speakers play almost nothing.
      for (const n of bass) expect(n.midi, mood).toBeGreaterThanOrEqual(40);
      // The chord is played one note at a time, at different moments, so it can be followed.
      const harp = notes.filter((n) => n.voice === "harp");
      expect(harp.length).toBeGreaterThanOrEqual(2);
      expect(new Set(harp.map((n) => n.at)).size).toBe(harp.length);
    }
  }
});

test("night is slower, lower and sparser than day", () => {
  expect(TEMPO.night).toBeLessThan(TEMPO.day);
  const melody = (mood: "day" | "night") => loop(mood).flat().filter((n: Note) => n.voice === "lead" || n.voice === "bell");
  expect(melody("night").length).toBeLessThan(melody("day").length * 0.7);
  const average = (notes: Note[]) => notes.reduce((s, n) => s + n.midi, 0) / notes.length;
  expect(average(loop("night").flat())).toBeLessThan(average(loop("day").flat()));
});

test("it stays peaceful: unhurried tempo and no quick notes", () => {
  expect(TEMPO.day).toBeLessThanOrEqual(76);
  for (const mood of ["day", "night"] as const) {
    for (const n of loop(mood).flat()) expect(n.length, `${mood} ${n.voice}`).toBeGreaterThanOrEqual(1);
  }
});

test("pitches convert to frequencies", () => {
  expect(hz(69)).toBeCloseTo(440);
  expect(hz(60)).toBeCloseTo(261.63, 1);
});
