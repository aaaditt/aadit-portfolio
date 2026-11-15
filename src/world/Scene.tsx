"use client";

import { useMemo } from "react";
import { Boat, Campfire, Clouds, HotAirBalloon, Water, WindmillSails } from "./voxel/Animated";
import { Character } from "./voxel/Character";
import { plateau } from "./voxel/terrain";
import { Voxels } from "./voxel/Voxels";
import { getWorld } from "./voxel/world";

/** The colour the far distance fades to. Matches the horizon of the page's sky gradient. */
export const HAZE = "#d6ecf2";

export function Scene({ greet }: { greet: boolean }) {
  const world = useMemo(() => getWorld(), []);
  const lookout = plateau("lookout");

  return (
    <>
      <fog attach="fog" args={[HAZE, 70, 190]} />

      <hemisphereLight args={["#eaf6ff", "#8fb97a", 0.95]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[38, 60, 30]}
        intensity={2.4}
        color="#fff3d9"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-62}
        shadow-camera-right={62}
        shadow-camera-top={62}
        shadow-camera-bottom={-62}
        shadow-camera-near={10}
        shadow-camera-far={160}
        shadow-bias={-0.0006}
        shadow-normalBias={0.06}
      />

      {/* The ground receives shadows but does not cast them, which halves the shadow work. */}
      <Voxels boxes={world.terrain} cast={false} />
      <Voxels boxes={world.props} />
      <Voxels boxes={world.plants} cast={false} />
      <Voxels boxes={world.glow} glow />
      <Water />

      <Character position={[1.2, lookout.h, lookout.z + 4.2]} greet={greet} />
      <Campfire />
      <WindmillSails />
      <Boat />
      <HotAirBalloon />
      <Clouds />
    </>
  );
}
