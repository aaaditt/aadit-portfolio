"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "@/ui/themeStore";
import { DAY_HAZE, NIGHT_HAZE, daylight } from "./daylight";
import { useMotion } from "./motion";

const DAY = {
  haze: new THREE.Color(DAY_HAZE),
  sky: new THREE.Color("#cfe2ff"),
  ground: new THREE.Color("#8fae78"),
  ambient: 1.5,
  sun: new THREE.Color("#ffe6c0"),
  sunPower: 2.9,
};

const NIGHT = {
  haze: new THREE.Color(NIGHT_HAZE),
  sky: new THREE.Color("#5a6cb0"),
  ground: new THREE.Color("#1f2a48"),
  ambient: 1.05,
  // The same light, now the moon: cool and dim, still casting soft shadows.
  sun: new THREE.Color("#a9bcff"),
  sunPower: 0.85,
};

/** Warm pools of light by the well, in front of the arcade, and on the bridge. Off by day. */
const POOLS: [number, number, number][] = [
  [0, 6.5, -7],
  [0, 8, -19],
  [0.5, 4.5, 8],
];
const POOL_POWER = 7;

/** How quickly day turns to night, per second. About a second and a half end to end. */
const RATE = 3.2;

/**
 * The sun, sky light and haze, which turn to moonlight and a dark blue haze when the page is in
 * its night theme. Also moves daylight.night towards the theme, for everything else to follow.
 */
export function DayNight() {
  const night = useTheme() === "night";
  const animate = useMotion();
  const hemisphere = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const pools = useRef<(THREE.PointLight | null)[]>([]);
  const fog = useRef<THREE.Fog>(null);
  /** False until the first frame, so the world opens in the right light with no fade. */
  const started = useRef(false);

  useFrame((_, delta) => {
    const goal = night ? 1 : 0;
    if (!started.current || !animate) daylight.night = goal;
    else daylight.night += (goal - daylight.night) * (1 - Math.exp(-RATE * Math.min(delta, 0.1)));
    if (Math.abs(goal - daylight.night) < 0.001) daylight.night = goal;
    started.current = true;
    const n = daylight.night;

    if (fog.current) fog.current.color.lerpColors(DAY.haze, NIGHT.haze, n);
    if (hemisphere.current) {
      hemisphere.current.color.lerpColors(DAY.sky, NIGHT.sky, n);
      hemisphere.current.groundColor.lerpColors(DAY.ground, NIGHT.ground, n);
      hemisphere.current.intensity = DAY.ambient + (NIGHT.ambient - DAY.ambient) * n;
    }
    if (sun.current) {
      sun.current.color.lerpColors(DAY.sun, NIGHT.sun, n);
      sun.current.intensity = DAY.sunPower + (NIGHT.sunPower - DAY.sunPower) * n;
    }
    pools.current.forEach((light) => {
      if (light) light.intensity = POOL_POWER * n;
    });
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={[DAY_HAZE, 45, 150]} />
      <hemisphereLight ref={hemisphere} args={[DAY.sky, DAY.ground, DAY.ambient]} />
      <directionalLight
        ref={sun}
        // A lower, warmer sun from the south-west gives every block a lit side and a shaded side.
        position={[-42, 40, 36]}
        intensity={DAY.sunPower}
        color={DAY.sun}
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
      {POOLS.map((at, i) => (
        <pointLight key={i} ref={(el) => void (pools.current[i] = el)} position={at} color="#ffb85c" intensity={0} distance={15} decay={1} />
      ))}
    </>
  );
}
