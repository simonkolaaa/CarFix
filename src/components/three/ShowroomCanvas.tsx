import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  Sparkles,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  DEFAULT_VISUAL_MODS,
  type EngineWiki,
  type HotspotKey,
  type VehicleModel,
  type VisualModsConfig,
} from '../../core/types';
import { ProceduralCarModel } from './ProceduralCarModel';
import { RealGlbCarModel } from './RealGlbCarModel';

interface ShowroomCanvasProps {
  vehicle: VehicleModel | null;
  engine: EngineWiki | null;
  paintHex: string;
  visualMods?: VisualModsConfig;
  activeHotspot: HotspotKey | null;
  onSelectHotspot: (spot: HotspotKey | null) => void;
  autoRotate?: boolean;
}

const HOTSPOTS: Array<{ key: HotspotKey; label: string; pos: [number, number, number] }> = [
  { key: 'engine', label: 'Motore', pos: [1.45, 0.92, 0] },
  { key: 'wheels', label: 'Ruote & Freni', pos: [1.32, 0.42, 0.98] },
  { key: 'exhaust', label: 'Scarico', pos: [-2.18, 0.34, 0.48] },
  { key: 'suspension', label: 'Sospensioni', pos: [-1.35, 0.56, -0.96] },
];

function AnimatedShowroomCar({
  vehicle,
  engine,
  paintHex,
  visualMods,
  activeHotspot,
  onSelectHotspot,
}: {
  vehicle: VehicleModel;
  engine: EngineWiki | null;
  paintHex: string;
  visualMods: VisualModsConfig;
  activeHotspot: HotspotKey | null;
  onSelectHotspot: (spot: HotspotKey | null) => void;
}) {
  const entryGroupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = 0;
  }, [vehicle.id]);

  useFrame((_, delta) => {
    const g = entryGroupRef.current;
    if (!g) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 1.85);
    const ease = 1 - Math.pow(1 - progressRef.current, 3);
    g.position.x = (1 - ease) * -3.5;
    g.position.y = (1 - ease) * 0.08;
    const scale = 0.94 + ease * 0.06;
    g.scale.setScalar(scale);
  });

  const caliperColor =
    engine?.verdictTier === 'hall_of_shame'
      ? '#f97316'
      : engine?.verdictTier === 'hall_of_fame'
        ? '#10b981'
        : '#ef4444';

  const useRealFerrariGlb = vehicle.id === 'ferrari-458-italia';

  return (
    <group ref={entryGroupRef}>
      {useRealFerrariGlb ? (
        <RealGlbCarModel
          paintHex={paintHex}
          visualMods={visualMods}
          brand={vehicle.brand}
        />
      ) : (
        <ProceduralCarModel
          archetype={vehicle.bodyArchetype}
          brand={vehicle.brand}
          paintHex={paintHex}
          exhaustGlow={0.28}
          caliperColor={caliperColor}
          visualMods={visualMods}
        />
      )}

      {HOTSPOTS.map((spot) => {
        const isActive = activeHotspot === spot.key;
        return (
          <Html key={spot.key} position={spot.pos} center distanceFactor={8}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectHotspot(isActive ? null : spot.key);
              }}
              className={`group flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'border-cyan-400 bg-cyan-500/90 text-black shadow-[0_0_20px_rgba(34,211,238,0.6)]'
                  : 'border-white/25 bg-black/75 text-zinc-100 backdrop-blur-md hover:border-cyan-400/70 hover:text-cyan-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive ? 'bg-black' : 'animate-pulse bg-cyan-400'
                }`}
              />
              <span className="font-mono-tech tracking-tight">{spot.label}</span>
            </button>
          </Html>
        );
      })}
    </group>
  );
}

export function ShowroomCanvas({
  vehicle,
  engine,
  paintHex,
  visualMods = DEFAULT_VISUAL_MODS,
  activeHotspot,
  onSelectHotspot,
  autoRotate = true,
}: ShowroomCanvasProps) {
  const ringColor = !vehicle
    ? '#38bdf8'
    : engine?.verdictTier === 'hall_of_fame'
      ? '#10b981'
      : engine?.verdictTier === 'hall_of_shame'
        ? '#ef4444'
        : '#38bdf8';

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [4.6, 1.95, 4.8], fov: 38 }}
      onPointerMissed={() => onSelectHotspot(null)}
    >
      <color attach="background" args={['#08080b']} />
      <fog attach="fog" args={['#08080b', 9, 26]} />

      <ambientLight intensity={0.28} />
      <spotLight
        position={[5, 7, 5]}
        angle={0.45}
        penumbra={0.85}
        intensity={vehicle ? 85 : 35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        color="#f8fafc"
      />
      <spotLight
        position={[-6, 5, -4]}
        angle={0.5}
        penumbra={0.9}
        intensity={vehicle ? 55 : 22}
        color={ringColor}
      />
      <pointLight position={[0, 3.6, 0]} intensity={vehicle ? 18 : 10} color="#ffffff" />

      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={2.8}
          color="#ffffff"
          position={[0, 5.2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 2.8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#bae6fd"
          position={[6, 2.4, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[7, 1.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.3}
          color="#e2e8f0"
          position={[-6, 2.2, -2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[7, 1.1, 1]}
        />
      </Environment>

      <Sparkles
        count={65}
        scale={[12, 5, 12]}
        size={1.4}
        speed={0.22}
        opacity={0.35}
        color="#cbd5e1"
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          blur={[320, 80]}
          resolution={512}
          mixBlur={0.85}
          mixStrength={35}
          roughness={0.38}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#07070a"
          metalness={0.65}
          mirror={0.45}
        />
      </mesh>

      <group position={[0, 0, 0]}>
        <mesh position={[0, -0.008, 0]} receiveShadow>
          <cylinderGeometry args={[3.35, 3.45, 0.03, 72]} />
          <meshStandardMaterial color="#101016" metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[3.26, 3.33, 80]} />
          <meshBasicMaterial color={ringColor} transparent opacity={vehicle ? 0.85 : 0.42} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
          <ringGeometry args={[2.1, 2.13, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
        </mesh>
      </group>

      {vehicle && (
        <>
          <ContactShadows
            position={[0, 0.012, 0]}
            opacity={0.72}
            scale={9}
            blur={2.1}
            far={3.5}
          />
          <AnimatedShowroomCar
            vehicle={vehicle}
            engine={engine}
            paintHex={paintHex}
            visualMods={visualMods}
            activeHotspot={activeHotspot}
            onSelectHotspot={onSelectHotspot}
          />
        </>
      )}

      <OrbitControls
        enablePan={false}
        minDistance={3.6}
        maxDistance={9.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.12}
        autoRotate={autoRotate && !activeHotspot}
        autoRotateSpeed={vehicle ? 0.55 : 0.25}
        target={[0, 0.65, 0]}
      />
    </Canvas>
  );
}
