// Service Pipeline - Represents service connections as glowing tubes

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import type { Service3D, Pod3D } from '../types';
import { serviceTypeColors, colors } from '../constants';

interface ServicePipelineProps {
  service: Service3D;
  pods: Pod3D[];
  isSelected?: boolean;
  onClick?: () => void;
}

export function ServicePipeline({
  service,
  pods,
  isSelected = false,
  onClick,
}: ServicePipelineProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const serviceColor = serviceTypeColors[service.type] || colors.serviceClusterIP;
  
  const connectedPods = useMemo(() => 
    pods.filter((pod) => service.connectedPodIds.includes(pod.id)),
    [pods, service.connectedPodIds]
  );

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={service.position}>
      {/* Service hub */}
      <group
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {/* Main service sphere */}
        <mesh castShadow>
          <dodecahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial
            color={serviceColor}
            metalness={0.6}
            roughness={0.4}
            emissive={serviceColor}
            emissiveIntensity={isSelected ? 0.5 : 0.2}
          />
        </mesh>

        {/* Outer glow ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.05, 8, 32]} />
          <meshBasicMaterial
            color={serviceColor}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Service type indicator */}
        <ServiceTypeIndicator type={service.type} color={serviceColor} />

        {/* Label */}
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.2}
          color="#e2e8f0"
          anchorX="center"
          anchorY="bottom"
        >
          {service.name}
        </Text>

        {/* Type label */}
        <Text
          position={[0, -0.6, 0]}
          fontSize={0.12}
          color={serviceColor}
          anchorX="center"
          anchorY="top"
        >
          {service.type}
        </Text>
      </group>

      {/* Connection lines to pods */}
      {connectedPods.map((pod) => (
        <ServiceConnection
          key={pod.id}
          servicePosition={[0, 0, 0]}
          podPosition={[
            pod.position[0] - service.position[0],
            pod.position[1] - service.position[1],
            pod.position[2] - service.position[2],
          ]}
          color={serviceColor}
          isActive={pod.phase === 'Running'}
        />
      ))}

      {/* Selection indicator */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
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

interface ServiceTypeIndicatorProps {
  type: string;
  color: string;
}

function ServiceTypeIndicator({ type, color }: ServiceTypeIndicatorProps) {
  switch (type) {
    case 'LoadBalancer':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh>
            <coneGeometry args={[0.15, 0.2, 4]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      );
    case 'NodePort':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

interface ServiceConnectionProps {
  servicePosition: [number, number, number];
  podPosition: [number, number, number];
  color: string;
  isActive: boolean;
}

function ServiceConnection({
  servicePosition,
  podPosition,
  color,
  isActive,
}: ServiceConnectionProps) {
  const midPoint: [number, number, number] = [
    (servicePosition[0] + podPosition[0]) / 2,
    Math.max(servicePosition[1], podPosition[1]) + 1,
    (servicePosition[2] + podPosition[2]) / 2,
  ];

  return (
    <QuadraticBezierLine
      start={servicePosition}
      end={podPosition}
      mid={midPoint}
      color={color}
      lineWidth={isActive ? 2 : 1}
      transparent
      opacity={isActive ? 0.6 : 0.3}
      dashed={!isActive}
      dashScale={10}
    />
  );
}

export default ServicePipeline;
