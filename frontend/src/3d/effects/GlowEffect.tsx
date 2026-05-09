// Glow Effect - Post-processing bloom wrapper

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

interface GlowEffectProps {
  intensity?: number;
  enabled?: boolean;
}

export function GlowEffect({ intensity = 0.4, enabled = true }: GlowEffectProps) {
  if (!enabled) return null;

  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        intensity={intensity}
        mipmapBlur
      />
      <Vignette darkness={0.4} offset={0.3} />
    </EffectComposer>
  );
}

export default GlowEffect;
