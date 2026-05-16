// Node Building - Represents a Kubernetes node as a building

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Node3D, Pod3D } from '../types';
import { colors } from '../constants';
import { PodCube } from './PodCube';

interface NodeBuildingProps {
  node: Node3D;
  pods: Pod3D[];
  isSelected?: boolean;
  onClick?: () => void;
  onPodClick?: (podId: string) => void;
  selectedPodId?: string | null;
}

export function NodeBuilding({
  node,
  pods,
  isSelected = false,
  onClick,
  onPodClick,
  selectedPodId,
}: NodeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const isMaster = node.role === 'master';
  const isReady = node.status === 'Ready';
  
  const baseColor = isMaster ? colors.masterNode : colors.workerNode;
  const statusColor = isReady ? '#22c55e' : '#ef4444';
  
  const width = isMaster ? 3 : 2;
  const depth = isMaster ? 3 : 2;
  const height = isMaster ? 4 : 3;

  const cpuUsage = node.allocatableCpu > 0 
    ? node.allocatedCpu / node.allocatableCpu 
    : 0;
  const memoryUsage = node.allocatableMemory > 0 
    ? node.allocatedMemory / node.allocatableMemory 
    : 0;

  useFrame((state) => {
    if (groupRef.current) {
      if (isSelected || hovered) {
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          0.2,
          0.1
        );
      } else {
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          0,
          0.1
        );
      }
    }

    if (beaconRef.current) {
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      beaconRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Building base */}
      <RoundedBox
        args={[width, 0.3, depth]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.15, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={baseColor}
          metalness={0.7}
          roughness={0.3}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
        />
      </RoundedBox>

      {/* Building body - semi-transparent */}
      <RoundedBox
        args={[width - 0.2, height, depth - 0.2]}
        radius={0.1}
        smoothness={4}
        position={[0, height / 2 + 0.3, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={baseColor}
          metalness={0.5}
          roughness={0.5}
          transparent
          opacity={0.7}
        />
      </RoundedBox>

      {/* Wireframe overlay */}
      <RoundedBox
        args={[width - 0.15, height + 0.05, depth - 0.15]}
        radius={0.1}
        smoothness={4}
        position={[0, height / 2 + 0.3, 0]}
      >
        <meshBasicMaterial
          color={baseColor}
          wireframe
          transparent
          opacity={0.3}
        />
      </RoundedBox>

      {/* Status beacon on top */}
      <mesh
        ref={beaconRef}
        position={[0, height + 0.6, 0]}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Beacon glow */}
      <pointLight
        position={[0, height + 0.6, 0]}
        color={statusColor}
        intensity={0.5}
        distance={3}
      />

      {/* Resource meters on the side */}
      <ResourceMeter
        position={[width / 2 + 0.05, height / 2 + 0.3, 0]}
        rotation={[0, Math.PI / 2, 0]}
        value={cpuUsage}
        label="CPU"
        color="#3b82f6"
        height={height - 0.5}
      />
      <ResourceMeter
        position={[-width / 2 - 0.05, height / 2 + 0.3, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        value={memoryUsage}
        label="MEM"
        color="#8b5cf6"
        height={height - 0.5}
      />

      {/* Node name label */}
      <Text
        position={[0, -0.3, depth / 2 + 0.2]}
        fontSize={0.25}
        color="#e2e8f0"
        anchorX="center"
        anchorY="top"
      >
        {node.name}
      </Text>

      {/* Role badge */}
      <Text
        position={[0, height + 1, 0]}
        fontSize={0.2}
        color={isMaster ? colors.masterNode : colors.workerNode}
        anchorX="center"
        anchorY="bottom"
      >
        {isMaster ? 'MASTER' : 'WORKER'}
      </Text>

      {/* Pods inside the building */}
      {pods.map((pod, index) => (
        <PodCube
          key={pod.id}
          pod={pod}
          localPosition={calculatePodLocalPosition(index, width, depth)}
          isSelected={selectedPodId === pod.id}
          onClick={() => onPodClick?.(pod.id)}
        />
      ))}

      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[width * 0.8, width * 0.9, 32]} />
          <meshBasicMaterial
            color={colors.selection}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

interface ResourceMeterProps {
  position: [number, number, number];
  rotation: [number, number, number];
  value: number;
  label: string;
  color: string;
  height: number;
}

function ResourceMeter({ position, rotation, value, label, color, height }: ResourceMeterProps) {
  const fillHeight = height * Math.min(value, 1);
  
  return (
    <group position={position} rotation={rotation}>
      {/* Background */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.15, height]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.8} />
      </mesh>
      
      {/* Fill */}
      <mesh position={[0, -(height - fillHeight) / 2, 0.02]}>
        <planeGeometry args={[0.12, fillHeight]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, -height / 2 - 0.15, 0.02]}
        fontSize={0.1}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>
    </group>
  );
}

function calculatePodLocalPosition(
  index: number,
  _buildingWidth: number,
  _buildingDepth: number
): [number, number, number] {
  const podsPerRow = 3;
  const podsPerLayer = podsPerRow * podsPerRow;
  
  const layer = Math.floor(index / podsPerLayer);
  const indexInLayer = index % podsPerLayer;
  const row = Math.floor(indexInLayer / podsPerRow);
  const col = indexInLayer % podsPerRow;
  
  const spacing = 0.4;
  const startX = -(podsPerRow - 1) * spacing / 2;
  const startZ = -(podsPerRow - 1) * spacing / 2;
  
  return [
    startX + col * spacing,
    0.6 + layer * 0.5,
    startZ + row * spacing,
  ];
}

export default NodeBuilding;
