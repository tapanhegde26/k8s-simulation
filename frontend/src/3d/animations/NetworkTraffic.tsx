// Network Traffic - Particle flow on service connections

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors } from '../constants';

interface NetworkTrafficProps {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  isActive?: boolean;
  color?: string;
  particleCount?: number;
}

export function NetworkTraffic({
  startPosition,
  endPosition,
  isActive = true,
  color = colors.particle,
  particleCount = 20,
}: NetworkTrafficProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const progress = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      progress[i] = Math.random();
    }

    return { positions, progress };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !isActive) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      particles.progress[i] += delta * 0.5;
      if (particles.progress[i] > 1) particles.progress[i] = 0;

      const t = particles.progress[i];
      positions[i * 3] = THREE.MathUtils.lerp(startPosition[0], endPosition[0], t);
      positions[i * 3 + 1] = THREE.MathUtils.lerp(startPosition[1], endPosition[1], t) + Math.sin(t * Math.PI) * 0.5;
      positions[i * 3 + 2] = THREE.MathUtils.lerp(startPosition[2], endPosition[2], t);
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isActive) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.1}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default NetworkTraffic;
