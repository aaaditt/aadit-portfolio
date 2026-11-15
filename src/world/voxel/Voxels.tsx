"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { Box } from "./box";

const dummy = new THREE.Object3D();
const colour = new THREE.Color();

/**
 * Draws any number of blocks in one batch. `glow` draws them at full brightness,
 * unaffected by light and shadow, for screens and lamps.
 */
export function Voxels({
  boxes,
  glow = false,
  shadows = true,
  cast = true,
}: {
  boxes: Box[];
  glow?: boolean;
  /** False to take no part in shadows at all. */
  shadows?: boolean;
  /** False to receive shadows without casting any. */
  cast?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

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
      args={[undefined, undefined, boxes.length]}
      castShadow={shadows && cast && !glow}
      receiveShadow={shadows && !glow}
    >
      <boxGeometry />
      {glow ? <meshBasicMaterial toneMapped={false} /> : <meshStandardMaterial roughness={1} />}
    </instancedMesh>
  );
}
