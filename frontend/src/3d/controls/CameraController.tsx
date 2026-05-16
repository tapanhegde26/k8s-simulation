// Camera Controller - Orbit and fly camera controls

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export type CameraMode = 'orbit' | 'overview' | 'focus';

interface CameraControllerProps {
  mode?: CameraMode;
  focusTarget?: [number, number, number] | null;
  autoRotate?: boolean;
  onModeChange?: (mode: CameraMode) => void;
}

export function CameraController({
  mode = 'orbit',
  focusTarget = null,
  autoRotate = false,
}: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 5, 15));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    switch (mode) {
      case 'overview':
        targetPosition.current.set(0, 25, 25);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'focus':
        if (focusTarget) {
          targetPosition.current.set(
            focusTarget[0] + 5,
            focusTarget[1] + 5,
            focusTarget[2] + 5
          );
          targetLookAt.current.set(...focusTarget);
        }
        break;
      default:
        targetPosition.current.set(10, 10, 15);
        targetLookAt.current.set(0, 0, 0);
    }
  }, [mode, focusTarget]);

  useFrame(() => {
    if (mode === 'focus' || mode === 'overview') {
      camera.position.lerp(targetPosition.current, 0.05);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.05);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
    />
  );
}

export default CameraController;
