"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { AsciiScene, type AsciiBaseProps } from "@/components/AsciiScene";
import {
  ASCII_POST_PROCESSING_DEFAULTS,
  type PublicAsciiPostProcessingSettings,
} from "@/components/AsciiEffect";
import FloatingTorus from "@/components/FloatingTorus";
import MediaImage from "@/components/MediaImage";
import MediaVideo from "@/components/MediaVideo";
import { type MediaAdjustments } from "@/components/mediaAdjustments";

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".ogv",
  ".mov",
  ".m4v",
] as const;

const inferMediaType = (source?: string): "image" | "video" => {
  if (!source) {
    return "image";
  }

  try {
    const url = new URL(source);
    source = url.pathname;
  } catch {
    // Ignore parsing errors for relative/data URIs.
  }

  const sanitized = source.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  const isVideo = VIDEO_EXTENSIONS.some((ext) => sanitized.endsWith(ext));
  return isVideo ? "video" : "image";
};

const DEFAULT_ASCII_BASE: AsciiBaseProps = {
  cellSize: 6,
  invert: false,
  colorMode: true,
  style: "standard",
};

const DEFAULT_POST_PROCESSING: PublicAsciiPostProcessingSettings = {
  scanlineIntensity: ASCII_POST_PROCESSING_DEFAULTS.scanlineIntensity,
  scanlineCount: ASCII_POST_PROCESSING_DEFAULTS.scanlineCount,
  targetFPS: ASCII_POST_PROCESSING_DEFAULTS.targetFPS,
  jitterIntensity: ASCII_POST_PROCESSING_DEFAULTS.jitterIntensity,
  jitterSpeed: ASCII_POST_PROCESSING_DEFAULTS.jitterSpeed,
  mouseGlowEnabled: ASCII_POST_PROCESSING_DEFAULTS.mouseGlowEnabled,
  mouseGlowRadius: ASCII_POST_PROCESSING_DEFAULTS.mouseGlowRadius,
  mouseGlowIntensity: ASCII_POST_PROCESSING_DEFAULTS.mouseGlowIntensity,
  vignetteIntensity: ASCII_POST_PROCESSING_DEFAULTS.vignetteIntensity,
  vignetteRadius: ASCII_POST_PROCESSING_DEFAULTS.vignetteRadius,
  colorPalette: "original",
  curvature: ASCII_POST_PROCESSING_DEFAULTS.curvature,
  aberrationStrength: ASCII_POST_PROCESSING_DEFAULTS.aberrationStrength,
  noiseIntensity: ASCII_POST_PROCESSING_DEFAULTS.noiseIntensity,
  noiseScale: ASCII_POST_PROCESSING_DEFAULTS.noiseScale,
  noiseSpeed: ASCII_POST_PROCESSING_DEFAULTS.noiseSpeed,
  waveAmplitude: ASCII_POST_PROCESSING_DEFAULTS.waveAmplitude,
  waveFrequency: ASCII_POST_PROCESSING_DEFAULTS.waveFrequency,
  waveSpeed: ASCII_POST_PROCESSING_DEFAULTS.waveSpeed,
  glitchIntensity: ASCII_POST_PROCESSING_DEFAULTS.glitchIntensity,
  glitchFrequency: ASCII_POST_PROCESSING_DEFAULTS.glitchFrequency,
  brightnessAdjust: ASCII_POST_PROCESSING_DEFAULTS.brightnessAdjust,
  contrastAdjust: ASCII_POST_PROCESSING_DEFAULTS.contrastAdjust,
};

export type EfectoProps = Partial<AsciiBaseProps> & {
  postProcessing?: Partial<PublicAsciiPostProcessingSettings>;
  src?: string;
  mediaType?: "image" | "video";
  mouseParallax?: boolean;
  parallaxIntensity?: number;
  cameraDistance?: number;
  showOrbitControls?: boolean;
  mediaAdjustments?: MediaAdjustments;
};

export default function Efecto({
  cellSize = DEFAULT_ASCII_BASE.cellSize,
  invert = DEFAULT_ASCII_BASE.invert,
  colorMode = DEFAULT_ASCII_BASE.colorMode,
  style = DEFAULT_ASCII_BASE.style,
  postProcessing,
  src,
  mediaType,
  mouseParallax = false,
  parallaxIntensity = 0.5,
  cameraDistance = 5,
  showOrbitControls = false,
  mediaAdjustments,
}: EfectoProps) {
  const asciiSettings = {
    cellSize,
    invert,
    colorMode,
    style,
    postProcessing: {
      ...DEFAULT_POST_PROCESSING,
      ...postProcessing,
    },
  };

  let content = (
    <FloatingTorus
      mouseParallax={mouseParallax}
      parallaxIntensity={parallaxIntensity}
    />
  );

  if (src) {
    const resolvedMediaType = mediaType ?? inferMediaType(src);
    content =
      resolvedMediaType === "video" ? (
        <MediaVideo
          src={src}
          mouseParallax={mouseParallax}
          parallaxIntensity={parallaxIntensity}
          adjustments={mediaAdjustments}
        />
      ) : (
        <MediaImage
          src={src}
          mouseParallax={mouseParallax}
          parallaxIntensity={parallaxIntensity}
          adjustments={mediaAdjustments}
        />
      );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, cameraDistance], fov: 50 }}
      gl={{ alpha: true }}
      style={{ background: "transparent" }}
    >
      <AsciiScene settings={asciiSettings}>{content}</AsciiScene>
      {showOrbitControls ? <OrbitControls enablePan={false} /> : null}
    </Canvas>
  );
}
