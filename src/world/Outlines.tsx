"use client";

import { useMemo } from "react";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { Uniform } from "three";

/**
 * Darkens each pixel that sits in front of something noticeably farther away: the edge of a
 * block against the ground or sky behind it. Drawn at the world's low resolution, that makes a
 * one-pixel outline round shapes, like hand-drawn pixel art. The sky stays see-through.
 */
const FRAGMENT = /* glsl */ `
  uniform float strength;

  float distanceAt(const in vec2 uv) {
    return -getViewZ(readDepth(uv));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    outputColor = inputColor;
    // Nothing to outline on empty sky.
    if (depth >= 0.9999) return;

    float here = -getViewZ(depth);
    float gap = 0.0;
    gap = max(gap, distanceAt(uv + vec2(texelSize.x, 0.0)) - here);
    gap = max(gap, distanceAt(uv - vec2(texelSize.x, 0.0)) - here);
    gap = max(gap, distanceAt(uv + vec2(0.0, texelSize.y)) - here);
    gap = max(gap, distanceAt(uv - vec2(0.0, texelSize.y)) - here);

    // A step of most of a block close up; proportionally more far away, so distant slopes stay clean.
    float edge = step(max(0.7, here * 0.03), gap);
    // Fade outlines out into the distance, where they would only be noise.
    edge *= 1.0 - smoothstep(40.0, 90.0, here);
    outputColor = vec4(mix(inputColor.rgb, inputColor.rgb * 0.55, edge * strength), inputColor.a);
  }
`;

class BlockOutlineEffect extends Effect {
  constructor() {
    super("BlockOutlineEffect", FRAGMENT, {
      attributes: EffectAttribute.DEPTH,
      blendFunction: BlendFunction.SRC,
      uniforms: new Map([["strength", new Uniform(1)]]),
    });
  }
}

/** Draws the scene through the outline effect. Mount once, inside the Canvas. */
export function Outlines() {
  const effect = useMemo(() => new BlockOutlineEffect(), []);
  return (
    // No multisampling: smoothed edges would undo the pixel look.
    <EffectComposer multisampling={0}>
      <primitive object={effect} dispose={null} />
    </EffectComposer>
  );
}
