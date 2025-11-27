"use client";

import { forwardRef, useEffect, useMemo } from "react";

import { BlendFunction, Effect } from "postprocessing";
import { Uniform, Vector2 } from "three";
import type { WebGLRenderer, WebGLRenderTarget } from "three";

import fragmentShader from "@/shaders/ascii/fragment";

const DEFAULT_RESOLUTION = new Vector2(1920, 1080);
const DEFAULT_MOUSE_POSITION = new Vector2(0, 0);

const STYLE_MAP = {
  standard: 0,
  dense: 1,
  minimal: 2,
  blocks: 3,
} as const;

const COLOR_PALETTE_MAP = {
  original: 0,
  green: 1,
  amber: 2,
  cyan: 3,
  blue: 4,
} as const;

type PostProcessingSettings = {
  scanlineIntensity: number;
  scanlineCount: number;
  targetFPS: number;
  jitterIntensity: number;
  jitterSpeed: number;
  mouseGlowEnabled: boolean;
  mouseGlowRadius: number;
  mouseGlowIntensity: number;
  vignetteIntensity: number;
  vignetteRadius: number;
  colorPalette: number;
  curvature: number;
  aberrationStrength: number;
  noiseIntensity: number;
  noiseScale: number;
  noiseSpeed: number;
  waveAmplitude: number;
  waveFrequency: number;
  waveSpeed: number;
  glitchIntensity: number;
  glitchFrequency: number;
  brightnessAdjust: number;
  contrastAdjust: number;
};

const COMPONENT_DEFAULT_PROPS = {
  cellSize: 6,
  invert: false,
  colorMode: true,
  style: "standard" as const,
} as const;

export const ASCII_POST_PROCESSING_DEFAULTS: PostProcessingSettings = {
  scanlineIntensity: 0,
  scanlineCount: 200,
  targetFPS: 0,
  jitterIntensity: 0,
  jitterSpeed: 0,
  mouseGlowEnabled: false,
  mouseGlowRadius: 200,
  mouseGlowIntensity: 1.5,
  vignetteIntensity: 0,
  vignetteRadius: 0.8,
  colorPalette: COLOR_PALETTE_MAP.original,
  curvature: 0.21,
  aberrationStrength: 0,
  noiseIntensity: 0,
  noiseScale: 0.1,
  noiseSpeed: 0,
  waveAmplitude: 0.013,
  waveFrequency: 3,
  waveSpeed: 0.2,
  glitchIntensity: 0,
  glitchFrequency: 0,
  brightnessAdjust: -0.05,
  contrastAdjust: 1,
};

const normalizePostProcessing = (
  overrides?: Partial<PublicPostProcessingSettings>
): PostProcessingSettings => {
  const { colorPalette: overridePalette, ...otherOverrides } = overrides ?? {};
  const merged: PostProcessingSettings = {
    ...ASCII_POST_PROCESSING_DEFAULTS,
    ...(otherOverrides as Partial<PostProcessingSettings>),
  };

  const paletteValue =
    overridePalette === undefined
      ? merged.colorPalette
      : typeof overridePalette === "string"
      ? COLOR_PALETTE_MAP[overridePalette.toLowerCase() as AsciiColorPalette] ??
        COLOR_PALETTE_MAP.original
      : overridePalette;

  return { ...merged, colorPalette: paletteValue };
};

type AsciiStyle = keyof typeof STYLE_MAP;
type AsciiColorPalette = keyof typeof COLOR_PALETTE_MAP;

type PublicPostProcessingSettings = Omit<
  PostProcessingSettings,
  "colorPalette"
> & { colorPalette: keyof typeof COLOR_PALETTE_MAP | number };

type AsciiEffectUniformProps = {
  cellSize: number;
  invert: boolean;
  colorMode: boolean;
  asciiStyle: number;
  resolution: Vector2;
  mousePos: Vector2;
} & PostProcessingSettings;

type AsciiEffectOptions = {
  style: AsciiStyle;
  cellSize: number;
  invert: boolean;
  colorMode: boolean;
  resolution?: Vector2;
  mousePosition?: Vector2;
  postProcessing?: Partial<PublicPostProcessingSettings>;
};

type AsciiEffectProps = Partial<Omit<AsciiEffectOptions, "postProcessing">> & {
  postProcessing?: Partial<PublicPostProcessingSettings>;
};

class AsciiEffectImpl extends Effect {
  private time = 0;
  private deltaAccumulator = 0;

  constructor(initialProps: AsciiEffectUniformProps) {
    const uniformEntries: Array<[string, Uniform<any>]> = [
      ["cellSize", new Uniform(initialProps.cellSize)],
      ["invert", new Uniform(initialProps.invert)],
      ["colorMode", new Uniform(initialProps.colorMode)],
      ["asciiStyle", new Uniform(initialProps.asciiStyle)],
      ["time", new Uniform(0)],
      ["resolution", new Uniform(initialProps.resolution.clone())],
      ["mousePos", new Uniform(initialProps.mousePos.clone())],
      ["scanlineIntensity", new Uniform(initialProps.scanlineIntensity)],
      ["scanlineCount", new Uniform(initialProps.scanlineCount)],
      ["targetFPS", new Uniform(initialProps.targetFPS)],
      ["jitterIntensity", new Uniform(initialProps.jitterIntensity)],
      ["jitterSpeed", new Uniform(initialProps.jitterSpeed)],
      ["mouseGlowEnabled", new Uniform(initialProps.mouseGlowEnabled)],
      ["mouseGlowRadius", new Uniform(initialProps.mouseGlowRadius)],
      ["mouseGlowIntensity", new Uniform(initialProps.mouseGlowIntensity)],
      ["vignetteIntensity", new Uniform(initialProps.vignetteIntensity)],
      ["vignetteRadius", new Uniform(initialProps.vignetteRadius)],
      ["colorPalette", new Uniform(initialProps.colorPalette)],
      ["curvature", new Uniform(initialProps.curvature)],
      ["aberrationStrength", new Uniform(initialProps.aberrationStrength)],
      ["noiseIntensity", new Uniform(initialProps.noiseIntensity)],
      ["noiseScale", new Uniform(initialProps.noiseScale)],
      ["noiseSpeed", new Uniform(initialProps.noiseSpeed)],
      ["waveAmplitude", new Uniform(initialProps.waveAmplitude)],
      ["waveFrequency", new Uniform(initialProps.waveFrequency)],
      ["waveSpeed", new Uniform(initialProps.waveSpeed)],
      ["glitchIntensity", new Uniform(initialProps.glitchIntensity)],
      ["glitchFrequency", new Uniform(initialProps.glitchFrequency)],
      ["brightnessAdjust", new Uniform(initialProps.brightnessAdjust)],
      ["contrastAdjust", new Uniform(initialProps.contrastAdjust)],
    ];

    super("AsciiEffect", fragmentShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map(uniformEntries),
    });
  }

  updateUniforms(nextProps: Partial<AsciiEffectUniformProps>) {
    if (nextProps.cellSize !== undefined) {
      this.uniforms.get("cellSize")!.value = nextProps.cellSize;
    }

    if (nextProps.invert !== undefined) {
      this.uniforms.get("invert")!.value = nextProps.invert;
    }

    if (nextProps.colorMode !== undefined) {
      this.uniforms.get("colorMode")!.value = nextProps.colorMode;
    }

    if (nextProps.asciiStyle !== undefined) {
      this.uniforms.get("asciiStyle")!.value = nextProps.asciiStyle;
    }

    if (nextProps.resolution) {
      this.setVector2Uniform("resolution", nextProps.resolution);
    }

    if (nextProps.mousePos) {
      this.setVector2Uniform("mousePos", nextProps.mousePos);
    }

    const uniformKeys = Object.keys(ASCII_POST_PROCESSING_DEFAULTS) as Array<
      keyof PostProcessingSettings
    >;
    for (const key of uniformKeys) {
      if (nextProps[key] !== undefined) {
        this.uniforms.get(key)!.value = nextProps[key];
      }
    }
  }

  private setVector2Uniform(key: string, nextValue: Vector2) {
    const uniform = this.uniforms.get(key);
    if (!uniform) {
      return;
    }

    if (uniform.value instanceof Vector2) {
      uniform.value.copy(nextValue);
      return;
    }

    uniform.value = nextValue.clone();
  }

  override update(
    _renderer: WebGLRenderer,
    _inputBuffer: WebGLRenderTarget,
    deltaTime: number
  ) {
    const targetFPS = this.uniforms.get("targetFPS")!.value as number;

    if (targetFPS > 0) {
      const frameDuration = 1 / targetFPS;
      this.deltaAccumulator += deltaTime;
      if (this.deltaAccumulator >= frameDuration) {
        this.time += frameDuration;
        this.deltaAccumulator = this.deltaAccumulator % frameDuration;
      }
    } else {
      this.time += deltaTime;
    }

    this.uniforms.get("time")!.value = this.time;
  }
}

export const AsciiEffect = forwardRef<AsciiEffectImpl, AsciiEffectProps>(
  (
    {
      cellSize = COMPONENT_DEFAULT_PROPS.cellSize,
      invert = COMPONENT_DEFAULT_PROPS.invert,
      colorMode = COMPONENT_DEFAULT_PROPS.colorMode,
      style = COMPONENT_DEFAULT_PROPS.style,
      resolution = DEFAULT_RESOLUTION,
      mousePosition = DEFAULT_MOUSE_POSITION,
      postProcessing = {},
    },
    ref
  ) => {
    const resolvedPostProcessing = useMemo(
      () => normalizePostProcessing(postProcessing),
      [postProcessing]
    );

    const resolutionKey = `${resolution.x}:${resolution.y}`;
    const mouseKey = `${mousePosition.x}:${mousePosition.y}`;

    const normalizedStyle =
      typeof style === "string"
        ? (style.toLowerCase() as AsciiStyle) ?? COMPONENT_DEFAULT_PROPS.style
        : COMPONENT_DEFAULT_PROPS.style;
    const asciiStyle = STYLE_MAP[normalizedStyle] ?? STYLE_MAP.standard;

    const effect = useMemo(
      () =>
        new AsciiEffectImpl({
          cellSize,
          invert,
          colorMode,
          asciiStyle,
          resolution,
          mousePos: mousePosition,
          ...resolvedPostProcessing,
        }),
      []
    );

    useEffect(() => {
      effect.updateUniforms({
        cellSize,
        invert,
        colorMode,
        asciiStyle,
      });
    }, [cellSize, invert, colorMode, style, effect]);

    useEffect(() => {
      effect.updateUniforms(resolvedPostProcessing);
    }, [resolvedPostProcessing, effect]);

    useEffect(() => {
      effect.updateUniforms({
        resolution,
        mousePos: mousePosition,
      });
    }, [effect, resolutionKey, mouseKey, resolution, mousePosition]);

    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);

AsciiEffect.displayName = "AsciiEffect";

export type {
  AsciiStyle,
  AsciiColorPalette,
  PostProcessingSettings as AsciiPostProcessingSettings,
  PublicPostProcessingSettings as PublicAsciiPostProcessingSettings,
  AsciiEffectImpl as AsciiEffectHandle,
};
