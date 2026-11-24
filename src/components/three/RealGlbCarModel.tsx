import { Component, Suspense, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { VisualModsConfig } from '../../core/types';
import { ProceduralCarModel } from './ProceduralCarModel';

const FERRARI_GLB_PATH = './models/ferrari.glb';
const DRACO_PATH = './draco/';

class GlbErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function FerrariGlbScene({
  paintHex,
  visualMods,
}: {
  paintHex: string;
  visualMods: VisualModsConfig;
}) {
  const { scene } = useGLTF(FERRARI_GLB_PATH, DRACO_PATH);
  const wheelRefs = useRef<THREE.Object3D[]>([]);

  const clonedScene = useMemo(() => {
    const copy = scene.clone(true);
    const wheels: THREE.Object3D[] = [];

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: paintHex,
      metalness: 0.75,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.9,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color:
        visualMods.rimFinish === 'gold'
          ? '#eab308'
          : visualMods.rimFinish === 'bronze'
            ? '#a16207'
            : visualMods.rimFinish === 'anthracite'
              ? '#52525b'
              : visualMods.rimFinish === 'black'
                ? '#1c1c24'
                : '#d4d4d8',
      metalness: 0.94,
      roughness: 0.2,
    });

    copy.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const name = (mesh.name || '').toLowerCase();
        const matName =
          !Array.isArray(mesh.material) && mesh.material?.name
            ? mesh.material.name.toLowerCase()
            : '';

        if (name.includes('body') || matName.includes('body') || matName.includes('carpaint')) {
          mesh.material = bodyMat;
        } else if (name.includes('rim') || matName.includes('rim')) {
          mesh.material = rimMat;
        }
      }
      if (child.name.toLowerCase().includes('wheel')) {
        wheels.push(child);
      }
    });

    wheelRefs.current = wheels;
    return copy;
  }, [scene, paintHex, visualMods.rimFinish]);

  useFrame((_, delta) => {
    for (const w of wheelRefs.current) {
      w.rotation.x += delta * 0.25;
    }
  });

  // Il modello Three.js ferrari.glb guarda lungo -Z: ruotiamo di -PI/2 su Y per allinearlo lungo +X come gli altri modelli
  return (
    <group
      position={[0, visualMods.lowered ? -0.05 : 0, 0]}
      rotation={[0, -Math.PI / 2, 0]}
      scale={1.08}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

export function RealGlbCarModel({
  paintHex,
  visualMods,
  brand,
}: {
  paintHex: string;
  visualMods: VisualModsConfig;
  brand: string;
}) {
  const fallback = (
    <ProceduralCarModel
      archetype="coupe"
      brand={brand}
      paintHex={paintHex}
      visualMods={visualMods}
    />
  );

  return (
    <GlbErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <FerrariGlbScene paintHex={paintHex} visualMods={visualMods} />
      </Suspense>
    </GlbErrorBoundary>
  );
}
