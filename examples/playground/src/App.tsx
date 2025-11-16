"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Playground, useControls } from "@toriistudio/v0-playground";
import {
  Efecto,
  ASCII_POST_PROCESSING_DEFAULTS,
  buildAsciiEffectProps,
  type AsciiStyle,
  type AsciiBaseProps,
  type PublicAsciiPostProcessingSettings,
} from "@toriistudio/v0-efecto";

import ImageUploadControl, {
  type UploadedMedia,
} from "./components/ImageUploadControl";
import { mediaSelectionStore } from "./state/mediaSelectionStore";

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
  original: "original",
  green: "green",
  amber: "amber",
  cyan: "cyan",
  blue: "blue",
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
  brightness: {
    type: "number" as const,
    value: 1,
    min: 0,
    max: 2,
    step: 0.1,
    folder: "Media",
  },
  contrast: {
    type: "number" as const,
    value: 1,
    min: 0,
    max: 2,
    step: 0.1,
    folder: "Media",
  },
  saturation: {
    type: "number" as const,
    value: 1,
    min: 0,
    max: 2,
    step: 0.1,
    folder: "Media",
  },
} as const;

type MediaState = UploadedMedia | null;

function AsciiPlaygroundCanvas() {
  const [mediaSource, setMediaSource] = useState<MediaState>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    mediaSelectionStore.setSnapshot({
      media: mediaSource,
      error: mediaError,
    });
  }, [mediaSource, mediaError]);

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

      return jsonToComponentString({
        componentName: "Efecto",
        props: {
          ...asciiProps,
          mediaAdjustments: {
            brightness:
              typeof values.mediaBrightness === "number"
                ? values.mediaBrightness
                : 1,
            contrast:
              typeof values.mediaContrast === "number"
                ? values.mediaContrast
                : 1,
            saturation:
              typeof values.mediaSaturation === "number"
                ? values.mediaSaturation
                : 1,
          },
          mouseParallax: values.mouseParallax ?? false,
          parallaxIntensity:
            typeof values.parallaxIntensity === "number"
              ? values.parallaxIntensity
              : 0.5,
          src: "/your-image-or-video-url",
        },
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
              onSelectMedia={handleSelectMedia}
              onClear={handleClear}
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
    brightness: mediaBrightness = 1,
    contrast: mediaContrast = 1,
    saturation: mediaSaturation = 1,
    ...asciiControlValues
  } = controlValues as typeof controlValues & {
    postProcessingPreset?: PostProcessingPresetKey;
    mouseParallax?: boolean;
    parallaxIntensity?: number;
    mediaBrightness?: number;
    mediaContrast?: number;
    mediaSaturation?: number;
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

  const mediaAdjustments = useMemo(
    () => ({
      brightness: mediaBrightness,
      contrast: mediaContrast,
      saturation: mediaSaturation,
    }),
    [mediaBrightness, mediaContrast, mediaSaturation]
  );

  const { postProcessing: asciiPostProcessing, ...asciiBase } = asciiSettings;

  return (
    <Efecto
      {...asciiBase}
      postProcessing={asciiPostProcessing}
      src={mediaSource?.src}
      mediaType={mediaSource?.type}
      mouseParallax={mouseParallax}
      parallaxIntensity={parallaxIntensity}
      cameraDistance={CAMERA_DISTANCE}
      showOrbitControls
      mediaAdjustments={mediaAdjustments}
    />
  );
}

export default function Home() {
  return (
    <Playground>
      <AsciiPlaygroundCanvas />
    </Playground>
  );
}
