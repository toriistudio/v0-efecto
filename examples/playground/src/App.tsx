"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Playground, useControls } from "@toriistudio/v0-playground";

import {
  ASCII_POST_PROCESSING_DEFAULTS,
  AsciiScene,
  FloatingTorus,
  buildAsciiEffectProps,
  ImageUploadControl,
  UploadedImage,
  UploadedVideo,
  type AsciiStyle,
  type UploadedMedia,
  type AsciiBaseProps,
  type PublicAsciiPostProcessingSettings,
} from "@toriistudio/v0-efecto";

const CAMERA_DISTANCE = 5;

type CopyButtonHandlerArgs = {
  values: Record<string, any>;
  jsonToComponentString: (options: {
    componentName?: string;
    props: Record<string, unknown>;
  }) => string;
};

const STYLE_OPTIONS: Record<AsciiStyle, string> = {
  standard: "Standard",
  dense: "Dense",
  minimal: "Minimal",
  blocks: "Blocks",
};

const POST_PROCESSING_PRESETS = {
  none: {
    scanlineIntensity: 0,
    targetFPS: 0,
    jitterIntensity: 0,
    mouseGlowEnabled: false,
    vignetteIntensity: 0,
    colorPalette: "original",
    curvature: 0,
    aberrationStrength: 0,
    noiseIntensity: 0,
    waveAmplitude: 0,
    glitchIntensity: 0,
    brightnessAdjust: 0,
    contrastAdjust: 1,
  },
  crt: {
    scanlineIntensity: 0.3,
    scanlineCount: 300,
    vignetteIntensity: 0.4,
    vignetteRadius: 0.7,
    curvature: 0.15,
    colorPalette: "original",
    brightnessAdjust: 0.1,
    contrastAdjust: 1.2,
  },
  terminal: {
    scanlineIntensity: 0.2,
    scanlineCount: 400,
    jitterIntensity: 0.05,
    jitterSpeed: 2,
    colorPalette: "green",
    noiseIntensity: 0.1,
    noiseScale: 2,
    vignetteIntensity: 0.3,
  },
  glitch: {
    jitterIntensity: 0.3,
    jitterSpeed: 5,
    glitchIntensity: 0.03,
    glitchFrequency: 2,
    aberrationStrength: 0.005,
    noiseIntensity: 0.2,
    targetFPS: 15,
  },
  retro: {
    scanlineIntensity: 0.4,
    scanlineCount: 250,
    curvature: 0.2,
    vignetteIntensity: 0.5,
    aberrationStrength: 0.003,
    colorPalette: "amber",
    brightnessAdjust: 0.15,
    contrastAdjust: 1.3,
  },
} satisfies Record<string, Partial<PublicAsciiPostProcessingSettings>>;

type PostProcessingPresetKey = keyof typeof POST_PROCESSING_PRESETS;

const POST_PROCESSING_PRESET_OPTIONS: Record<PostProcessingPresetKey, string> =
  {
    none: "None",
    crt: "CRT",
    terminal: "Terminal",
    glitch: "Glitch",
    retro: "Retro",
  };

const COLOR_PALETTE_OPTIONS = {
  Original: "original",
  Green: "green",
  Amber: "amber",
  Cyan: "cyan",
  Blue: "blue",
};

const ASCII_EFFECT_BASE_PROPS: AsciiBaseProps = {
  cellSize: 8,
  invert: false,
  colorMode: true,
  style: "standard",
};

const ASCII_CONTROL_SCHEMA = {
  style: {
    type: "select" as const,
    value: ASCII_EFFECT_BASE_PROPS.style,
    options: STYLE_OPTIONS,
    folder: "Basic",
  },
  cellSize: {
    type: "number" as const,
    value: ASCII_EFFECT_BASE_PROPS.cellSize,
    min: 4,
    max: 24,
    step: 1,
    folder: "Basic",
  },
  invert: {
    type: "boolean" as const,
    value: ASCII_EFFECT_BASE_PROPS.invert,
    folder: "Basic",
  },
  colorMode: {
    type: "boolean" as const,
    value: ASCII_EFFECT_BASE_PROPS.colorMode,
    folder: "Basic",
  },
  mouseParallax: {
    type: "boolean" as const,
    value: false,
    folder: "Mouse Parallax",
  },
  parallaxIntensity: {
    type: "number" as const,
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Mouse Parallax",
  },
  postProcessingPreset: {
    type: "select" as const,
    value: "none",
    options: POST_PROCESSING_PRESET_OPTIONS,
    folder: "Post-Processing",
  },
  colorPalette: {
    type: "select" as const,
    value: "original",
    options: COLOR_PALETTE_OPTIONS,
    folder: "Display",
  },
  scanlineIntensity: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.scanlineIntensity,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Display",
  },
  scanlineCount: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.scanlineCount,
    min: 100,
    max: 1000,
    step: 10,
    folder: "Display",
  },
  vignetteIntensity: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.vignetteIntensity,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Display",
  },
  vignetteRadius: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.vignetteRadius,
    min: 0.5,
    max: 1.5,
    step: 0.01,
    folder: "Display",
  },
  curvature: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.curvature,
    min: 0,
    max: 0.5,
    step: 0.01,
    folder: "Distortion",
  },
  aberrationStrength: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.aberrationStrength,
    min: 0,
    max: 0.01,
    step: 0.0005,
    folder: "Distortion",
  },
  targetFPS: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.targetFPS,
    min: 0,
    max: 60,
    step: 1,
    folder: "Animation",
  },
  jitterIntensity: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.jitterIntensity,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Animation",
  },
  jitterSpeed: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.jitterSpeed,
    min: 0,
    max: 10,
    step: 0.05,
    folder: "Animation",
  },
  waveAmplitude: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.waveAmplitude,
    min: 0,
    max: 0.1,
    step: 0.001,
    folder: "Animation",
  },
  waveFrequency: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.waveFrequency,
    min: 0.5,
    max: 20,
    step: 0.1,
    folder: "Animation",
  },
  waveSpeed: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.waveSpeed,
    min: 0,
    max: 5,
    step: 0.01,
    folder: "Animation",
  },
  noiseIntensity: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.noiseIntensity,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Noise",
  },
  noiseScale: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.noiseScale,
    min: 0.1,
    max: 10,
    step: 0.1,
    folder: "Noise",
  },
  noiseSpeed: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.noiseSpeed,
    min: 0,
    max: 5,
    step: 0.1,
    folder: "Noise",
  },
  glitchIntensity: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.glitchIntensity,
    min: 0,
    max: 0.05,
    step: 0.001,
    folder: "Noise",
  },
  glitchFrequency: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.glitchFrequency,
    min: 0,
    max: 10,
    step: 0.1,
    folder: "Noise",
  },
  mouseGlowEnabled: {
    type: "boolean" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.mouseGlowEnabled,
    folder: "Interactive",
  },
  mouseGlowRadius: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.mouseGlowRadius,
    min: 50,
    max: 500,
    step: 10,
    folder: "Interactive",
  },
  mouseGlowIntensity: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.mouseGlowIntensity,
    min: 0,
    max: 3,
    step: 0.1,
    folder: "Interactive",
  },
  brightnessAdjust: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.brightnessAdjust,
    min: -0.5,
    max: 0.5,
    step: 0.01,
    folder: "Color",
  },
  contrastAdjust: {
    type: "number" as const,
    value: ASCII_POST_PROCESSING_DEFAULTS.contrastAdjust,
    min: 0.5,
    max: 2,
    step: 0.01,
    folder: "Color",
  },
} as const;

type MediaState = UploadedMedia | null;

function AsciiPlaygroundCanvas() {
  const [mediaSource, setMediaSource] = useState<MediaState>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const handleSelectMedia = useCallback((media: UploadedMedia) => {
    setMediaError(null);
    setMediaSource(media);
  }, []);

  const handleClear = useCallback(() => {
    setMediaSource(null);
    setMediaError(null);
  }, []);

  const showCopyButtonFn = useCallback(
    ({ values, jsonToComponentString }: CopyButtonHandlerArgs) => {
      const asciiProps = buildAsciiEffectProps(values, ASCII_EFFECT_BASE_PROPS);
      const props: Record<string, unknown> = {
        ...asciiProps,
        mouseParallax: values.mouseParallax ?? false,
        parallaxIntensity:
          typeof values.parallaxIntensity === "number"
            ? values.parallaxIntensity
            : 0.5,
        src: mediaSource?.src ?? "/your-image-or-video-url",
      };

      if (mediaSource?.src) {
        props.src = mediaSource.src;
      }

      return jsonToComponentString({
        componentName: "Efecto",
        props,
      });
    },
    [mediaSource]
  );

  const controlsSchema = useMemo(
    () =>
      ({
        contentImage: {
          type: "button" as const,
          folder: "Input Source",
          render: () => (
            <ImageUploadControl
              media={mediaSource}
              onSelectMedia={handleSelectMedia}
              onClear={handleClear}
              error={mediaError}
            />
          ),
        },
        ...ASCII_CONTROL_SCHEMA,
      } as typeof ASCII_CONTROL_SCHEMA & {
        contentImage: {
          type: "button";
          folder: string;
          render: () => ReactNode;
        };
      }),
    [handleClear, handleSelectMedia, mediaSource]
  );

  const controlsResult = useControls(controlsSchema, {
    componentName: "AsciiEffect",
    config: {
      mainLabel: "ASCII Controls",
      showGrid: false,
      showCopyButton: true,
      showCodeSnippet: true,
      showCopyButtonFn,
    },
  });

  const {
    setValue,
    controls: _controlsMeta,
    schema: _schema,
    jsx: _jsx,
    ...controlValues
  } = controlsResult;

  const {
    postProcessingPreset = "none",
    mouseParallax = false,
    parallaxIntensity = 0.5,
    ...asciiControlValues
  } = controlValues as typeof controlValues & {
    postProcessingPreset?: PostProcessingPresetKey;
    mouseParallax?: boolean;
    parallaxIntensity?: number;
  };

  const setValueRef = useRef(setValue);
  useEffect(() => {
    setValueRef.current = setValue;
  }, [setValue]);

  const controlValuesRef = useRef(controlValues);
  useEffect(() => {
    controlValuesRef.current = controlValues;
  }, [controlValues]);

  useEffect(() => {
    const preset = POST_PROCESSING_PRESETS[postProcessingPreset];
    if (!preset) {
      return;
    }

    const latestValues = controlValuesRef.current as Record<string, any>;
    const setter = setValueRef.current;
    Object.entries(preset).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      if (latestValues[key] === value) {
        return;
      }
      setter(key, value);
    });
  }, [postProcessingPreset]);

  const asciiSettings = buildAsciiEffectProps(
    asciiControlValues,
    ASCII_EFFECT_BASE_PROPS
  );

  const handleVideoError = useCallback((message: string) => {
    setMediaError(message);
    setMediaSource(null);
  }, []);

  const content: ReactNode = mediaSource ? (
    mediaSource.type === "video" ? (
      <UploadedVideo
        src={mediaSource.src}
        mouseParallax={mouseParallax}
        parallaxIntensity={parallaxIntensity}
        onPlaybackError={handleVideoError}
      />
    ) : (
      <UploadedImage
        src={mediaSource.src}
        mouseParallax={mouseParallax}
        parallaxIntensity={parallaxIntensity}
      />
    )
  ) : (
    <FloatingTorus
      mouseParallax={mouseParallax}
      parallaxIntensity={parallaxIntensity}
    />
  );

  return (
    <Canvas camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 50 }}>
      <AsciiScene settings={asciiSettings}>{content}</AsciiScene>
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}

export default function Home() {
  return (
    <Playground>
      <AsciiPlaygroundCanvas />
    </Playground>
  );
}
