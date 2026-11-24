import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  Sparkles,
} from '@react-three/drei';
import * as THREE from 'three';
import type { CarPhoto } from '../../core/types';

interface UserCar3DStageProps {
  photo: CarPhoto;
  ringColorHex?: string;
}

function GroundedStudioCarCutout({ photo }: { photo: CarPhoto }) {
  const { texture, width, height } = useMemo(() => {
    const tex = new THREE.TextureLoader().load(photo.dataUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { texture: tex, width: 4.5, height: 2.6 };
  }, [photo.dataUrl]);

  return (
    <group position={[0, height * 0.48, 0]}>
      {/* Auto scontornata perfettamente appoggiata in piedi sulla pedana studio */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={photo.cutoutSucceeded ? 0.08 : 0.01}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function UserCar3DStage({ photo, ringColorHex }: UserCar3DStageProps) {
  const accent = photo.dominantColorHex || ringColorHex || '#38bdf8';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#08080b]">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.55, 4.9], fov: 38 }}>
        <color attach="background" args={['#08080b']} />
        <fog attach="fog" args={['#08080b', 8, 22]} />

        <ambientLight intensity={0.45} />
        <spotLight position={[4, 6, 5]} intensity={60} angle={0.5} penumbra={0.85} color="#ffffff" />
        <spotLight position={[-5, 4, 3]} intensity={35} angle={0.6} penumbra={0.9} color={accent} />

        <Environment resolution={128}>
          <Lightformer
            form="rect"
            intensity={2.4}
            position={[0, 4.8, 1]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[9, 2.5, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            color={accent}
            position={[-5, 2, 2]}
            rotation={[0, Math.PI / 3, 0]}
            scale={[5, 1.2, 1]}
          />
        </Environment>

        <Sparkles count={45} scale={[10, 4, 10]} size={1.2} speed={0.2} opacity={0.3} color={accent} />

        {/* Pavimento lucido nero riflettente */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[48, 48]} />
          <MeshReflectorMaterial
            blur={[300, 80]}
            resolution={512}
            mixBlur={0.85}
            mixStrength={36}
            roughness={0.34}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#07070a"
            metalness={0.7}
            mirror={0.48}
          />
        </mesh>

        {/* Pedana girevole con LED colorato in tinta con la tua auto */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, -0.008, 0]} receiveShadow>
            <cylinderGeometry args={[3.15, 3.25, 0.03, 64]} />
            <meshStandardMaterial color="#101016" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[3.06, 3.13, 72]} />
            <meshBasicMaterial color={accent} transparent opacity={0.92} />
          </mesh>
        </group>

        {/* Ombra morbida sotto le gomme */}
        <ContactShadows position={[0, 0.014, 0]} opacity={0.78} scale={7.5} blur={2.4} far={3} />

        <GroundedStudioCarCutout photo={photo} />

        <OrbitControls
          enablePan={false}
          minDistance={3.2}
          maxDistance={7.4}
          minAzimuthAngle={-Math.PI / 4.8}
          maxAzimuthAngle={Math.PI / 4.8}
          minPolarAngle={Math.PI / 3.4}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 1.12, 0]}
        />
      </Canvas>

      {/* Badge discreto stato foto scontornata */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full border border-emerald-400/35 bg-black/75 px-3 py-1 text-[11px] backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-mono-tech text-emerald-300">
          {photo.cutoutSucceeded
            ? `SCONTORNO AI STUDIO · ${Math.round(photo.aiConfidence * 100)}%`
            : `LA TUA AUTO IN STUDIO · AI ${Math.round(photo.aiConfidence * 100)}%`}
        </span>
      </div>
    </div>
  );
}
