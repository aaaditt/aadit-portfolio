"use client";

import { useMemo } from "react";
import type { SectionId } from "@/content/sections";
import { Hotspots } from "./Hotspots";
import { Boat, Campfire, Clouds, HotAirBalloon, Water, WindmillSails } from "./voxel/Animated";
import { Appear } from "./voxel/Appear";
import { Character } from "./voxel/Character";
import { Birds, ChimneySmoke, Villagers } from "./voxel/Life";
import { plateau } from "./voxel/terrain";
import { Voxels } from "./voxel/Voxels";
import { getWorld } from "./voxel/world";

/** The colour the far distance fades to. Matches the horizon of the page's sky gradient. */
export const HAZE = "#eef0dc";

export function Scene({
  greet,
  current,
  onOpen,
}: {
  greet: boolean;
  current: SectionId;
  onOpen: (href: string) => void;
}) {
  const world = useMemo(() => getWorld(), []);
  const lookout = plateau("lookout");

  return (
    <>
      <fog attach="fog" args={[HAZE, 45, 150]} />

      <hemisphereLight args={["#cfe2ff", "#8fae78", 1.5]} />
      <directionalLight
        // A lower, warmer sun from the south-west gives every block a lit side and a shaded side.
        position={[-42, 40, 36]}
        intensity={2.9}
        color="#ffe6c0"
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
      <Voxels boxes={world.terrain} cast={false} grain rise />
      <Voxels boxes={world.props} grain rise />
      <Voxels boxes={world.plants} cast={false} rise />
      <Voxels boxes={world.glow} glow rise />
      <Water />

      {/* Things that stand on the land wait for it to rise during the opening. */}
      <Appear distance={35}>
        <Character position={[1.2, lookout.h + 0.2, lookout.z + 4.2]} greet={greet} />
        <Campfire />
      </Appear>
      <Appear distance={22}>
        <Villagers />
      </Appear>
      <Appear distance={38}>
        <ChimneySmoke />
        <WindmillSails />
      </Appear>
      <Boat />
      <HotAirBalloon />
      <Birds />
      <Clouds />

      <Hotspots current={current} onOpen={onOpen} />
    </>
  );
}
