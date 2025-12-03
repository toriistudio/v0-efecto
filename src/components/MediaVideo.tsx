"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture } from "@react-three/drei";
import { DoubleSide, Mesh, ShaderMaterial, Texture, Vector2 } from "three";

import {
  resolveMediaAdjustments,
  MEDIA_ADJUSTMENT_DEFAULTS,
  type MediaAdjustments,
} from "@/components/mediaAdjustments";
import {
  MEDIA_ADJUST_FRAGMENT_SHADER,
  MEDIA_ADJUST_VERTEX_SHADER,
} from "@/shaders/mediaAdjustments";

type MediaVideoProps = {
  src: string;
  mouseParallax?: boolean;
  parallaxIntensity?: number;
  onPlaybackError?: (message: string) => void;
  adjustments?: MediaAdjustments;
  loop?: boolean;
  playbackSpeed?: number;
};

export default function MediaVideo({
  src,
  mouseParallax = false,
  parallaxIntensity = 0.5,
  onPlaybackError,
  adjustments,
  loop = true,
  playbackSpeed = 1,
}: MediaVideoProps) {
  const texture = useVideoTexture(src, {
    autoplay: true,
    loop,
    muted: true,
    playsInline: true,
    start: true,
    crossOrigin: "anonymous",
  });

  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const viewport = useThree((state) => state.viewport);
  const [aspect, setAspect] = useState(16 / 9);

  useEffect(() => {
    const video = texture.image as HTMLVideoElement | undefined;
    if (!video) {
      onPlaybackError?.("Video source is unavailable.");
      return;
    }

    let cancelled = false;

    const updateAspect = () => {
      if (video.videoHeight > 0) {
        setAspect(video.videoWidth / video.videoHeight);
      }
    };

    const handlePlaybackError = (message: string) => {
      if (cancelled) return;
      onPlaybackError?.(message);
    };

    const handleLoaded = () => {
      if (cancelled) {
        return;
      }
      updateAspect();
      video
        .play()
        .catch(() =>
          handlePlaybackError("Unable to start video playback automatically.")
        );
    };

    const handleError = () => {
      handlePlaybackError("Failed to load the selected video.");
    };

    if (video.readyState >= 2) {
      handleLoaded();
    } else {
      video.addEventListener("loadeddata", handleLoaded);
    }
    video.addEventListener("loadedmetadata", updateAspect);
    video.addEventListener("error", handleError);

    const timeout = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      if (video.readyState < 2) {
        handlePlaybackError("Video is taking too long to load.");
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      video.pause();
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("loadedmetadata", updateAspect);
      video.removeEventListener("error", handleError);
    };
  }, [texture, onPlaybackError]);

  useEffect(() => {
    const video = texture.image as HTMLVideoElement | undefined;
    if (!video) {
      return;
    }
    video.loop = loop;
    const clampedPlayback = Math.min(Math.max(playbackSpeed, 0), 1);
    video.playbackRate = clampedPlayback;
  }, [loop, playbackSpeed, texture]);

  const shaderUniforms = useMemo(
    () => ({
      map: { value: null as Texture | null },
      brightness: { value: MEDIA_ADJUSTMENT_DEFAULTS.brightness },
      contrast: { value: MEDIA_ADJUSTMENT_DEFAULTS.contrast },
      saturation: { value: MEDIA_ADJUSTMENT_DEFAULTS.saturation },
      uvScale: { value: new Vector2(1, 1) },
      uvOffset: { value: new Vector2(0, 0) },
    }),
    []
  );

  useEffect(() => {
    shaderUniforms.map.value = texture;
    if (materialRef.current) {
      materialRef.current.uniforms.map.value = texture;
    }
  }, [shaderUniforms, texture]);

  const resolvedAdjustments = useMemo(
    () => resolveMediaAdjustments(adjustments),
    [adjustments]
  );

  const { brightness, contrast, saturation } = resolvedAdjustments;

  useEffect(() => {
    shaderUniforms.brightness.value = brightness;
    shaderUniforms.contrast.value = contrast;
    shaderUniforms.saturation.value = saturation;
    if (materialRef.current) {
      materialRef.current.uniforms.brightness.value = brightness;
      materialRef.current.uniforms.contrast.value = contrast;
      materialRef.current.uniforms.saturation.value = saturation;
    }
  }, [brightness, contrast, saturation, shaderUniforms]);

  const { width: viewWidth, height: viewHeight } = viewport;
  const { width, height } = useMemo(() => {
    const viewportRatio = viewWidth / viewHeight;
    const videoRatio = aspect;

    if (videoRatio > viewportRatio) {
      const planeWidth = viewWidth;
      const planeHeight = planeWidth / videoRatio;
      return { width: planeWidth, height: planeHeight };
    }

    const planeHeight = viewHeight;
    const planeWidth = planeHeight * videoRatio;
    return { width: planeWidth, height: planeHeight };
  }, [aspect, viewHeight, viewWidth]);

  useEffect(() => {
    const videoEl = texture.image as HTMLVideoElement | undefined;
    const textureAspect =
      videoEl && videoEl.videoHeight > 0
        ? videoEl.videoWidth / videoEl.videoHeight
        : aspect;

    if (!textureAspect || width === 0 || height === 0) {
      return;
    }

    const planeAspect = width / height;
    let scaleX = 1;
    let scaleY = 1;

    if (textureAspect > planeAspect) {
      scaleX = textureAspect / planeAspect;
    } else {
      scaleY = planeAspect / textureAspect;
    }

    const uvScaleX = 1 / scaleX;
    const uvScaleY = 1 / scaleY;
    const offsetX = (1 - uvScaleX) * 0.5;
    const offsetY = (1 - uvScaleY) * 0.5;
    shaderUniforms.uvScale.value.set(uvScaleX, uvScaleY);
    shaderUniforms.uvOffset.value.set(offsetX, offsetY);
    if (materialRef.current) {
      (materialRef.current.uniforms.uvScale.value as Vector2).set(
        uvScaleX,
        uvScaleY
      );
      (materialRef.current.uniforms.uvOffset.value as Vector2).set(
        offsetX,
        offsetY
      );
    }
  }, [aspect, height, shaderUniforms, texture, width]);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }
    if (!mouseParallax) {
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.y = 0;
      return;
    }
    const intensity = Math.min(Math.max(parallaxIntensity, 0), 1);
    const targetY = 0.3 * state.pointer.x * intensity;
    const targetX = 0.2 * state.pointer.y * intensity;
    meshRef.current.rotation.y += (targetY - meshRef.current.rotation.y) * 0.1;
    meshRef.current.rotation.x += (targetX - meshRef.current.rotation.x) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={shaderUniforms}
        vertexShader={MEDIA_ADJUST_VERTEX_SHADER}
        fragmentShader={MEDIA_ADJUST_FRAGMENT_SHADER}
        toneMapped={false}
        transparent
        side={DoubleSide}
      />
    </mesh>
  );
}
