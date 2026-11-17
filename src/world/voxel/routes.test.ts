import { expect, test } from "vitest";
import { SECTIONS } from "../../content/sections";
import { EXHIBITS } from "./exhibitData";
import * as M from "./models";
import { place, type Box } from "./box";
import { NODES, STANDS, lengthOf, pointAlong, route, routeFrom, smoothAlong, type NodeId } from "./routes";
import { groundY, heightAt } from "./terrain";
import { getWorld } from "./world";

const ids = Object.keys(NODES) as NodeId[];

test("every section has a place for him to stand, and every place can be reached from every other", () => {
  for (const section of SECTIONS) expect(STANDS[section.id], section.id).toBeDefined();
  for (const from of ids) {
    for (const to of ids) {
      const path = route(from, to);
      expect(path[0]).toBe(from);
      expect(path[path.length - 1]).toBe(to);
    }
  }
});

test("the shortest way is chosen", () => {
  // Going from the studio to the arcade passes north of the well, not round its south side.
  const path = route("design-2", "events-2");
  expect(path).toContain("plazaNW");
  expect(path).not.toContain("plazaS");
  // Nothing is visited twice.
  expect(new Set(path).size).toBe(path.length);
  expect(route("lookout", "lookout")).toEqual(["lookout"]);
});

test("a route can be walked from one end to the other", () => {
  const points = route("lookout", "code-2").map((id) => NODES[id]);
  const total = lengthOf(points);
  expect(total).toBeGreaterThan(30);
  const start = pointAlong(points, 0);
  const end = pointAlong(points, total + 5);
  expect([start.x, start.z]).toEqual(NODES.lookout);
  expect([end.x, end.z]).toEqual(NODES["code-2"]);
  // Halfway there he is somewhere between the two, heading roughly north.
  const mid = pointAlong(points, total / 2);
  expect(mid.z).toBeLessThan(NODES.lookout[1]);
  expect(mid.z).toBeGreaterThan(NODES.plazaS[1] - 6);
  expect(Math.cos(mid.heading)).toBeLessThan(0);
});

test("changing his mind part-way sets off from where he is, by the nearer end of the stretch he is on", () => {
  // Just past the bridge on the way north, told to go home: he turns round.
  const back = routeFrom([0, 4], "bridge", "plazaS", "lookout");
  expect(back[0]).toEqual([0, 4]);
  expect(back[1]).toEqual(NODES.bridge);
  expect(back[back.length - 1]).toEqual(NODES.lookout);
  // Same spot, told to go to the arcade: he carries on.
  const on = routeFrom([0, 4], "bridge", "plazaS", "events-2");
  expect(on[1]).toEqual(NODES.plazaS);
});

/** Everything solid in the valley, including the exhibits, which are drawn separately. */
function obstacles(): Box[] {
  const out = [...getWorld().props];
  for (const e of EXHIBITS) {
    const at: [number, number, number] = [e.x, heightAt(Math.floor(e.x), Math.floor(e.z)), e.z];
    const model = e.kind === "easel" ? M.easel([M.K.coral, M.K.coral, M.K.coral]) : e.kind === "terminal" ? M.terminal(M.K.coral).solid : M.cart(M.K.coral, M.K.coral).solid;
    out.push(...place(model, at));
  }
  return out;
}

test("no route runs through a building, a lamp, the well or an exhibit", () => {
  const solid = obstacles();
  const RADIUS = 0.4;
  const seen = new Set<string>();
  for (const from of ids) {
    for (const to of ids) {
      const path = route(from, to);
      for (let i = 0; i + 1 < path.length; i++) {
        const key = [path[i], path[i + 1]].sort().join(">");
        if (seen.has(key)) continue;
        seen.add(key);
        const points = [NODES[path[i]], NODES[path[i + 1]]];
        const total = lengthOf(points);
        for (let d = 0; d <= total; d += 0.2) {
          const { x, z } = pointAlong(points, d);
          const feet = groundY(x, z);
          const hit = solid.find(
            ([bx, by, bz, bw, bh, bd]) =>
              x + RADIUS > bx && x - RADIUS < bx + bw && z + RADIUS > bz && z - RADIUS < bz + bd && by < feet + 3 && by + bh > feet + 0.45,
          );
          expect(hit, `${key} at ${x.toFixed(1)}, ${z.toFixed(1)}`).toBeUndefined();
        }
      }
    }
  }
});

test("he never has to climb more than two blocks in one step", () => {
  for (const to of ids) {
    const points = route("lookout", to).map((id) => NODES[id]);
    const total = lengthOf(points);
    let last = groundY(points[0][0], points[0][1]);
    for (let d = 0; d <= total; d += 0.5) {
      const { x, z } = pointAlong(points, d);
      const y = groundY(x, z);
      expect(Math.abs(y - last), `${to} at ${x.toFixed(1)}, ${z.toFixed(1)}`).toBeLessThanOrEqual(2);
      last = y;
    }
  }
});

test("with the corners rounded off, he still clears everything and ends exactly on his spot", () => {
  const solid = obstacles();
  const RADIUS = 0.4;
  const stands: NodeId[] = ["lookout", "design-1", "design-2", "design-3", "code-1", "code-2", "code-3", "events-1", "events-2", "events-3"];
  for (const from of stands) {
    for (const to of stands) {
      if (from === to) continue;
      const points = route(from, to).map((id) => NODES[id]);
      const total = lengthOf(points);
      const end = smoothAlong(points, total);
      expect(end.x).toBeCloseTo(NODES[to][0]);
      expect(end.z).toBeCloseTo(NODES[to][1]);
      expect(smoothAlong(points, 0).x).toBeCloseTo(NODES[from][0]);
      for (let d = 0; d <= total; d += 0.2) {
        const { x, z } = smoothAlong(points, d);
        const feet = groundY(x, z);
        const hit = solid.find(
          ([bx, by, bz, bw, bh, bd]) =>
            x + RADIUS > bx && x - RADIUS < bx + bw && z + RADIUS > bz && z - RADIUS < bz + bd && by < feet + 3 && by + bh > feet + 0.45,
        );
        expect(hit, `${from} to ${to} at ${x.toFixed(1)}, ${z.toFixed(1)}`).toBeUndefined();
      }
    }
  }
});
