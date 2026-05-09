// Scaling Animation - Building growing/shrinking animation

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ScalingAnimationProps {
  targetScale: number;
  position: [number, number, number];
  isActive: boolean;
  onComplete?: () => void;
}

export function ScalingAnimation({
  targetScale,
  position,
  isActive,
  onComplete,
}: ScalingAnimationProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentScale = useRef(1);

  useEffect(() => {
    if (isActive) {
      currentScale.current = 1;
    }
  }, [isActive]);

  useFrame(() => {
    if (!isActive || !meshRef.current) return;

    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, 0.05);
    meshRef.current.scale.setScalar(currentScale.current);

    if (Math.abs(currentScale.current - targetScale) < 0.01) {
      onComplete?.();
    }
  });

  if (!isActive) return null;

  return (
    <mesh ref={meshRef} position={position}>
      <ringGeometry args={[1, 1.2, 32]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default ScalingAnimation;
