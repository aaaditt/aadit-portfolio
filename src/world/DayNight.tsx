"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "@/ui/themeStore";
import { DAY_HAZE, NIGHT_HAZE, daylight } from "./daylight";
import { useMotion } from "./motion";
import { GRADES, lightScale } from "./stageRule";
import { stage } from "./stageStore";
import { walker } from "./walker";

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
  sky: new THREE.Color("#4656a0"),
  ground: new THREE.Color("#1b2440"),
  ambient: 0.85,
  // The same light, now the moon: cool and dim, still casting soft shadows.
  sun: new THREE.Color("#a9bcff"),
  sunPower: 1.05,
};

/** Warm light on the fronts of the studio, the lab and the arcade, and round the well. Off by day. */
const POOLS: [number, number, number][] = [
  [-14.3, 6.5, -4],
  [21, 6.5, -4],
  [0, 8, -18.5],
  [0, 6.5, -7],
];
/** How strong each pool is at full night. The arcade's is softer, as the plaza there is wide and pale. */
const POOL_POWER = [10, 10, 4.5, 8];

const FILL_POWER = 4;
const toCamera = new THREE.Vector3();
const tint = new THREE.Color();
const tintNight = new THREE.Color();

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
  const fill = useRef<THREE.PointLight>(null);
  /** False until the first frame, so the world opens in the right light with no fade. */
  const started = useRef(false);

  useFrame(({ camera }, delta) => {
    const goal = night ? 1 : 0;
    if (!started.current || !animate) daylight.night = goal;
    else daylight.night += (goal - daylight.night) * (1 - Math.exp(-RATE * Math.min(delta, 0.1)));
    if (Math.abs(goal - daylight.night) < 0.001) daylight.night = goal;
    started.current = true;
    const n = daylight.night;

    // While a show is staged, the world's own light drops and the fog closes in round the show,
    // in the place's own colour. This sits on top of day or night: the theme still decides which.
    const s = stage.level;
    const dim = lightScale(s, n);
    if (fog.current) {
      fog.current.color.lerpColors(DAY.haze, NIGHT.haze, n);
      if (s > 0) {
        const grade = GRADES[stage.place];
        tint.set(grade.day).lerp(tintNight.set(grade.night), n);
        fog.current.color.lerp(tint, s);
      }
    }
    if (hemisphere.current) {
      hemisphere.current.color.lerpColors(DAY.sky, NIGHT.sky, n);
      hemisphere.current.groundColor.lerpColors(DAY.ground, NIGHT.ground, n);
      hemisphere.current.intensity = (DAY.ambient + (NIGHT.ambient - DAY.ambient) * n) * dim;
    }
    if (sun.current) {
      sun.current.color.lerpColors(DAY.sun, NIGHT.sun, n);
      sun.current.intensity = (DAY.sunPower + (NIGHT.sunPower - DAY.sunPower) * n) * dim;
    }
    // A soft warm light on the camera's side of the character, so his face reads at night, so he never becomes a silhouette.
    if (fill.current) {
      toCamera.set(camera.position.x - walker.x, 0, camera.position.z - walker.z).normalize();
      fill.current.position.set(walker.x + toCamera.x * 2.2, walker.y + 3.4, walker.z + toCamera.z * 2.2);
      fill.current.intensity = FILL_POWER * n;
    }
    pools.current.forEach((light, i) => {
      if (light) light.intensity = POOL_POWER[i] * n;
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
        // The scene is drawn at a low, pixelled resolution, so a smaller shadow map looks the same.
        shadow-mapSize={[1024, 1024]}
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
        <pointLight key={i} ref={(el) => void (pools.current[i] = el)} position={at} color="#ffb85c" intensity={0} distance={10} decay={1} />
      ))}
      <pointLight ref={fill} color="#ffe7cf" intensity={0} distance={8} decay={1} />
    </>
  );
}
