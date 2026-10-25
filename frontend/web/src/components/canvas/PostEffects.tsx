'use client';

import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';

const CHROMA_OFFSET = new THREE.Vector2(0.001, 0.001);

export function PostEffects() {
  return (
    // multisampling={0} eliminates heavy MSAA framebuffer passes, drastically reducing GPU fill-rate overhead
    <EffectComposer multisampling={0} autoClear={false} enableNormalPass={false}>
      {/* High-efficiency Selective Neon Bloom */}
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.45}
        luminanceSmoothing={0.5}
        mipmapBlur
        radius={0.55}
      />

      {/* Low-overhead chromatic edge dispersion */}
      <ChromaticAberration offset={CHROMA_OFFSET} />

      {/* Deep Space Vignette */}
      <Vignette
        offset={0.25}
        darkness={0.75}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
