"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { Vector2 } from "three";

import {
  AsciiEffect,
  ASCII_POST_PROCESSING_DEFAULTS,
  type AsciiColorPalette,
  type AsciiEffectHandle,
  type AsciiStyle,
  type PublicAsciiPostProcessingSettings,
} from "@/components/AsciiEffect";

type ControlValues = Record<string, any>;

const resolveNumber = (
  values: ControlValues,
  key: string,
  fallback: number
) => {
  const value = values[key];
  return typeof value === "number" ? value : fallback;
};

const resolveBoolean = (
  values: ControlValues,
  key: string,
  fallback: boolean
) => {
  const value = values[key];
  return typeof value === "boolean" ? value : fallback;
};

export type AsciiBaseProps = {
  cellSize: number;
  invert: boolean;
  colorMode: boolean;
  style: AsciiStyle;
};

export const buildAsciiEffectProps = (
  values: ControlValues,
  baseProps: AsciiBaseProps
) => {
  const styleValue = (values.style ?? baseProps.style) as AsciiStyle;
  const paletteValue = (values.colorPalette ?? "original") as AsciiColorPalette;

  const postProcessing: PublicAsciiPostProcessingSettings = {
    scanlineIntensity: resolveNumber(
      values,
      "scanlineIntensity",
      ASCII_POST_PROCESSING_DEFAULTS.scanlineIntensity
    ),
    scanlineCount: resolveNumber(
      values,
      "scanlineCount",
      ASCII_POST_PROCESSING_DEFAULTS.scanlineCount
    ),
    targetFPS: resolveNumber(
      values,
      "targetFPS",
      ASCII_POST_PROCESSING_DEFAULTS.targetFPS
    ),
    jitterIntensity: resolveNumber(
      values,
      "jitterIntensity",
      ASCII_POST_PROCESSING_DEFAULTS.jitterIntensity
    ),
    jitterSpeed: resolveNumber(
      values,
      "jitterSpeed",
      ASCII_POST_PROCESSING_DEFAULTS.jitterSpeed
    ),
    mouseGlowEnabled: resolveBoolean(
      values,
      "mouseGlowEnabled",
      ASCII_POST_PROCESSING_DEFAULTS.mouseGlowEnabled
    ),
    mouseGlowRadius: resolveNumber(
      values,
      "mouseGlowRadius",
      ASCII_POST_PROCESSING_DEFAULTS.mouseGlowRadius
    ),
    mouseGlowIntensity: resolveNumber(
      values,
      "mouseGlowIntensity",
      ASCII_POST_PROCESSING_DEFAULTS.mouseGlowIntensity
    ),
    vignetteIntensity: resolveNumber(
      values,
      "vignetteIntensity",
      ASCII_POST_PROCESSING_DEFAULTS.vignetteIntensity
    ),
    vignetteRadius: resolveNumber(
      values,
      "vignetteRadius",
      ASCII_POST_PROCESSING_DEFAULTS.vignetteRadius
    ),
    colorPalette: paletteValue,
    curvature: resolveNumber(
      values,
      "curvature",
      ASCII_POST_PROCESSING_DEFAULTS.curvature
    ),
    aberrationStrength: resolveNumber(
      values,
      "aberrationStrength",
      ASCII_POST_PROCESSING_DEFAULTS.aberrationStrength
    ),
    noiseIntensity: resolveNumber(
      values,
      "noiseIntensity",
      ASCII_POST_PROCESSING_DEFAULTS.noiseIntensity
    ),
    noiseScale: resolveNumber(
      values,
      "noiseScale",
      ASCII_POST_PROCESSING_DEFAULTS.noiseScale
    ),
    noiseSpeed: resolveNumber(
      values,
      "noiseSpeed",
      ASCII_POST_PROCESSING_DEFAULTS.noiseSpeed
    ),
    waveAmplitude: resolveNumber(
      values,
      "waveAmplitude",
      ASCII_POST_PROCESSING_DEFAULTS.waveAmplitude
    ),
    waveFrequency: resolveNumber(
      values,
      "waveFrequency",
      ASCII_POST_PROCESSING_DEFAULTS.waveFrequency
    ),
    waveSpeed: resolveNumber(
      values,
      "waveSpeed",
      ASCII_POST_PROCESSING_DEFAULTS.waveSpeed
    ),
    glitchIntensity: resolveNumber(
      values,
      "glitchIntensity",
      ASCII_POST_PROCESSING_DEFAULTS.glitchIntensity
    ),
    glitchFrequency: resolveNumber(
      values,
      "glitchFrequency",
      ASCII_POST_PROCESSING_DEFAULTS.glitchFrequency
    ),
    brightnessAdjust: resolveNumber(
      values,
      "brightnessAdjust",
      ASCII_POST_PROCESSING_DEFAULTS.brightnessAdjust
    ),
    contrastAdjust: resolveNumber(
      values,
      "contrastAdjust",
      ASCII_POST_PROCESSING_DEFAULTS.contrastAdjust
    ),
  };

  return {
    cellSize: resolveNumber(values, "cellSize", baseProps.cellSize),
    invert: resolveBoolean(values, "invert", baseProps.invert),
    colorMode: resolveBoolean(values, "colorMode", baseProps.colorMode),
    style: styleValue,
    postProcessing,
  };
};

export type AsciiSceneSettings = ReturnType<typeof buildAsciiEffectProps>;

function AsciiPostProcessing({ settings }: { settings: AsciiSceneSettings }) {
  const effectRef = useRef<AsciiEffectHandle | null>(null);
  const resolution = useMemo(() => new Vector2(), []);
  const mousePosition = useMemo(() => new Vector2(), []);
  const { size, gl } = useThree();

  useEffect(() => {
    resolution.set(size.width, size.height);
    effectRef.current?.updateUniforms({ resolution });
  }, [size.width, size.height, resolution]);

  useEffect(() => {
    const element = gl.domElement;
    if (!element) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = rect.height - (event.clientY - rect.top);
      mousePosition.set(x, y);
    };

    element.addEventListener("pointermove", handlePointerMove);
    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
    };
  }, [gl, mousePosition]);

  useFrame(() => {
    effectRef.current?.updateUniforms({ mousePos: mousePosition });
  });

  return (
    <EffectComposer>
      <AsciiEffect
        ref={effectRef}
        cellSize={settings.cellSize}
        invert={settings.invert}
        colorMode={settings.colorMode}
        style={settings.style}
        postProcessing={settings.postProcessing}
      />
    </EffectComposer>
  );
}

type AsciiSceneProps = {
  settings: AsciiSceneSettings;
  children?: ReactNode;
};

export function AsciiScene({ settings, children }: AsciiSceneProps) {
  return (
    <>
      <color attach="background" args={["#050505"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 8]} intensity={1.2} />
      <pointLight position={[-4, -2, -6]} intensity={0.8} />
      {children}
      <AsciiPostProcessing settings={settings} />
    </>
  );
}
