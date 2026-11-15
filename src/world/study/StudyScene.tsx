"use client";

import { useThree } from "@react-three/fiber";
import { Float, OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { Mood } from "../moods";
import { Building, Character, Island, NameSign, Tree } from "./parts";

/** The camera. It widens its view in tall, narrow frames so the whole island stays in shot. */
function Framing() {
  const aspect = useThree((s) => s.size.width / s.size.height);
  const fov = aspect < 1 ? Math.min(35 / aspect, 62) : 35;
  return <PerspectiveCamera makeDefault position={[9, 6.5, 11]} fov={fov} />;
}

/** The same tiny scene every time; only the mood changes how it looks. */
export function StudyScene({
  mood,
  interactive,
  animate,
}: {
  mood: Mood;
  interactive: boolean;
  animate: boolean;
}) {
  const { light, fog, palette } = mood;

  return (
    <>
      <Framing />
      <color attach="background" args={[palette.sky]} />
      {fog && <fog attach="fog" args={[fog.color, fog.near, fog.far]} />}

      <ambientLight intensity={light.ambient} />
      <directionalLight
        position={light.sunPosition}
        intensity={light.sun}
        color={light.sunColor}
        castShadow={light.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />

      {mood.material === "glow" && (
        <Stars radius={40} depth={20} count={900} factor={3} fade speed={animate ? 0.6 : 0} />
      )}

      <Float speed={animate ? 1.2 : 0} rotationIntensity={0} floatIntensity={0.5}>
        <Island mood={mood} />
        <Building mood={mood} position={[-1.6, 0, -1.2]} />
        <Tree mood={mood} position={[2.4, 0, -1.6]} />
        <Tree mood={mood} position={[3.2, 0, 0.6]} scale={0.75} />
        <Character mood={mood} position={[1, 0, 1.6]} animate={animate} />
        <NameSign mood={mood} text="AADIT" position={[-0.9, 0, 2.8]} />
      </Float>

      <OrbitControls
        target={[0, 0.9, 0]}
        enableRotate={interactive}
        enableZoom={interactive}
        enablePan={false}
        minDistance={8}
        maxDistance={24}
        minPolarAngle={0.5}
        maxPolarAngle={1.5}
        autoRotate={animate}
        autoRotateSpeed={0.7}
      />

      {mood.bloom > 0 && (
        <EffectComposer>
          <Bloom intensity={mood.bloom} luminanceThreshold={0.25} luminanceSmoothing={0.3} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}
