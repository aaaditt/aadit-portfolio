import { expect, test } from "vitest";
import { GAME, LOOP, SCREEN, code, finishedBetween, game, loopAt, painting } from "./workLoop";
import { faceFor } from "./expression";

test("a painting goes on stroke by stroke, stays while he admires it, then clears for the next", () => {
  expect(painting(0.1, 7)).toHaveLength(0);
  const early = painting(0.6, 7);
  expect(early).toHaveLength(1);
  expect(early[0].share).toBeGreaterThan(0);
  expect(early[0].share).toBeLessThan(1);
  const done = painting(LOOP.easel.doneAt + 0.1, 7);
  expect(done).toHaveLength(4);
  for (const s of done) expect(s.share).toBe(1);
  // Every stroke stays on the canvas.
  for (let t = 0; t < 50; t += 0.37) {
    for (const s of painting(t, 3)) {
      expect(s.x).toBeGreaterThanOrEqual(-0.85);
      expect(s.x + s.w).toBeLessThanOrEqual(0.85 + 1e-9);
      expect(s.y + s.h).toBeLessThanOrEqual(2.2 + 1e-9);
    }
  }
  // Each time round, a different picture.
  const next = painting(LOOP.easel.seconds + LOOP.easel.doneAt + 0.1, 7);
  expect(next.map((s) => s.x)).not.toEqual(done.map((s) => s.x));
  // Just before the loop starts again, it is nearly gone.
  for (const s of painting(LOOP.easel.seconds - 0.05, 7)) expect(s.share).toBeLessThan(0.2);
});

test("code is typed a line at a time, scrolls up, and the screen never overflows", () => {
  const start = code(0.4, 1);
  expect(start.lines).toHaveLength(1);
  expect(start.lines[0].w).toBeGreaterThan(0);
  // The cursor sits at the end of the line being typed.
  expect(start.cursor.x).toBeCloseTo(start.lines[0].x + start.lines[0].w);
  for (let t = 0; t < 60; t += 0.23) {
    const { lines } = code(t, 1);
    expect(lines.length).toBeLessThanOrEqual(SCREEN.rows);
    for (const l of lines) expect(l.x + l.w).toBeLessThanOrEqual(SCREEN.right + 1e-9);
  }
  // Earlier lines move up a row as each new one starts.
  // At 1.5 s the second line is seven-eighths typed; by 1.9 s it is finished and one row up.
  const typing = code(1.5, 1).lines;
  const after = code(1.9, 1).lines;
  expect(after).toHaveLength(typing.length + 1);
  expect(after[1].w * 0.875).toBeCloseTo(typing[0].w);
  expect(after[1].y).toBeGreaterThan(typing[0].y);
  expect(code(LOOP.terminal.doneAt + 0.1, 1).passed).toBe(true);
  expect(code(1, 1).passed).toBe(false);
});

test("in the game, the ship follows the stick and the score fills until the round is won", () => {
  for (let t = 0; t < 30; t += 0.31) {
    const g = game(t, 2);
    expect(Math.abs(g.ship)).toBeLessThanOrEqual(GAME.right);
    for (const f of g.fallers) {
      expect(f.y).toBeGreaterThanOrEqual(GAME.bottom);
      expect(f.y).toBeLessThanOrEqual(GAME.top);
    }
  }
  expect(game(0.5, 2).score).toBeLessThan(game(3, 2).score);
  expect(game(LOOP.cabinet.doneAt + 0.2, 2).won).toBe(true);
});

test("the sparkle comes once each time round, as the work is finished", () => {
  let bursts = 0;
  for (let t = 0; t < LOOP.terminal.seconds * 3; t += 1 / 60) {
    if (finishedBetween("terminal", t, t + 1 / 60)) bursts++;
  }
  expect(bursts).toBe(3);
  expect(finishedBetween("easel", LOOP.easel.doneAt - 0.01, LOOP.easel.doneAt + 0.01)).toBe(true);
  expect(finishedBetween("easel", 1, 1)).toBe(false);
  expect(loopAt("cabinet", 13)).toEqual({ p: 1, round: 2 });
});

test("his face keeps time with the work: pleased just as it is finished", () => {
  const mood = { running: false, waving: false, sinceLanding: 10, pointerX: 0, animate: true };
  const at = (place: "design" | "code" | "play", t: number) => faceFor({ ...mood, place, t });
  expect(at("design", LOOP.easel.doneAt - 0.2).mouth).toBe("flat");
  expect(at("design", LOOP.easel.doneAt + 0.2).blush).toBe(true);
  expect(at("code", LOOP.terminal.doneAt + 0.2).mouth).toBe("o");
  expect(at("play", LOOP.cabinet.doneAt + 0.2).eyes).toBe("happy");
});
