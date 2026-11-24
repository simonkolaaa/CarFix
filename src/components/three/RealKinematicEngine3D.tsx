import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from '@react-three/drei';
import * as THREE from 'three';
import type { EngineWiki, VehicleModel } from '../../core/types';
import type { EnginePartId, PowertrainLayout } from '../../data/simulatorScenarios';
import type { SimPartRuntimeState } from './EngineBay3D';

export type KinematicLayoutKind =
  | 'inline_3'
  | 'inline_4'
  | 'inline_5'
  | 'inline_6'
  | 'vr6_v6'
  | 'boxer'
  | 'v8_v10_v12'
  | 'ev_pmsm';

export interface KinematicEngineConfig {
  kind: KinematicLayoutKind;
  cylinderCount: number;
  hasTurbo: boolean;
  label: string;
  blockColor: string;
  headColor: string;
}

export function getKinematicEngineConfig(
  vehicle: VehicleModel | undefined,
  engine: EngineWiki | undefined,
  layout: PowertrainLayout,
): KinematicEngineConfig {
  if (layout === 'elettrico' || engine?.fuelType === 'Elettrico') {
    return {
      kind: 'ev_pmsm',
      cylinderCount: 0,
      hasTurbo: false,
      label: `${vehicle?.brand ?? 'EV'} Sincrono PMSM + Riduttore & Inverter`,
      blockColor: '#475569',
      headColor: '#cbd5e1',
    };
  }

  const text = `${vehicle?.model ?? ''} ${engine?.code ?? ''} ${engine?.familyName ?? ''}`.toLowerCase();

  if (
    text.includes('flat-6') ||
    text.includes('911') ||
    text.includes('ej25') ||
    text.includes('boxer') ||
    text.includes('impreza') ||
    text.includes('brz')
  ) {
    return {
      kind: 'boxer',
      cylinderCount: 4,
      hasTurbo: text.includes('sti') || text.includes('ej25') || text.includes('turbo'),
      label: `${vehicle?.brand ?? ''} Boxer Contrapposto (${engine?.code ?? 'Flat'})`.trim(),
      blockColor: '#64748b',
      headColor: '#e2e8f0',
    };
  }

  if (
    text.includes('v8') ||
    text.includes('v10') ||
    text.includes('v12') ||
    text.includes('w16') ||
    text.includes('hemi') ||
    text.includes('coyote') ||
    text.includes('ls3') ||
    text.includes('f136') ||
    text.includes('458') ||
    text.includes('488') ||
    text.includes('hurac') ||
    text.includes('aventador') ||
    text.includes('r8') ||
    text.includes('chiron')
  ) {
    const cyls = text.includes('v12') ? 12 : text.includes('v10') ? 10 : 8;
    return {
      kind: 'v8_v10_v12',
      cylinderCount: cyls,
      hasTurbo: text.includes('biturbo') || text.includes('488') || text.includes('chiron') || text.includes('urus'),
      label: `${vehicle?.brand ?? ''} V${cyls} Architettura a V`.trim(),
      blockColor: '#334155',
      headColor: text.includes('ferrari') ? '#dc2626' : '#e2e8f0',
    };
  }

  if (text.includes('2.5 tfsi') || text.includes('daza') || text.includes('dnwa')) {
    return {
      kind: 'inline_5',
      cylinderCount: 5,
      hasTurbo: true,
      label: 'Audi 2.5 TFSI 5 Cilindri in Linea Turbo',
      blockColor: '#475569',
      headColor: '#dc2626',
    };
  }

  if (
    text.includes('b58') ||
    text.includes('m57') ||
    text.includes('m54') ||
    text.includes('om606') ||
    text.includes('2jz') ||
    text.includes('rb26') ||
    text.includes('n52')
  ) {
    return {
      kind: 'inline_6',
      cylinderCount: 6,
      hasTurbo: !text.includes('m54') && !text.includes('n52'),
      label: `${vehicle?.brand ?? ''} 6 Cilindri in Linea (${engine?.code ?? 'I6'})`.trim(),
      blockColor: '#334155',
      headColor: '#cbd5e1',
    };
  }

  if (
    text.includes('vr6') ||
    text.includes('r32') ||
    text.includes('v6') ||
    text.includes('370z') ||
    text.includes('nsx')
  ) {
    return {
      kind: 'vr6_v6',
      cylinderCount: 6,
      hasTurbo: text.includes('tdi') || text.includes('quadrifoglio') || text.includes('ghibli'),
      label: `${vehicle?.brand ?? ''} ${text.includes('vr6') || text.includes('r32') ? 'VR6' : 'V6'} 6 Cilindri`.trim(),
      blockColor: '#475569',
      headColor: text.includes('alfa') ? '#b91c1c' : '#cbd5e1',
    };
  }

  if (
    text.includes('puretech') ||
    text.includes('firefly') ||
    text.includes('1.0 ecoboost') ||
    text.includes('gr yaris') ||
    text.includes('1.4 tdi') ||
    text.includes('tce') ||
    text.includes('eco-g')
  ) {
    return {
      kind: 'inline_3',
      cylinderCount: 3,
      hasTurbo: !text.includes('firefly'),
      label: `${vehicle?.brand ?? ''} 3 Cilindri (${engine?.code ?? 'I3'})`.trim(),
      blockColor: '#475569',
      headColor: '#e2e8f0',
    };
  }

  return {
    kind: 'inline_4',
    cylinderCount: 4,
    hasTurbo:
      layout === 'diesel' ||
      text.includes('tsi') ||
      text.includes('tfsi') ||
      text.includes('tjet') ||
      text.includes('t-jet') ||
      text.includes('tbi') ||
      text.includes('turbo') ||
      text.includes('m139'),
    label: `${vehicle?.brand ?? ''} 4 Cilindri ${layout === 'diesel' ? 'Turbodiesel' : 'DOHC'}`.trim(),
    blockColor: layout === 'diesel' ? '#334155' : '#64748b',
    headColor: text.includes('abarth') || text.includes('alfa') ? '#991b1b' : '#cbd5e1',
  };
}

interface RealKinematicEngine3DProps {
  vehicle?: VehicleModel;
  engine?: EngineWiki;
  powertrainLayout: PowertrainLayout;
  partStates: Record<EnginePartId, SimPartRuntimeState>;
  selectedPart: EnginePartId;
  onSelectPart: (id: EnginePartId) => void;
  rpm: number;
  running: boolean;
  exploded: boolean;
}

const CRANK_R = 0.22;
const ROD_L = 0.62;

function ElectricDriveCutaway({
  rpm,
  running,
  partStates,
  onSelectPart,
}: {
  rpm: number;
  running: boolean;
  partStates: Record<EnginePartId, SimPartRuntimeState>;
  onSelectPart: (id: EnginePartId) => void;
}) {
  const rotorRef = useRef<THREE.Group>(null);
  const gearRef = useRef<THREE.Mesh>(null);
  const fluxRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const omega = running ? Math.max(4, (rpm / 1000) * 9) : 0;
    if (rotorRef.current) rotorRef.current.rotation.z -= omega * dt;
    if (gearRef.current) gearRef.current.rotation.z += omega * 0.42 * dt;
    if (fluxRef.current) {
      fluxRef.current.rotation.z += omega * 0.5 * dt;
      const mat = fluxRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = running
        ? 0.8 + Math.sin(state.clock.elapsedTime * 14) * 0.4 + (rpm / 6500) * 1.4
        : 0.1;
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* Statore spaccato con avvolgimenti in rame */}
      <mesh
        position={[-0.35, 0.4, 0]}
        rotation={[0, 0, Math.PI / 2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart('block');
        }}
      >
        <cylinderGeometry args={[0.72, 0.72, 1.35, 28, 1, true, 0, Math.PI * 1.45]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.35, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.65, 0.65, 1.25, 24, 1, true, 0, Math.PI * 1.45]} />
        <meshStandardMaterial color="#b45309" metalness={0.88} roughness={0.24} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotore laminato rotante ad alta velocità */}
      <group ref={rotorRef} position={[-0.35, 0.4, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 1.48, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            position={[0, Math.sin((i * Math.PI) / 3) * 0.43, Math.cos((i * Math.PI) / 3) * 0.43]}
          >
            <boxGeometry args={[1.2, 0.05, 0.08]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.7} roughness={0.2} />
          </mesh>
        ))}
        {/* Albero uscita verso riduttore */}
        <mesh position={[0.92, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.7, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Anello campo magnetico trifase pulsante */}
      <mesh ref={fluxRef} position={[-0.35, 0.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.54, 0.025, 12, 32]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
      </mesh>

      {/* Riduttore monomarcia rotante in presa */}
      <mesh
        ref={gearRef}
        position={[0.72, 0.08, 0]}
        rotation={[0, 0, Math.PI / 2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart('timing');
        }}
      >
        <cylinderGeometry args={[0.52, 0.52, 0.34, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.22} />
      </mesh>

      {/* Inverter SiC 400V superiore + Cavi Arancioni Alta Tensione */}
      <group
        position={[-0.1, 1.28, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart('turbo');
        }}
      >
        <mesh>
          <boxGeometry args={[1.35, 0.26, 0.9]} />
          <meshStandardMaterial
            color={partStates.turbo.faulty ? '#7f1d1d' : '#e2e8f0'}
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
        {[-0.4, 0, 0.4].map((x, idx) => (
          <mesh
            key={idx}
            position={[x, -0.15, 0.48]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPart('coils');
            }}
          >
            <cylinderGeometry args={[0.045, 0.045, 0.55, 12]} />
            <meshStandardMaterial
              color="#f97316"
              emissive={partStates.coils.faulty ? '#ef4444' : '#ea580c'}
              emissiveIntensity={0.35}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PistonEngineCutaway({
  config,
  partStates,
  selectedPart,
  onSelectPart,
  rpm,
  running,
  exploded,
}: {
  config: KinematicEngineConfig;
  partStates: Record<EnginePartId, SimPartRuntimeState>;
  selectedPart: EnginePartId;
  onSelectPart: (id: EnginePartId) => void;
  rpm: number;
  running: boolean;
  exploded: boolean;
}) {
  const crankRef = useRef<THREE.Group>(null);
  const camLeftRef = useRef<THREE.Group>(null);
  const camRightRef = useRef<THREE.Group>(null);
  const pulleyARef = useRef<THREE.Mesh>(null);
  const pulleyBRef = useRef<THREE.Mesh>(null);
  const fanRef = useRef<THREE.Group>(null);
  const turboWheelRef = useRef<THREE.Mesh>(null);
  const blockShudderRef = useRef<THREE.Group>(null);

  const pistonRefs = useRef<(THREE.Group | null)[]>([]);
  const rodRefs = useRef<(THREE.Group | null)[]>([]);
  const sparkRefs = useRef<(THREE.Mesh | null)[]>([]);
  const crankAngleRef = useRef(0);

  const isV = config.kind === 'v8_v10_v12' || config.kind === 'vr6_v6';
  const isBoxer = config.kind === 'boxer';
  const bankCyls = isV || isBoxer ? Math.ceil(config.cylinderCount / 2) : config.cylinderCount;
  const spacing = config.cylinderCount >= 6 && !isV && !isBoxer ? 0.56 : 0.64;

  const cylMeta = useMemo(() => {
    const items: Array<{
      index: number;
      xPos: number;
      zOffset: number;
      bankAngle: number;
      phaseRad: number;
    }> = [];

    if (isBoxer) {
      for (let i = 0; i < config.cylinderCount; i++) {
        const pair = Math.floor(i / 2);
        const side = i % 2 === 0 ? -1 : 1;
        items.push({
          index: i,
          xPos: (pair - (bankCyls - 1) / 2) * spacing,
          zOffset: side * 0.12,
          bankAngle: side * (Math.PI / 2),
          phaseRad: i * Math.PI,
        });
      }
    } else if (isV) {
      const bankTilt = config.kind === 'vr6_v6' ? 0.36 : 0.68;
      for (let i = 0; i < config.cylinderCount; i++) {
        const pair = Math.floor(i / 2);
        const side = i % 2 === 0 ? -1 : 1;
        items.push({
          index: i,
          xPos: (pair - (bankCyls - 1) / 2) * spacing,
          zOffset: side * 0.08,
          bankAngle: side * bankTilt,
          phaseRad: (i * Math.PI * 2) / Math.max(2, bankCyls),
        });
      }
    } else {
      // Inline 3, 4, 5, 6
      const phases4 = [0, Math.PI, Math.PI, 0];
      for (let i = 0; i < config.cylinderCount; i++) {
        const phase =
          config.cylinderCount === 4
            ? phases4[i]
            : (i * Math.PI * 2) / Math.max(3, config.cylinderCount);
        items.push({
          index: i,
          xPos: (i - (config.cylinderCount - 1) / 2) * spacing,
          zOffset: 0,
          bankAngle: 0,
          phaseRad: phase,
        });
      }
    }
    return items;
  }, [config.cylinderCount, config.kind, isBoxer, isV, bankCyls, spacing]);

  const hasMisfire =
    running && (partStates.coils.faulty || partStates.coils.disconnected || partStates.coils.removed);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.045);
    const visualOmega = running ? 3.5 + (rpm / 6500) * 26 : 0;
    crankAngleRef.current += visualOmega * dt;
    const theta = crankAngleRef.current;

    if (crankRef.current) crankRef.current.rotation.x = theta;
    if (camLeftRef.current) camLeftRef.current.rotation.x = theta * 0.5;
    if (camRightRef.current) camRightRef.current.rotation.x = theta * 0.5;
    if (pulleyARef.current) pulleyARef.current.rotation.x = theta;
    if (pulleyBRef.current) pulleyBRef.current.rotation.x = theta * 1.4;
    if (fanRef.current && running) fanRef.current.rotation.z -= visualOmega * 1.2 * dt;
    if (turboWheelRef.current && running) turboWheelRef.current.rotation.z -= visualOmega * 4.2 * dt;

    // Cinematica reale biella-manovella + scintilla accensione in camera per ogni cilindro!
    for (const c of cylMeta) {
      const a = theta + c.phaseRad;
      const pinZ = CRANK_R * Math.sin(a);
      const pinY = CRANK_R * Math.cos(a);
      const pistonDist = pinY + Math.sqrt(Math.max(0.05, ROD_L * ROD_L - pinZ * pinZ));
      const rodTilt = Math.asin(-pinZ / ROD_L);

      const pGroup = pistonRefs.current[c.index];
      if (pGroup) pGroup.position.y = pistonDist;

      const rGroup = rodRefs.current[c.index];
      if (rGroup) {
        rGroup.position.set(0, pinY + (pistonDist - pinY) * 0.5, pinZ * 0.5);
        rGroup.rotation.x = rodTilt;
      }

      const spMesh = sparkRefs.current[c.index];
      if (spMesh) {
        const cylDead = hasMisfire && c.index === 1;
        const nearTdc = running && !cylDead && Math.cos(a) > 0.86;
        const mat = spMesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = nearTdc ? 2.6 + (rpm / 6500) * 1.5 : 0;
        mat.opacity = nearTdc ? 0.85 : 0;
      }
    }

    if (blockShudderRef.current) {
      if (running) {
        const vib = hasMisfire ? 0.022 : 0.0018 + (rpm / 6500) * 0.003;
        const t = state.clock.elapsedTime;
        blockShudderRef.current.position.x = Math.sin(t * 48) * vib;
        blockShudderRef.current.position.y = Math.cos(t * 53) * vib * 0.4;
      } else {
        blockShudderRef.current.position.set(0, 0, 0);
      }
    }
  });

  const blockLength = Math.max(1.8, bankCyls * spacing + 0.45);
  const exhaustGlow = running ? Math.min(1.8, 0.1 + (rpm / 6500) * 1.5) : 0;

  return (
    <group ref={blockShudderRef} position={[0, -0.1, 0]}>
      {/* Basamento & Coppa Olio inferiore spaccata */}
      <mesh
        position={[0, -0.32, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart('block');
        }}
      >
        <boxGeometry args={[blockLength, 0.34, 1.1]} />
        <meshStandardMaterial
          color={config.blockColor}
          metalness={0.84}
          roughness={0.32}
          emissive={selectedPart === 'block' ? '#22d3ee' : '#000000'}
          emissiveIntensity={selectedPart === 'block' ? 0.25 : 0}
        />
      </mesh>

      {/* ALBERO MOTORE (Crankshaft) rotante con contrappesi */}
      <group ref={crankRef} position={[0, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, blockLength + 0.35, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.14} />
        </mesh>
        {cylMeta.map((c) => (
          <group key={`cw-${c.index}`} position={[c.xPos, 0, 0]} rotation={[c.phaseRad, 0, 0]}>
            <mesh position={[0, CRANK_R * 0.5, 0]}>
              <boxGeometry args={[0.12, CRANK_R + 0.14, 0.18]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.22} />
            </mesh>
          </group>
        ))}
      </group>

      {/* CILINDRI TRASPARENTI + PISTONI + BIELLE + FIAMMA COMBUSTIONE */}
      {cylMeta.map((c) => (
        <group
          key={`cyl-${c.index}`}
          position={[c.xPos, exploded ? 0.35 : 0, c.zOffset]}
          rotation={[c.bankAngle, 0, 0]}
        >
          {/* Camicia cilindro spaccata / traslucida per vedere i pistoni lavorare! */}
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.72, 22, 1, true]} />
            <meshPhysicalMaterial
              color="#94a3b8"
              metalness={0.4}
              roughness={0.12}
              transparent
              opacity={0.28}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Lampo di combustione in camera a PMS */}
          <mesh
            ref={(el) => {
              sparkRefs.current[c.index] = el;
            }}
            position={[0, 0.96, 0]}
          >
            <sphereGeometry args={[0.17, 14, 14]} />
            <meshStandardMaterial
              color="#fb923c"
              emissive="#f97316"
              emissiveIntensity={0}
              transparent
              opacity={0}
            />
          </mesh>

          {/* Pistone in alluminio lavorato */}
          <group
            ref={(el) => {
              pistonRefs.current[c.index] = el;
            }}
            position={[0, 0.65, 0]}
          >
            <mesh>
              <cylinderGeometry args={[0.21, 0.21, 0.18, 22]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
            </mesh>
            {/* Fasce elastiche scure */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.215, 0.215, 0.025, 22]} />
              <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>

          {/* Biella (Connecting Rod) articolata */}
          <group
            ref={(el) => {
              rodRefs.current[c.index] = el;
            }}
            position={[0, 0.32, 0]}
          >
            <mesh>
              <boxGeometry args={[0.06, ROD_L, 0.075]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.22} />
            </mesh>
          </group>
        </group>
      ))}

      {/* TESTATA VALVOLE + ALBERI A CAMME + BOBINE ACCENSIONE */}
      <group
        position={[0, exploded ? 1.55 : 1.18, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart('coils');
        }}
      >
        <mesh>
          <boxGeometry args={[blockLength, 0.24, isV || isBoxer ? 1.45 : 0.86]} />
          <meshStandardMaterial
            color={config.headColor}
            metalness={0.78}
            roughness={0.25}
            emissive={selectedPart === 'coils' ? '#22d3ee' : '#000000'}
            emissiveIntensity={selectedPart === 'coils' ? 0.22 : 0}
          />
        </mesh>

        {/* Alberi a camme rotanti con lobi visibili sopra la testata */}
        <group ref={camLeftRef} position={[0, 0.16, -0.18]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, blockLength + 0.15, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
          {cylMeta.map((c) => (
            <mesh key={`camL-${c.index}`} position={[c.xPos, 0.03, 0]} rotation={[c.phaseRad, 0, 0]}>
              <boxGeometry args={[0.08, 0.11, 0.08]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.92} roughness={0.18} />
            </mesh>
          ))}
        </group>
        <group ref={camRightRef} position={[0, 0.16, 0.18]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, blockLength + 0.15, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>

        {/* Bobine / Iniettori individuali colorati */}
        {cylMeta.slice(0, bankCyls).map((c) => (
          <mesh key={`coil-${c.index}`} position={[c.xPos, 0.22, 0]}>
            <boxGeometry args={[0.14, 0.12, 0.22]} />
            <meshStandardMaterial
              color={partStates.coils.upgraded ? '#ef4444' : '#18181b'}
              roughness={0.38}
            />
          </mesh>
        ))}
      </group>

      {/* DISTRIBUZIONE & PULEGGE ROTANTI + VENTOLA ANTERIORE */}
      <group
        position={[-blockLength * 0.55 - (exploded ? 0.35 : 0), 0.38, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart('timing');
        }}
      >
        <mesh ref={pulleyARef} position={[0, -0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.09, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.22} />
        </mesh>
        <mesh ref={pulleyBRef} position={[0, 0.8, 0.18]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 0.09, 24]} />
          <meshStandardMaterial
            color={partStates.timing.upgraded ? '#0d9488' : '#cbd5e1'}
            metalness={0.9}
            roughness={0.22}
          />
        </mesh>
        {/* Ventola raffreddamento */}
        <group ref={fanRef} position={[-0.18, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
          {[0, 1, 2, 3].map((b) => (
            <mesh key={b} rotation={[0, 0, (b * Math.PI) / 4]}>
              <boxGeometry args={[0.72, 0.09, 0.02]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
          ))}
        </group>
      </group>

      {/* TURBOCOMPRESSORE ROTANTE + COLLETTORE SCARICO INCANDESCENTE AD ALTI GIRI */}
      {config.hasTurbo && (
        <group
          position={[0.25, 0.52, -0.78 - (exploded ? 0.35 : 0)]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart('turbo');
          }}
        >
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.22, 0.09, 16, 28]} />
            <meshStandardMaterial
              color={partStates.turbo.upgraded ? '#38bdf8' : '#cbd5e1'}
              metalness={0.92}
              roughness={0.18}
              emissive="#f97316"
              emissiveIntensity={exhaustGlow * 0.45}
            />
          </mesh>
          <mesh ref={turboWheelRef} position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.05, 14]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Collettori scarico laterali */}
      <mesh
        position={[0, 0.65, -0.58]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart('egr_downpipe');
        }}
      >
        <boxGeometry args={[blockLength * 0.85, 0.14, 0.18]} />
        <meshStandardMaterial
          color="#78716c"
          metalness={0.82}
          roughness={0.3}
          emissive="#ef4444"
          emissiveIntensity={exhaustGlow}
        />
      </mesh>
    </group>
  );
}

export function RealKinematicEngine3D({
  vehicle,
  engine,
  powertrainLayout,
  partStates,
  selectedPart,
  onSelectPart,
  rpm,
  running,
  exploded,
}: RealKinematicEngine3DProps) {
  const config = useMemo(
    () => getKinematicEngineConfig(vehicle, engine, powertrainLayout),
    [vehicle, engine, powertrainLayout],
  );

  return (
    <div className="relative h-full w-full bg-[#0d0f14]">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [2.8, 1.9, 3.1], fov: 38 }}>
        <color attach="background" args={['#0d0f14']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
        <directionalLight position={[-4, 3, -3]} intensity={1.1} color="#38bdf8" />

        <Environment resolution={128}>
          <Lightformer
            form="rect"
            intensity={2.8}
            position={[0, 5, 2]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[9, 3, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.6}
            position={[-5, 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[5, 2, 1]}
            color="#38bdf8"
          />
        </Environment>

        {config.kind === 'ev_pmsm' ? (
          <ElectricDriveCutaway
            rpm={rpm}
            running={running}
            partStates={partStates}
            onSelectPart={onSelectPart}
          />
        ) : (
          <PistonEngineCutaway
            config={config}
            partStates={partStates}
            selectedPart={selectedPart}
            onSelectPart={onSelectPart}
            rpm={rpm}
            running={running}
            exploded={exploded}
          />
        )}

        <ContactShadows position={[0, -0.58, 0]} opacity={0.65} scale={8} blur={2.2} />
        <OrbitControls enablePan={false} minDistance={2.2} maxDistance={6.8} target={[0, 0.4, 0]} />
      </Canvas>

      {/* Badge architettura motore reale */}
      <div className="pointer-events-none absolute bottom-16 left-4 rounded-full border border-cyan-400/35 bg-black/80 px-3 py-1 backdrop-blur-md">
        <span className="font-mono-tech text-[10px] font-bold uppercase tracking-wider text-cyan-300">
          {config.label} · {running ? `${rpm} RPM ATTIVI` : 'MOTORE SPENTO'}
        </span>
      </div>
    </div>
  );
}
