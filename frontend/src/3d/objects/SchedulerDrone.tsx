// Scheduler Drone - Animated drone that carries pods

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors } from '../constants';

interface SchedulerDroneProps {
  isActive: boolean;
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  podColor?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SchedulerDrone({
  isActive,
  startPosition,
  endPosition,
  podColor = colors.podPending,
  onComplete,
  duration = 3000,
}: SchedulerDroneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const propellerRefs = useRef<THREE.Mesh[]>([]);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      setProgress(0);
    }
  }, [isActive]);

  useFrame(() => {
    if (!isActive || !groupRef.current) return;

    propellerRefs.current.forEach((propeller) => {
      if (propeller) {
        propeller.rotation.y += 0.5;
      }
    });

    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      const t = easeInOutCubic(newProgress);
      
      const midY = Math.max(startPosition[1], endPosition[1]) + 3;
      const currentY = startPosition[1] + (midY - startPosition[1]) * Math.sin(t * Math.PI);
      
      groupRef.current.position.set(
        THREE.MathUtils.lerp(startPosition[0], endPosition[0], t),
        currentY,
        THREE.MathUtils.lerp(startPosition[2], endPosition[2], t)
      );

      const direction = new THREE.Vector3(
        endPosition[0] - startPosition[0],
        0,
        endPosition[2] - startPosition[2]
      ).normalize();
      
      if (direction.length() > 0) {
        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = angle;
      }

      const wobble = Math.sin(elapsed * 0.01) * 0.05;
      groupRef.current.rotation.z = wobble;

      if (newProgress >= 1 && onComplete) {
        onComplete();
      }
    }
  });

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={startPosition}>
      {/* Drone body */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.15, 0.4]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Drone arms and propellers */}
      {[
        [0.3, 0.1, 0.3],
        [-0.3, 0.1, 0.3],
        [0.3, 0.1, -0.3],
        [-0.3, 0.1, -0.3],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Arm */}
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          {/* Propeller */}
          <mesh
            ref={(el) => {
              if (el) propellerRefs.current[i] = el;
            }}
            position={[0, 0.08, 0]}
          >
            <boxGeometry args={[0.25, 0.02, 0.05]} />
            <meshStandardMaterial color="#60a5fa" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Carried pod (visible during transport) */}
      {progress > 0 && progress < 0.9 && (
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial
            color={podColor}
            emissive={podColor}
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {/* Glow trail */}
      <Trail progress={progress} color={colors.scheduler} />

      {/* Spotlight effect */}
      <spotLight
        position={[0, -0.3, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.5}
        color={colors.scheduler}
        distance={5}
        target-position={[0, -5, 0]}
      />
    </group>
  );
}

interface TrailProps {
  progress: number;
  color: string;
}

function Trail({ progress, color }: TrailProps) {
  const trailRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (trailRef.current) {
      trailRef.current.rotation.y += 0.02;
    }
  });

  if (progress < 0.1) return null;

  return (
    <points ref={trailRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={20}
          array={new Float32Array(
            Array.from({ length: 60 }, (_, i) => {
              const idx = Math.floor(i / 3);
              const axis = i % 3;
              if (axis === 1) return -0.1 - idx * 0.05;
              return (Math.random() - 0.5) * 0.2;
            })
          )}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.05}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default SchedulerDrone;
