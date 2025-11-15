"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture } from "@react-three/drei";
import { Mesh } from "three";

type UploadedVideoProps = {
  src: string;
  mouseParallax?: boolean;
  parallaxIntensity?: number;
  onPlaybackError?: (message: string) => void;
};

export default function UploadedVideo({
  src,
  mouseParallax = false,
  parallaxIntensity = 0.5,
  onPlaybackError,
}: UploadedVideoProps) {
  const texture = useVideoTexture(src, {
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    start: true,
    crossOrigin: "anonymous",
  });

  const meshRef = useRef<Mesh>(null);
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
      <meshBasicMaterial map={texture} toneMapped={false} side={2} />
    </mesh>
  );
}
