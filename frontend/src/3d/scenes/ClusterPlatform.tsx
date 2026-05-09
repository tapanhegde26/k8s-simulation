// Cluster Platform - The floating base platform

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors } from '../constants';

interface ClusterPlatformProps {
  radius?: number;
}

export function ClusterPlatform({ radius = 15 }: ClusterPlatformProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      glowRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Main platform - hexagonal shape */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.1, 0.3, 6]} />
        <meshStandardMaterial
          color={colors.platform}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Platform top surface with grid pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <circleGeometry args={[radius - 0.5, 6]} />
        <meshStandardMaterial
          color={colors.grid}
          metalness={0.5}
          roughness={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Glowing edge ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[radius - 0.3, radius, 6]} />
        <meshBasicMaterial
          color={colors.glow}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Animated outer ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <ringGeometry args={[radius + 0.5, radius + 0.8, 32]} />
        <meshBasicMaterial
          color={colors.particle}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid lines */}
      <GridLines radius={radius} />
    </group>
  );
}

function GridLines({ radius }: { radius: number }) {
  const lines: JSX.Element[] = [];
  const gridSize = 2;
  const count = Math.floor(radius / gridSize) * 2;

  for (let i = -count / 2; i <= count / 2; i++) {
    const pos = i * gridSize;
    const length = Math.sqrt(radius * radius - Math.min(pos * pos, radius * radius - 1));
    
    if (length > 0) {
      lines.push(
        <mesh key={`h-${i}`} position={[0, 0.17, pos]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[length * 2, 0.02]} />
          <meshBasicMaterial color={colors.glow} transparent opacity={0.15} />
        </mesh>
      );
      lines.push(
        <mesh key={`v-${i}`} position={[pos, 0.17, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[length * 2, 0.02]} />
          <meshBasicMaterial color={colors.glow} transparent opacity={0.15} />
        </mesh>
      );
    }
  }

  return <group>{lines}</group>;
}

export default ClusterPlatform;
