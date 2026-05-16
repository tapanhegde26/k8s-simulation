// Grid Floor - Futuristic grid pattern

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors } from '../constants';

interface GridFloorProps {
  size?: number;
  divisions?: number;
}

export function GridFloor({ size = 30, divisions = 30 }: GridFloorProps) {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (gridRef.current) {
      const material = gridRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.15 + Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <group position={[0, -0.49, 0]}>
      <gridHelper
        ref={gridRef}
        args={[size, divisions, colors.glow, colors.grid]}
      />
    </group>
  );
}

export default GridFloor;
