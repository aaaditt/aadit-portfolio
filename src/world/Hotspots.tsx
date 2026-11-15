"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS, type SectionId } from "@/content/sections";
import { intro } from "./introStore";
import { flight, hover, mapLabels } from "./overlayState";
import { plateau } from "./voxel/terrain";

type Spot = { id: SectionId; centre: [number, number, number]; size: [number, number, number] };

function spots(): Spot[] {
  const design = plateau("design");
  const code = plateau("code");
  const play = plateau("play");
  const lookout = plateau("lookout");
  return [
    { id: "design", centre: [design.x + 1.5, design.h + 4.5, design.z - 0.5], size: [14, 9, 9] },
    { id: "code", centre: [code.x - 0.5, code.h + 4.5, code.z - 0.5], size: [17, 9, 9] },
    { id: "play", centre: [play.x, play.h + 4.5, play.z - 1], size: [29, 9, 9] },
    { id: "about", centre: [lookout.x + 1.2, lookout.h + 2, lookout.z + 4.2], size: [3.4, 4.6, 3] },
  ];
}

const SPOTS = spots();
const projected = new THREE.Vector3();

/**
 * Invisible boxes around each landmark. Hovering one shows its name; clicking it opens that section.
 * Also reports where each district sits on screen, for the name tags in the opening map view.
 */
export function Hotspots({ current, onOpen }: { current: SectionId; onOpen: (href: string) => void }) {
  // Never leave the pointer cursor or a name tag behind.
  useEffect(
    () => () => {
      hover.text = "";
      document.body.style.cursor = "";
    },
    [],
  );

  useFrame(({ camera, size }) => {
    if (intro.get() !== "playing" || flight.progress > 0.45) return;
    SPOTS.forEach((spot, i) => {
      projected.set(...spot.centre).project(camera);
      mapLabels[i].x = (projected.x * 0.5 + 0.5) * size.width;
      mapLabels[i].y = (-projected.y * 0.5 + 0.5) * size.height;
    });
  });

  return (
    <>
      {SPOTS.filter((spot) => spot.id !== current).map((spot) => {
        const section = SECTIONS.find((s) => s.id === spot.id)!;
        return (
          <mesh
            key={spot.id}
            position={spot.centre}
            onPointerOver={(event) => {
              event.stopPropagation();
              if (intro.get() !== "done") return;
              hover.text = section.title;
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              hover.text = "";
              document.body.style.cursor = "";
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (intro.get() !== "done") return;
              hover.text = "";
              document.body.style.cursor = "";
              onOpen(section.href);
            }}
          >
            <boxGeometry args={spot.size} />
            {/* Drawn fully see-through: it is there to be clicked, not seen. */}
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}
