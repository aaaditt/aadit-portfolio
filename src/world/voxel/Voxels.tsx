"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Box } from "./box";

const dummy = new THREE.Object3D();
const colour = new THREE.Color();

/**
 * Seconds since the opening began. Blocks marked `rise` come up out of the ground as it passes
 * their distance from the village, in a wave. Leave it high for a fully risen world.
 */
export const riseClock = { value: 100 };

/** When, in seconds on the rise clock, something this far from the village has fully landed. */
export const landedAt = (distance: number) => distance * 0.035 + 0.35 + 0.9;

const RISE_VERTEX = `
  #ifdef USE_INSTANCING
    vec2 riseAt = instanceMatrix[3].xz;
    float riseDistance = length(riseAt - vec2(0.0, -7.0));
    // Each column starts at a slightly different moment, so the land arrives as falling blocks, not a wipe.
    float riseJitter = fract(sin(dot(floor(riseAt), vec2(12.9898, 78.233))) * 43758.5453) * 0.35;
    float riseK = clamp((uRise - riseDistance * 0.035 - riseJitter) / 0.9, 0.0, 1.0);
    // Ease out with a small overshoot, so each block lands with a bounce.
    float riseE = 1.0 + 2.70158 * pow(riseK - 1.0, 3.0) + 1.70158 * pow(riseK - 1.0, 2.0);
    // Start deep enough that even the mountain tops are under water.
    transformed.y -= (1.0 - riseE) * 36.0 / instanceMatrix[1][1];
  #endif`;

function addRise(shader: { uniforms: Record<string, unknown>; vertexShader: string }) {
  shader.uniforms.uRise = riseClock;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nuniform float uRise;")
    .replace("#include <begin_vertex>", `#include <begin_vertex>${RISE_VERTEX}`);
}

/** A full-brightness material for lit things, which can also rise with the land. */
function glowMaterial(rise: boolean) {
  const material = new THREE.MeshBasicMaterial({ toneMapped: false });
  if (rise) {
    material.onBeforeCompile = addRise;
    material.customProgramCacheKey = () => "glow-rise";
  }
  return material;
}

/**
 * A matte material for blocks.
 * - `grain` breaks the surface into small squares of slightly different brightness, four to a
 *   block, so each block looks like hand-placed pixels. The squares are fixed in the world, so
 *   only use it on things that never move.
 * - `rise` lets the blocks rise into place during the opening (see riseClock).
 */
function blockMaterial(grain: boolean, rise: boolean) {
  const material = new THREE.MeshStandardMaterial({ roughness: 1 });
  if (!grain && !rise) return material;

  material.onBeforeCompile = (shader) => {
    if (rise) addRise(shader);
    if (grain) {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vGrain;")
        .replace(
          "#include <project_vertex>",
          `#include <project_vertex>
          vec4 grainWorld = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            grainWorld = instanceMatrix * grainWorld;
          #endif
          grainWorld = modelMatrix * grainWorld;
          // Step just inside the surface, so a face lying exactly on a grid line picks one side.
          vGrain = grainWorld.xyz - normalize(mat3(modelMatrix) * normal) * 0.02;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vGrain;")
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          vec3 grainCell = floor(vGrain * 4.0);
          float grain = fract(sin(dot(grainCell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          // Three brightness steps, like a small pixel-art palette.
          grain = floor(grain * 3.0) / 2.0;
          // Fade the pattern out with distance, where it would only shimmer.
          float grainNear = 1.0 - smoothstep(22.0, 55.0, length(vViewPosition));
          diffuseColor.rgb *= 1.0 + (grain - 0.5) * 0.17 * grainNear;`,
        );
    }
  };
  // Materials with different options must not share a compiled shader.
  material.customProgramCacheKey = () => `block-${grain}-${rise}`;
  return material;
}

/**
 * Draws any number of blocks in one batch.
 * - `glow` draws them at full brightness, unaffected by light and shadow, for screens and lamps.
 * - `grain` gives them a pixelled surface. Use it for things fixed in place.
 * - `rise` makes them rise out of the ground during the opening.
 */
export function Voxels({
  boxes,
  glow = false,
  grain = false,
  rise = false,
  shadows = true,
  cast = true,
}: {
  boxes: Box[];
  glow?: boolean;
  grain?: boolean;
  rise?: boolean;
  /** False to take no part in shadows at all. */
  shadows?: boolean;
  /** False to receive shadows without casting any. */
  cast?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const material = useMemo(() => {
    if (glow) return glowMaterial(rise);
    return blockMaterial(grain, rise);
  }, [glow, grain, rise]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    boxes.forEach(([x, y, z, w, h, d, c], i) => {
      dummy.position.set(x + w / 2, y + h / 2, z + d / 2);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colour.set(c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [boxes]);

  if (boxes.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      // Remount if the number of blocks changes, since the batch size is fixed at creation.
      key={boxes.length}
      args={[undefined, material, boxes.length]}
      castShadow={shadows && cast && !glow}
      receiveShadow={shadows && !glow}
    >
      <boxGeometry />
    </instancedMesh>
  );
}
