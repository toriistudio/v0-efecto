import { useRef } from "react";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

type FloatingTorusProps = {
  mouseParallax?: boolean;
  parallaxIntensity?: number;
};

export default function FloatingTorus({
  mouseParallax = false,
  parallaxIntensity = 0.5,
}: FloatingTorusProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    if (mouseParallax) {
      const intensity = Math.min(Math.max(parallaxIntensity, 0), 1);
      const targetY = 0.3 * state.pointer.x * intensity;
      const targetX = 0.2 * state.pointer.y * intensity;
      meshRef.current.rotation.y +=
        (targetY - meshRef.current.rotation.y) * 0.1;
      meshRef.current.rotation.x +=
        (targetX - meshRef.current.rotation.x) * 0.1;
      return;
    }

    const { elapsedTime } = state.clock;
    meshRef.current.rotation.x = elapsedTime * 0.35;
    meshRef.current.rotation.y = elapsedTime * 0.5;
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <torusKnotGeometry args={[1, 0.35, 256, 64]} />
      <meshStandardMaterial color="#f4f0ff" metalness={0.15} roughness={0.35} />
    </mesh>
  );
}
