"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Box } from "./box";

const dummy = new THREE.Object3D();
const colour = new THREE.Color();

/**
 * A matte material whose surface is broken into small squares of slightly different brightness,
 * four to a block, so that each block looks like hand-placed pixels instead of one flat colour.
 * The squares are fixed in the world, so only use it on things that never move.
 */
function grainMaterial() {
  const material = new THREE.MeshStandardMaterial({ roughness: 1 });
  material.onBeforeCompile = (shader) => {
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
  };
  return material;
}

/**
 * Draws any number of blocks in one batch.
 * - `glow` draws them at full brightness, unaffected by light and shadow, for screens and lamps.
 * - `grain` gives them a pixelled surface. Use it for things fixed in place.
 */
export function Voxels({
  boxes,
  glow = false,
  grain = false,
  shadows = true,
  cast = true,
}: {
  boxes: Box[];
  glow?: boolean;
  grain?: boolean;
  /** False to take no part in shadows at all. */
  shadows?: boolean;
  /** False to receive shadows without casting any. */
  cast?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const material = useMemo(() => {
    if (glow) return new THREE.MeshBasicMaterial({ toneMapped: false });
    return grain ? grainMaterial() : new THREE.MeshStandardMaterial({ roughness: 1 });
  }, [glow, grain]);

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
