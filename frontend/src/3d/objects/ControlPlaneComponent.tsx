// Control Plane Component - Individual control plane tower

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { controlPlaneColors, colors } from '../constants';

interface ControlPlaneComponentProps {
  name: string;
  status: string;
  position: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
}

export function ControlPlaneComponent({
  name,
  status,
  position,
  isSelected = false,
  onClick,
}: ControlPlaneComponentProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const color = controlPlaneColors[name] || colors.apiServer;
  const isRunning = status === 'Running';

  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += 0.01;
    }
    if (glowRef.current && isRunning) {
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  const config = getComponentConfig(name);

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      <mesh ref={meshRef} castShadow>
        {config.geometry}
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={isRunning ? 0.2 : 0}
        />
      </mesh>

      <mesh ref={glowRef} scale={1.2}>
        {config.geometry}
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>

      <mesh position={[0, config.height / 2 + 0.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isRunning ? '#22c55e' : '#ef4444'} />
      </mesh>

      <Text position={[0, -0.4, 0]} fontSize={0.15} color="#e2e8f0" anchorX="center">
        {formatName(name)}
      </Text>
    </group>
  );
}

function getComponentConfig(name: string) {
  const configs: Record<string, { geometry: JSX.Element; height: number }> = {
    'kube-apiserver': { geometry: <boxGeometry args={[0.6, 2, 0.6]} />, height: 2 },
    'etcd': { geometry: <cylinderGeometry args={[0.3, 0.4, 1.5, 8]} />, height: 1.5 },
    'kube-scheduler': { geometry: <coneGeometry args={[0.4, 1.2, 4]} />, height: 1.2 },
    'kube-controller-manager': { geometry: <boxGeometry args={[0.5, 1.2, 0.5]} />, height: 1.2 },
    'cloud-controller-manager': { geometry: <sphereGeometry args={[0.4, 16, 16]} />, height: 0.8 },
  };
  return configs[name] || { geometry: <boxGeometry args={[0.4, 0.8, 0.4]} />, height: 0.8 };
}

function formatName(name: string): string {
  return name.replace('kube-', '').replace('-manager', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default ControlPlaneComponent;
