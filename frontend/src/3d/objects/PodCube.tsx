// Pod Cube - Represents a pod as a glowing cube

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Pod3D } from '../types';
import { podPhaseColors, colors } from '../constants';

interface PodCubeProps {
  pod: Pod3D;
  localPosition?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
}

export function PodCube({
  pod,
  localPosition = [0, 0, 0],
  isSelected = false,
  onClick,
}: PodCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [scale, setScale] = useState(0);

  const phaseColor = podPhaseColors[pod.phase] || colors.podTerminating;
  const size = 0.25;

  useEffect(() => {
    setScale(0);
    const timeout = setTimeout(() => setScale(1), 100);
    return () => clearTimeout(timeout);
  }, [pod.id]);

  useFrame((state) => {
    if (meshRef.current) {
      const targetScale = isSelected || hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale * scale, targetScale * scale, targetScale * scale),
        0.1
      );

      if (pod.phase === 'Pending') {
        const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        meshRef.current.scale.multiplyScalar(pulse);
      }

      if (pod.phase === 'Failed') {
        const flicker = Math.random() > 0.95 ? 0.7 : 1;
        meshRef.current.scale.multiplyScalar(flicker);
      }
    }

    if (glowRef.current) {
      const glowPulse = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowPulse;
    }
  });

  const isTerminating = pod.phase === 'Terminating';
  const opacity = isTerminating ? 0.5 : 1;

  return (
    <group
      position={localPosition}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Main pod cube */}
      <RoundedBox
        ref={meshRef}
        args={[size, size, size]}
        radius={0.03}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial
          color={phaseColor}
          metalness={0.4}
          roughness={0.6}
          emissive={phaseColor}
          emissiveIntensity={0.3}
          transparent
          opacity={opacity}
        />
      </RoundedBox>

      {/* Glow effect */}
      <mesh ref={glowRef} scale={1.3}>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial
          color={phaseColor}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Container spheres inside (if zoomed in enough) */}
      {pod.containerCount > 1 && (
        <ContainerSpheres count={pod.containerCount} size={size} />
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -size / 2 - 0.02, 0]}>
          <ringGeometry args={[size * 0.6, size * 0.8, 16]} />
          <meshBasicMaterial
            color={colors.selection}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Phase indicator light */}
      <pointLight
        position={[0, size / 2, 0]}
        color={phaseColor}
        intensity={0.3}
        distance={1}
      />
    </group>
  );
}

interface ContainerSpheresProps {
  count: number;
  size: number;
}

function ContainerSpheres({ count, size }: ContainerSpheresProps) {
  const sphereSize = size * 0.15;
  const positions: [number, number, number][] = [];
  
  for (let i = 0; i < Math.min(count, 4); i++) {
    const angle = (i / Math.min(count, 4)) * Math.PI * 2;
    const radius = size * 0.2;
    positions.push([
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius,
    ]);
  }

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[sphereSize, 8, 8]} />
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#60a5fa"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </>
  );
}

export default PodCube;
