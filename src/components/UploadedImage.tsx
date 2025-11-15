"use client";

import { useMemo, useRef } from "react";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Mesh, TextureLoader } from "three";

type UploadedImageProps = {
  src: string;
  mouseParallax?: boolean;
  parallaxIntensity?: number;
};

export default function UploadedImage({
  src,
  mouseParallax = false,
  parallaxIntensity = 0.5,
}: UploadedImageProps) {
  const texture = useLoader(TextureLoader, src);
  const meshRef = useRef<Mesh>(null);
  const viewport = useThree((state) => state.viewport);

  const aspect = useMemo(() => {
    const image = texture.image as { width: number; height: number } | undefined;
    if (image && image.height > 0) {
      return image.width / image.height;
    }
    return 1;
  }, [texture]);

  const { width: viewWidth, height: viewHeight } = viewport;

  const { width, height } = useMemo(() => {
    let planeWidth = viewWidth;
    let planeHeight = viewWidth / aspect;

    if (planeHeight < viewHeight) {
      planeHeight = viewHeight;
      planeWidth = viewHeight * aspect;
    }

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
      <meshBasicMaterial map={texture} toneMapped={false} transparent />
    </mesh>
  );
}
