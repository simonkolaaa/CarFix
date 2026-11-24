import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  Sparkles,
} from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface CinematicGolfIntroProps {
  onComplete: () => void;
}

const SMOKE_PARTICLES = 90;

function createSmokeSpriteTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(226, 232, 240, 0.72)');
  grad.addColorStop(0.45, 'rgba(148, 163, 184, 0.36)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function Golf5R32RearScene({
  startTimeRef,
  onTitleReveal,
  onWipeFade,
}: {
  startTimeRef: React.MutableRefObject<number>;
  onTitleReveal: (visible: boolean) => void;
  onWipeFade: (alpha: number) => void;
}) {
  const carRef = useRef<THREE.Group>(null);
  const wheelLRef = useRef<THREE.Group>(null);
  const wheelRRef = useRef<THREE.Group>(null);
  const tailGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const exhaustGlowRef = useRef<THREE.PointLight>(null);
  const cameraLookTarget = useRef(new THREE.Vector3(0, 0.72, 0));

  // Volumetric exhaust smoke instances
  const smokeMeshRef = useRef<THREE.InstancedMesh>(null);
  const smokeDummy = useMemo(() => new THREE.Object3D(), []);
  const smokeTexture = useMemo(() => createSmokeSpriteTexture(), []);
  const smokeState = useMemo(
    () =>
      Array.from({ length: SMOKE_PARTICLES }, (_, i) => ({
        life: -1,
        maxLife: 1.4,
        pos: new THREE.Vector3(i % 2 === 0 ? -0.14 : 0.14, 0.28, 2.15),
        vel: new THREE.Vector3(),
        scale: 0.25,
      })),
    [],
  );
  const spawnCursor = useRef(0);
  const titleShownRef = useRef(false);

  // Golf V Deep Blue Pearl
  const r32Paint = '#16347a';

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = (performance.now() - startTimeRef.current) / 1000;

    if (t > 0.75 && !titleShownRef.current) {
      titleShownRef.current = true;
      onTitleReveal(true);
    }

    // 0.0 -> 2.75s: R32 ferma che scalda / sgasate
    // 2.75s -> 4.65s: R32 parte in accelerazione allontanandosi lungo -Z!
    let carZ = 0;
    let speedZ = 0;
    let squatAngle = 0;
    let revShake = 0;

    if (t < 2.75) {
      const burst1 = t > 0.7 && t < 1.35 ? Math.sin(((t - 0.7) / 0.65) * Math.PI) : 0;
      const burst2 = t > 1.7 && t < 2.45 ? Math.sin(((t - 1.7) / 0.75) * Math.PI) : 0;
      const burst = Math.max(burst1, burst2);
      squatAngle = burst * 0.028;
      revShake = Math.sin(t * 48) * 0.004 * (0.3 + burst * 1.4);
      speedZ = burst * 4;
    } else {
      const launchT = Math.min(1, (t - 2.75) / 1.85);
      const easeIn = launchT * launchT * launchT;
      carZ = -easeIn * 44;
      speedZ = 14 + launchT * 42;
      squatAngle = 0.042 * (1 - launchT * 0.5);
    }

    if (carRef.current) {
      carRef.current.position.set(revShake, 0, carZ);
      carRef.current.rotation.x = squatAngle;
    }

    if (wheelLRef.current) wheelLRef.current.rotation.x -= speedZ * dt * 1.6;
    if (wheelRRef.current) wheelRRef.current.rotation.x -= speedZ * dt * 1.6;

    // Intensità LED posteriori + bagliore fiamma/calore scarico
    if (tailGlowMatRef.current) {
      const pulse = t < 0.8 ? THREE.MathUtils.smoothstep(t, 0.1, 0.8) : 1;
      tailGlowMatRef.current.emissiveIntensity = 3.2 * pulse + (t > 2.7 ? 1.8 : 0);
    }
    if (exhaustGlowRef.current) {
      const revFlare =
        (t > 0.75 && t < 1.25) || (t > 1.75 && t < 2.35) || (t > 2.75 && t < 3.4) ? 1 : 0;
      exhaustGlowRef.current.intensity = revFlare * 14;
      exhaustGlowRef.current.position.z = carZ + 2.35;
    }

    // Camera bassa cinematografica Awwwards dietro la R32
    const camZ = 4.65 - Math.min(0.65, Math.max(0, t - 2.75) * 0.35);
    const camY = 0.88 + Math.sin(t * 0.7) * 0.03;
    state.camera.position.set(Math.sin(t * 0.45) * 0.18, camY, camZ);
    cameraLookTarget.current.set(0, 0.66, carZ * 0.45);
    state.camera.lookAt(cameraLookTarget.current);

    // Spawn particelle volumetriche dai 2 terminali centrali R32
    const spawnPerFrame = t > 2.7 ? 3 : t > 0.65 ? 2 : 1;
    for (let s = 0; s < spawnPerFrame; s++) {
      const p = smokeState[spawnCursor.current % SMOKE_PARTICLES];
      spawnCursor.current++;
      const pipeX = spawnCursor.current % 2 === 0 ? -0.14 : 0.14;
      p.life = 0;
      p.maxLife = t > 2.75 ? 1.85 : 1.35;
      p.pos.set(pipeX + (Math.random() - 0.5) * 0.05, 0.27 + Math.random() * 0.04, carZ + 2.15);
      const kickZ = t > 2.75 ? 5.8 + Math.random() * 4.5 : 2.3 + Math.random() * 1.4;
      p.vel.set((Math.random() - 0.5) * 1.15, 0.35 + Math.random() * 0.55, kickZ);
      p.scale = 0.24 + Math.random() * 0.14;
    }

    if (smokeMeshRef.current) {
      for (let i = 0; i < SMOKE_PARTICLES; i++) {
        const p = smokeState[i];
        if (p.life < 0 || p.life >= p.maxLife) {
          smokeDummy.position.set(0, -20, 0);
          smokeDummy.scale.setScalar(0.001);
          smokeDummy.updateMatrix();
          smokeMeshRef.current.setMatrixAt(i, smokeDummy.matrix);
          continue;
        }
        p.life += dt;
        const norm = p.life / p.maxLife;
        p.pos.addScaledVector(p.vel, dt);
        p.vel.x += (Math.random() - 0.5) * 0.35 * dt;
        p.vel.multiplyScalar(0.985);
        const expand = (t > 2.75 ? 3.2 : 1.4) * norm;
        const size = (p.scale + expand) * (1 - norm * 0.12);

        smokeDummy.position.copy(p.pos);
        smokeDummy.quaternion.copy(state.camera.quaternion);
        smokeDummy.scale.setScalar(Math.max(0.01, size));
        smokeDummy.updateMatrix();
        smokeMeshRef.current.setMatrixAt(i, smokeDummy.matrix);
      }
      smokeMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Dissolvenza finale nel fumo verso la Home
    if (t > 4.1) {
      const wipeAlpha = Math.min(1, (t - 4.1) / 1.0);
      onWipeFade(wipeAlpha);
    } else {
      onWipeFade(0);
    }
  });

  return (
    <>
      <color attach="background" args={['#050508']} />
      <fog attach="fog" args={['#050508', 6, 26]} />

      <ambientLight intensity={0.55} />
      <spotLight position={[0, 7.5, 4.5]} intensity={140} angle={0.62} penumbra={0.9} color="#dbeafe" />
      <spotLight position={[-4.5, 3.2, 4]} intensity={48} angle={0.65} penumbra={1} color="#38bdf8" />
      <spotLight position={[4.5, 3.2, 4]} intensity={48} angle={0.65} penumbra={1} color="#3b82f6" />
      <pointLight ref={exhaustGlowRef} position={[0, 0.3, 2.35]} color="#f97316" intensity={0} distance={3.5} />

      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={3.5}
          position={[0, 5.2, 0.5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[11, 2.2, 1]}
          color="#e2e8f0"
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 2.2, 5.5]}
          rotation={[0, Math.PI, 0]}
          scale={[7, 0.6, 1]}
          color="#38bdf8"
        />
      </Environment>

      {/* Archi di luce stile studio Awwwards */}
      {[-2, -7, -13, -20].map((zPos) => (
        <mesh key={zPos} position={[0, 2.4, zPos]}>
          <torusGeometry args={[3.4, 0.018, 8, 64, Math.PI]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.22} />
        </mesh>
      ))}

      <Sparkles count={70} scale={[12, 4, 18]} size={1.4} speed={0.25} opacity={0.35} color="#7dd3fc" />

      {/* Pavimento lucido nero riflettente */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} receiveShadow>
        <planeGeometry args={[40, 60]} />
        <MeshReflectorMaterial
          blur={[320, 90]}
          resolution={512}
          mixBlur={0.9}
          mixStrength={45}
          roughness={0.28}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050608"
          metalness={0.78}
          mirror={0.62}
        />
      </mesh>

      {/* ============ VOLKSWAGEN GOLF V R32 (SAGOMA POSTERIORE NITIDA 3D) ============ */}
      <group ref={carRef}>
        {/* Ombra di contatto sotto la scocca */}
        <ContactShadows position={[0, 0.015, 0]} opacity={0.85} scale={6.5} blur={1.8} />

        {/* Corpo principale arrotondato stile Mk5 */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[1.76, 0.66, 3.95]} />
          <meshPhysicalMaterial
            color={r32Paint}
            metalness={0.75}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
        </mesh>

        {/* Passaruota bombati posteriori (Left / Right) */}
        <mesh position={[-0.86, 0.56, 1.25]}>
          <boxGeometry args={[0.14, 0.44, 1.1]} />
          <meshPhysicalMaterial color={r32Paint} metalness={0.75} roughness={0.18} clearcoat={1} />
        </mesh>
        <mesh position={[0.86, 0.56, 1.25]}>
          <boxGeometry args={[0.14, 0.44, 1.1]} />
          <meshPhysicalMaterial color={r32Paint} metalness={0.75} roughness={0.18} clearcoat={1} />
        </mesh>

        {/* Montanti C e Padiglione superiore Hatchback Golf V */}
        <mesh position={[0, 1.13, 0.25]} rotation={[-0.14, 0, 0]}>
          <boxGeometry args={[1.48, 0.46, 2.75]} />
          <meshPhysicalMaterial color={r32Paint} metalness={0.75} roughness={0.18} clearcoat={1} />
        </mesh>

        {/* Spoiler tetto sportivo R32 */}
        <mesh position={[0, 1.38, 1.72]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[1.46, 0.08, 0.34]} />
          <meshPhysicalMaterial color={r32Paint} metalness={0.75} roughness={0.18} clearcoat={1} />
        </mesh>
        {/* Terzo stop LED sullo spoiler */}
        <mesh position={[0, 1.37, 1.89]}>
          <boxGeometry args={[0.52, 0.028, 0.025]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
        </mesh>

        {/* Lunotto posteriore inclinato scuro */}
        <mesh position={[0, 1.12, 1.66]} rotation={[0.26, 0, 0]}>
          <boxGeometry args={[1.34, 0.42, 0.05]} />
          <meshPhysicalMaterial color="#090a0f" metalness={0.2} roughness={0.05} clearcoat={1} />
        </mesh>

        {/* Portellone posteriore & Bombatura centrale */}
        <mesh position={[0, 0.68, 1.98]} rotation={[0.04, 0, 0]}>
          <boxGeometry args={[1.72, 0.56, 0.08]} />
          <meshPhysicalMaterial color={r32Paint} metalness={0.75} roughness={0.18} clearcoat={1} />
        </mesh>

        {/* Emblematica maniglia VW tonda cromata */}
        <group position={[0, 0.78, 2.03]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.025, 32]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
            <ringGeometry args={[0.055, 0.075, 32]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>

        {/* Badge R32 argentato lato destro portellone */}
        <mesh position={[0.56, 0.68, 2.03]}>
          <boxGeometry args={[0.18, 0.055, 0.02]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Fari posteriori Golf V caratteristici a DOPPIO ANELLO LED ROSSO */}
        {[-0.64, 0.64].map((xPos, sideIdx) => (
          <group key={sideIdx} position={[xPos, 0.76, 2.02]}>
            <mesh>
              <boxGeometry args={[0.38, 0.17, 0.04]} />
              <meshPhysicalMaterial color="#450a0a" metalness={0.2} roughness={0.1} clearcoat={1} />
            </mesh>
            {/* Doppio anello circolare rosso Mk5 */}
            {[-0.09, 0.09].map((ringOffset, rIdx) => (
              <mesh key={rIdx} position={[ringOffset, 0, 0.024]}>
                <torusGeometry args={[0.055, 0.015, 12, 24]} />
                <meshStandardMaterial
                  ref={sideIdx === 0 && rIdx === 0 ? tailGlowMatRef : undefined}
                  color="#ff1e2d"
                  emissive="#ff1e2d"
                  emissiveIntensity={3.6}
                />
              </mesh>
            ))}
          </group>
        ))}

        {/* Sottoparaurti nero lucido R32 + Targa CARFIX */}
        <mesh position={[0, 0.28, 1.99]}>
          <boxGeometry args={[1.68, 0.26, 0.12]} />
          <meshStandardMaterial color="#0f1116" metalness={0.35} roughness={0.45} />
        </mesh>
        {/* Targa illuminata bianca */}
        <mesh position={[0, 0.44, 2.03]}>
          <boxGeometry args={[0.52, 0.11, 0.02]} />
          <meshStandardMaterial color="#f8fafc" emissive="#e2e8f0" emissiveIntensity={0.45} />
        </mesh>

        {/* DOPPI TERMINALI CENTRALI CROMATI R32! */}
        {[-0.14, 0.14].map((pipeX, idx) => (
          <group key={idx} position={[pipeX, 0.24, 2.06]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.068, 0.068, 0.18, 28]} />
              <meshStandardMaterial color="#e5e7eb" metalness={0.96} roughness={0.1} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.085]}>
              <cylinderGeometry args={[0.052, 0.052, 0.02, 24]} />
              <meshStandardMaterial color="#09090b" emissive="#fb923c" emissiveIntensity={0.55} />
            </mesh>
          </group>
        ))}

        {/* Ruote posteriori larghe 18" */}
        {[-0.86, 0.86].map((wx, idx) => (
          <group
            key={`rear-${idx}`}
            ref={idx === 0 ? wheelLRef : wheelRRef}
            position={[wx, 0.34, 1.32]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <mesh>
              <cylinderGeometry args={[0.34, 0.34, 0.24, 28]} />
              <meshStandardMaterial color="#111114" roughness={0.78} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.24, 0.24, 0.25, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.22} />
            </mesh>
          </group>
        ))}

        {/* Ruote anteriori */}
        {[-0.86, 0.86].map((wx, idx) => (
          <group key={`front-${idx}`} position={[wx, 0.34, -1.25]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.34, 0.34, 0.23, 28]} />
              <meshStandardMaterial color="#111114" roughness={0.78} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.24, 0.24, 0.24, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.22} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Particelle di fumo volumetrico dagli scarichi centrali R32 */}
      <instancedMesh ref={smokeMeshRef} args={[undefined, undefined, SMOKE_PARTICLES]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={smokeTexture}
          transparent
          opacity={0.72}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </instancedMesh>
    </>
  );
}

export function CinematicGolfIntro({ onComplete }: CinematicGolfIntroProps) {
  const startTimeRef = useRef(performance.now());
  const [titleVisible, setTitleVisible] = useState(false);
  const [wipeOpacity, setWipeOpacity] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = window.setTimeout(() => onCompleteRef.current(), 5300);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCompleteRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
      className="fixed inset-0 z-50 overflow-hidden bg-[#050508]"
    >
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.9, 4.65], fov: 44 }}>
        <Golf5R32RearScene
          startTimeRef={startTimeRef}
          onTitleReveal={setTitleVisible}
          onWipeFade={setWipeOpacity}
        />
      </Canvas>

      {/* Titolo editoriale stile Awwwards sopra la Golf V R32 */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={titleVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-x-0 top-12 flex flex-col items-center text-center sm:top-16"
      >
        <h1 className="font-display bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-8xl">
          CARFIX
        </h1>
        <p className="font-mono-tech mt-2 text-xs uppercase tracking-[0.42em] text-zinc-300 sm:text-sm">
          BY SIMON KOLA
        </p>
      </motion.div>

      {/* Dissolvenza nel fumo finale */}
      {wipeOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0 bg-[#08080b]"
          style={{
            opacity: wipeOpacity,
            background:
              'radial-gradient(circle at 50% 62%, rgba(203,213,225,0.45) 0%, rgba(15,23,42,0.92) 55%, #060609 100%)',
          }}
        />
      )}

      <button
        type="button"
        onClick={onComplete}
        className="font-mono-tech absolute right-5 top-5 z-20 cursor-pointer rounded-full border border-white/15 bg-black/70 px-4 py-2 text-[11px] uppercase tracking-widest text-zinc-200 backdrop-blur-md transition hover:border-cyan-400 hover:text-white"
      >
        Salta Intro [ESC]
      </button>
    </motion.div>
  );
}
