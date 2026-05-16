// Sky Environment - Background, stars, and lighting

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

export function SkyEnvironment() {
  const starsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} color="#4a5568" />
      
      {/* Main directional light */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Fill light from opposite side */}
      <directionalLight
        position={[-10, 10, -10]}
        intensity={0.3}
        color="#60a5fa"
      />
      
      {/* Rim light for dramatic effect */}
      <pointLight
        position={[0, 15, -15]}
        intensity={0.5}
        color="#8b5cf6"
        distance={50}
      />
      
      {/* Stars background */}
      <Stars
        ref={starsRef}
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#0f172a', 30, 80]} />
    </>
  );
}

export default SkyEnvironment;
