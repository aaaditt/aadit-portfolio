"use client";

import { useMemo } from "react";
import type { SectionId } from "@/content/sections";
import { DayNight } from "./DayNight";
import { daylight } from "./daylight";
import { Hotspots } from "./Hotspots";
import { Buckets } from "./show/Buckets";
import { Camp } from "./show/Camp";
import { Banners, StageLights } from "./show/Grounds";
import { Lab } from "./show/Lab";
import { Stage } from "./show/Stage";
import { Boat, Campfire, Clouds, CodeSign, HotAirBalloon, MailFlag, Water, WindmillSails } from "./voxel/Animated";
import { Appear } from "./voxel/Appear";
import { Character } from "./voxel/Character";
import { Dust } from "./voxel/Dust";
import { Exhibits } from "./voxel/Exhibits";
import { Birds, ChimneySmoke, Villagers } from "./voxel/Life";
import { Fireflies, Moon } from "./voxel/Night";
import { Voxels } from "./voxel/Voxels";
import { getWorld } from "./voxel/world";

export function Scene({
  greet,
  current,
  project,
  onOpen,
}: {
  greet: boolean;
  current: SectionId;
  /** The project page that is open, if any. */
  project: string | null;
  onOpen: (href: string) => void;
}) {
  const world = useMemo(() => getWorld(), []);

  return (
    <>
      <DayNight />
      <Stage current={current} project={project} />

      {/* The ground receives shadows but does not cast them, which halves the shadow work. */}
      <Voxels boxes={world.terrain} cast={false} grain rise />
      <Voxels boxes={world.props} grain rise />
      <Voxels boxes={world.plants} cast={false} rise />
      <Voxels boxes={world.glow} glow rise />
      <Voxels boxes={world.nightGlow} glow fade={daylight} />
      <Water />

      {/* Things that stand on the land wait for it to rise during the opening. */}
      <Appear distance={35}>
        <Character greet={greet} />
        <Dust />
        <Campfire />
        <MailFlag />
        <Camp current={current} />
      </Appear>
      <Appear distance={18}>
        <CodeSign />
        <Lab current={current} project={project} />
      </Appear>
      <Appear distance={20}>
        <Exhibits project={project} onOpen={onOpen} />
        <Buckets project={project} />
      </Appear>
      <Appear distance={22}>
        <Villagers />
        <StageLights />
        <Banners current={current} />
      </Appear>
      <Appear distance={38}>
        <ChimneySmoke />
        <WindmillSails />
      </Appear>
      <Boat />
      <HotAirBalloon />
      <Birds />
      <Clouds />
      <Moon />
      <Fireflies />

      <Hotspots current={current} onOpen={onOpen} />
    </>
  );
}
