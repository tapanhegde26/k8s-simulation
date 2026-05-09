// Control Plane Island - Central control plane visualization

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { ControlPlaneComponent3D } from '../types';
import { controlPlaneColors, colors } from '../constants';

interface ControlPlaneIslandProps {
  components: ControlPlaneComponent3D[];
  onSelectComponent?: (name: string) => void;
  selectedComponent?: string | null;
}

export function ControlPlaneIsland({
  components,
  onSelectComponent,
  selectedComponent,
}: ControlPlaneIslandProps) {
  return (
    <group position={[0, 0, -12]}>
      {/* Base platform for control plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5.5, 0.2, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Glowing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]}>
        <ringGeometry args={[4.8, 5, 32]} />
        <meshBasicMaterial color={colors.apiServer} transparent opacity={0.5} />
      </mesh>

      {/* Control plane components */}
      {components.map((component) => (
        <ControlPlaneTower
          key={component.name}
          component={component}
          isSelected={selectedComponent === component.name}
          onClick={() => onSelectComponent?.(component.name)}
        />
      ))}

      {/* Connection lines between components */}
      <ConnectionLines components={components} />

      {/* Label */}
      <Text
        position={[0, 4, 0]}
        fontSize={0.4}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        Control Plane
      </Text>
    </group>
  );
}

interface ControlPlaneTowerProps {
  component: ControlPlaneComponent3D;
  isSelected: boolean;
  onClick: () => void;
}

function ControlPlaneTower({ component, isSelected, onClick }: ControlPlaneTowerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const color = controlPlaneColors[component.name] || colors.apiServer;
  const isRunning = component.status === 'Running';

  const towerConfig = getTowerConfig(component.name);

  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += 0.01;
    }
    if (glowRef.current && isRunning) {
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      if (material && 'opacity' in material) {
        material.opacity = pulse;
      }
    }
  });

  const localPosition: [number, number, number] = [
    component.position[0],
    component.position[1] - (-12),
    component.position[2] - (-12),
  ];

  return (
    <group position={localPosition}>
      {/* Tower base */}
      <mesh
        ref={meshRef}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {towerConfig.geometry}
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={isRunning ? 0.2 : 0}
        />
      </mesh>

      {/* Glow effect */}
      <mesh ref={glowRef} scale={1.2}>
        {towerConfig.geometry}
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Status beacon */}
      <mesh position={[0, towerConfig.height / 2 + 0.2, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={isRunning ? '#22c55e' : '#ef4444'}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, -0.5, 0.5]}
        fontSize={0.2}
        color="#e2e8f0"
        anchorX="center"
        anchorY="top"
      >
        {formatComponentName(component.name)}
      </Text>
    </group>
  );
}

function getTowerConfig(name: string): { geometry: JSX.Element; height: number } {
  switch (name) {
    case 'kube-apiserver':
      return {
        geometry: <boxGeometry args={[0.8, 2.5, 0.8]} />,
        height: 2.5,
      };
    case 'etcd':
      return {
        geometry: <cylinderGeometry args={[0.4, 0.5, 1.8, 8]} />,
        height: 1.8,
      };
    case 'kube-scheduler':
      return {
        geometry: <coneGeometry args={[0.5, 1.5, 4]} />,
        height: 1.5,
      };
    case 'kube-controller-manager':
      return {
        geometry: <boxGeometry args={[0.6, 1.5, 0.6]} />,
        height: 1.5,
      };
    case 'cloud-controller-manager':
      return {
        geometry: <sphereGeometry args={[0.5, 16, 16]} />,
        height: 1,
      };
    default:
      return {
        geometry: <boxGeometry args={[0.5, 1, 0.5]} />,
        height: 1,
      };
  }
}

function formatComponentName(name: string): string {
  return name
    .replace('kube-', '')
    .replace('-manager', '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function ConnectionLines({ components }: { components: ControlPlaneComponent3D[] }) {
  const apiServer = components.find((c) => c.name === 'kube-apiserver');
  if (!apiServer) return null;

  const apiPos = [
    apiServer.position[0],
    apiServer.position[1] - (-12),
    apiServer.position[2] - (-12),
  ];

  return (
    <group>
      {components
        .filter((c) => c.name !== 'kube-apiserver')
        .map((component) => {
          const compPos = [
            component.position[0],
            component.position[1] - (-12),
            component.position[2] - (-12),
          ];

          const points = [
            new THREE.Vector3(apiPos[0], apiPos[1], apiPos[2]),
            new THREE.Vector3(compPos[0], compPos[1], compPos[2]),
          ];

          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

          return (
            <line key={component.name}>
              <bufferGeometry attach="geometry" {...lineGeometry} />
              <lineBasicMaterial
                attach="material"
                color={colors.glow}
                transparent
                opacity={0.3}
              />
            </line>
          );
        })}
    </group>
  );
}

export default ControlPlaneIsland;
