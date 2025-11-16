"use client";

import { useEffect, useMemo, useRef } from "react";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Mesh, ShaderMaterial, Texture, TextureLoader, Vector2 } from "three";

import {
  MEDIA_ADJUST_FRAGMENT_SHADER,
  MEDIA_ADJUST_VERTEX_SHADER,
} from "@/shaders/mediaAdjustments";
import {
  resolveMediaAdjustments,
  MEDIA_ADJUSTMENT_DEFAULTS,
  type MediaAdjustments,
} from "@/components/mediaAdjustments";

type UploadedImageProps = {
  src: string;
  mouseParallax?: boolean;
  parallaxIntensity?: number;
  adjustments?: MediaAdjustments;
};

export default function UploadedImage({
  src,
  mouseParallax = false,
  parallaxIntensity = 0.5,
  adjustments,
}: UploadedImageProps) {
  const texture = useLoader(TextureLoader, src);
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
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
  }, [texture, shaderUniforms]);

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

  useEffect(() => {
    const image = texture.image as
      | {
          width: number;
          height: number;
        }
      | undefined;

    if (!image || image.height === 0 || height === 0 || width === 0) {
      return;
    }

    const imageAspect = image.width / image.height;
    const planeAspect = width / height;
    let scaleX = 1;
    let scaleY = 1;

    if (imageAspect > planeAspect) {
      scaleX = imageAspect / planeAspect;
    } else {
      scaleY = planeAspect / imageAspect;
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
  }, [height, shaderUniforms, texture, width]);

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
      />
    </mesh>
  );
}
