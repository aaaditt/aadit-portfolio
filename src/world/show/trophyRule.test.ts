import { expect, test } from "vitest";
import { DEPTH, PER_ROW, SPACING, displaySpot, roomCamera, roomSize, shelves, slots } from "./trophyRule";

const item = (id: string, kind: string) => ({ id, kind });
const many = (kind: string, n: number) => Array.from({ length: n }, (_, i) => item(`${kind}-${i}`, kind));

test("one shelf per kind, in the order each kind first appears", () => {
  const list = [item("a", "sport"), item("b", "course"), item("c", "sport"), item("d", "event")];
  expect(shelves(list).map((s) => s.kind)).toEqual(["sport", "course", "event"]);
  expect(shelves(list)[0].items.map((c) => c.id)).toEqual(["a", "c"]);
});

test("known kinds get their own name and object; any other kind still gets a shelf of framed certificates", () => {
  const list = [item("a", "course"), item("b", "sport"), item("c", "event"), item("d", "hackathon win")];
  expect(shelves(list).map((s) => s.shape)).toEqual(["scroll", "medal", "badge", "frame"]);
  expect(shelves(list).map((s) => s.title)).toEqual(["Courses", "Sports", "Events", "Hackathon win"]);
});

test("a kind is the same kind whatever its case or spacing", () => {
  expect(shelves([item("a", "Course"), item("b", " course ")])).toHaveLength(1);
});

test("a shelf holds ten across, then wraps to another row", () => {
  expect(PER_ROW).toBe(10);
  expect(shelves(many("course", 10))[0].rows).toBe(1);
  expect(shelves(many("course", 11))[0].rows).toBe(2);
  expect(shelves(many("course", 21))[0].rows).toBe(3);
});

test("every certificate has its own place on the wall, and none overlap", () => {
  const list = [...many("course", 23), ...many("sport", 4), ...many("event", 7), ...many("other", 2)];
  const placed = slots(list);
  expect(Object.keys(placed)).toHaveLength(list.length);
  const points = Object.values(placed);
  for (let i = 0; i < points.length; i++)
    for (let j = 0; j < i; j++) expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThanOrEqual(SPACING.across - 1e-9);
});

test("each row is centred, and shelves run from the top down", () => {
  const placed = slots([item("only", "course")]);
  expect(placed.only.x).toBeCloseTo(0);
  const two = slots([item("a", "course"), item("b", "sport")]);
  expect(two.a.y).toBeGreaterThan(two.b.y);
});

test("the room is as wide as its longest row, no wider, and grows taller with more rows", () => {
  const small = roomSize([item("a", "course")]);
  expect(roomSize(many("course", 6)).w).toBeCloseTo(6 * SPACING.across + 2.4);
  expect(roomSize(many("course", 30)).w).toBeCloseTo(PER_ROW * SPACING.across + 2.4);
  expect(roomSize(many("course", 6)).w).toBeLessThan(roomSize(many("course", 30)).w);
  expect(small.h).toBeGreaterThanOrEqual(5);
  const big = roomSize([...many("course", 25), ...many("sport", 12), ...many("event", 5)]);
  expect(big.h).toBeGreaterThan(small.h);
  // Every object fits inside the wall.
  for (const p of Object.values(slots([...many("course", 25), ...many("sport", 12), ...many("event", 5)]))) {
    expect(Math.abs(p.x)).toBeLessThan(big.w / 2);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(big.h);
  }
});

test("the camera inside stands back far enough to take in the whole wall, and never through the room's far end", () => {
  const size = roomSize([...many("course", 12), ...many("sport", 3)]);
  const wide = roomCamera(size, 1360 / 800);
  const phone = roomCamera(size, 390 / 844);
  expect(phone.distance).toBeGreaterThan(wide.distance);
  expect(phone.distance).toBeLessThan(DEPTH);
  const half = Math.tan((25 * Math.PI) / 180);
  expect(wide.distance * half * (1360 / 800)).toBeGreaterThanOrEqual(size.w / 2);
  // With the card taking part of the screen, it stands further back still, so nothing hides behind it.
  expect(roomCamera(size, 1360 / 800, { across: 0.68, down: 1 }).distance).toBeGreaterThan(wide.distance);
});

test("a picked certificate is shown out in front of the wall, in the middle, clear of every shelf", () => {
  const size = roomSize([...many("course", 6), ...many("sport", 3)]);
  const spot = displaySpot(size);
  expect(spot.x).toBe(0);
  expect(spot.z).toBeGreaterThan(1.5);
  expect(spot.y).toBeGreaterThan(0);
  expect(spot.y).toBeLessThan(size.h);
});
