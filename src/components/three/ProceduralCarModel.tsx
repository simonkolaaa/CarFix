import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DEFAULT_VISUAL_MODS,
  type BodyArchetype,
  type VisualModsConfig,
} from '../../core/types';

interface LoftStation {
  /** Longitudinal position from rear (-L/2) to front (+L/2) */
  x: number;
  /** Underbody height */
  yBot: number;
  /** Lower rocker / door swell height */
  ySill: number;
  /** Shoulder / beltline height */
  yBelt: number;
  /** Roof / hood top height */
  yTop: number;
  /** Half-width at sill */
  wSill: number;
  /** Half-width at beltline (widest over fenders) */
  wBelt: number;
  /** Half-width at roof / hood crown (tumblehome!) */
  wTop: number;
  /** Extra hood/trunk crown curvature */
  crown?: number;
}

interface CarProportions {
  wheelbase: number;
  wheelRadius: number;
  tireWidth: number;
  trackHalf: number;
  rideDropBase: number;
  hasHatchLip?: boolean;
  hasSuvCladding?: boolean;
  defaultWing?: boolean;
  glassRange: [number, number]; // [xRearGlass, xFrontGlass]
  stations: LoftStation[];
}

function buildLoftedShell(stations: LoftStation[], closeEnds = true): THREE.BufferGeometry {
  // 14 points around cross-section ordered so d/dj x d/di points OUTWARD
  const ringPoints = (s: LoftStation): Array<[number, number, number]> => {
    const crown = s.crown ?? 0.035;
    const yMidLow = (s.yBot + s.ySill) * 0.5;
    const yMidSide = s.ySill + (s.yBelt - s.ySill) * 0.52;
    const yShoulder = s.yBelt + (s.yTop - s.yBelt) * 0.16;
    const wMidSide = Math.max(s.wSill, s.wBelt) + 0.02;

    return [
      [s.x, s.yBot, 0], // 0 bottom center
      [s.x, yMidLow, -s.wSill * 0.92], // 1 lower right
      [s.x, s.ySill, -s.wSill], // 2 sill right
      [s.x, yMidSide, -wMidSide], // 3 door swell right
      [s.x, s.yBelt, -s.wBelt], // 4 beltline right
      [s.x, yShoulder, -s.wBelt * 0.91], // 5 shoulder right
      [s.x, s.yTop - 0.015, -s.wTop], // 6 roof edge right
      [s.x, s.yTop + crown, -s.wTop * 0.42], // 7 roof inner right
      [s.x, s.yTop + crown * 1.15, 0], // 8 top center
      [s.x, s.yTop + crown, s.wTop * 0.42], // 9 roof inner left
      [s.x, s.yTop - 0.015, s.wTop], // 10 roof edge left
      [s.x, yShoulder, s.wBelt * 0.91], // 11 shoulder left
      [s.x, s.yBelt, s.wBelt], // 12 beltline left
      [s.x, yMidSide, wMidSide], // 13 door swell left
      [s.x, s.ySill, s.wSill], // 14 sill left
      [s.x, yMidLow, s.wSill * 0.92], // 15 lower left
    ];
  };

  const rings = stations.map(ringPoints);
  const M = rings[0].length;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const ring of rings) {
    for (const [x, y, z] of ring) {
      positions.push(x, y, z);
    }
  }

  for (let i = 0; i < rings.length - 1; i++) {
    const rowA = i * M;
    const rowB = (i + 1) * M;
    for (let j = 0; j < M; j++) {
      const jNext = (j + 1) % M;
      const a = rowA + j;
      const b = rowB + j;
      const c = rowB + jNext;
      const d = rowA + jNext;
      // Outward CCW winding: (a, d, b) and (d, c, b)
      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  if (closeEnds) {
    // Rear cap at station 0 (normal -X)
    const rearCenterIdx = positions.length / 3;
    const s0 = stations[0];
    positions.push(s0.x - 0.04, (s0.yBot + s0.yBelt) * 0.52, 0);
    for (let j = 0; j < M; j++) {
      const jNext = (j + 1) % M;
      indices.push(rearCenterIdx, j, jNext);
    }

    // Front cap at last station (normal +X)
    const lastRow = (rings.length - 1) * M;
    const sLast = stations[stations.length - 1];
    const frontCenterIdx = positions.length / 3;
    positions.push(sLast.x + 0.04, (sLast.yBot + sLast.yBelt) * 0.52, 0);
    for (let j = 0; j < M; j++) {
      const jNext = (j + 1) % M;
      indices.push(frontCenterIdx, lastRow + jNext, lastRow + j);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildGreenhouseShell(stations: LoftStation[]): THREE.BufferGeometry {
  const glassStations: LoftStation[] = stations.map((s) => ({
    x: s.x,
    yBot: s.yBelt - 0.02,
    ySill: s.yBelt + 0.01,
    yBelt: (s.yBelt + s.yTop) * 0.52,
    yTop: s.yTop - 0.02,
    wSill: s.wBelt * 0.89,
    wBelt: (s.wBelt * 0.86 + s.wTop * 0.96) * 0.5,
    wTop: s.wTop * 0.95,
    crown: (s.crown ?? 0.03) * 0.8,
  }));
  return buildLoftedShell(glassStations, true);
}

const ARCHETYPES: Record<BodyArchetype, CarProportions> = {
  // Sagoma scolpita VW Golf Mk5/Mk7: cofano compatto, montante C pieno, lunotto inclinato
  hatchback: {
    wheelbase: 2.58,
    wheelRadius: 0.34,
    tireWidth: 0.23,
    trackHalf: 0.84,
    rideDropBase: 0,
    hasHatchLip: true,
    glassRange: [-1.72, 0.96],
    stations: [
      { x: -2.08, yBot: 0.24, ySill: 0.34, yBelt: 0.78, yTop: 0.84, wSill: 0.70, wBelt: 0.78, wTop: 0.66, crown: 0.02 },
      { x: -2.01, yBot: 0.20, ySill: 0.31, yBelt: 0.91, yTop: 1.06, wSill: 0.80, wBelt: 0.88, wTop: 0.69, crown: 0.03 },
      { x: -1.78, yBot: 0.19, ySill: 0.30, yBelt: 0.94, yTop: 1.38, wSill: 0.84, wBelt: 0.92, wTop: 0.66, crown: 0.04 },
      { x: -1.32, yBot: 0.18, ySill: 0.29, yBelt: 0.94, yTop: 1.44, wSill: 0.85, wBelt: 0.94, wTop: 0.66, crown: 0.045 },
      { x: -0.65, yBot: 0.18, ySill: 0.29, yBelt: 0.93, yTop: 1.45, wSill: 0.85, wBelt: 0.90, wTop: 0.66, crown: 0.045 },
      { x: 0.15, yBot: 0.18, ySill: 0.29, yBelt: 0.92, yTop: 1.44, wSill: 0.85, wBelt: 0.90, wTop: 0.66, crown: 0.045 },
      { x: 0.42, yBot: 0.18, ySill: 0.29, yBelt: 0.91, yTop: 1.38, wSill: 0.85, wBelt: 0.90, wTop: 0.67, crown: 0.04 },
      { x: 0.98, yBot: 0.18, ySill: 0.29, yBelt: 0.89, yTop: 0.97, wSill: 0.85, wBelt: 0.92, wTop: 0.78, crown: 0.035 },
      { x: 1.45, yBot: 0.19, ySill: 0.30, yBelt: 0.84, yTop: 0.90, wSill: 0.84, wBelt: 0.91, wTop: 0.77, crown: 0.035 },
      { x: 1.92, yBot: 0.20, ySill: 0.31, yBelt: 0.72, yTop: 0.78, wSill: 0.78, wBelt: 0.85, wTop: 0.70, crown: 0.025 },
      { x: 2.10, yBot: 0.22, ySill: 0.32, yBelt: 0.56, yTop: 0.62, wSill: 0.66, wBelt: 0.74, wTop: 0.58, crown: 0.015 },
    ],
  },

  // Berlina 3 volumi sportiva (Alfa Giulia / BMW E90)
  sedan: {
    wheelbase: 2.82,
    wheelRadius: 0.35,
    tireWidth: 0.24,
    trackHalf: 0.86,
    rideDropBase: 0,
    glassRange: [-1.46, 0.98],
    stations: [
      { x: -2.34, yBot: 0.23, ySill: 0.33, yBelt: 0.78, yTop: 0.84, wSill: 0.72, wBelt: 0.80, wTop: 0.68, crown: 0.02 },
      { x: -2.22, yBot: 0.20, ySill: 0.31, yBelt: 0.92, yTop: 0.98, wSill: 0.82, wBelt: 0.91, wTop: 0.75, crown: 0.025 },
      { x: -1.68, yBot: 0.18, ySill: 0.29, yBelt: 0.95, yTop: 1.02, wSill: 0.86, wBelt: 0.94, wTop: 0.76, crown: 0.03 },
      { x: -1.04, yBot: 0.18, ySill: 0.29, yBelt: 0.95, yTop: 1.38, wSill: 0.87, wBelt: 0.95, wTop: 0.67, crown: 0.045 },
      { x: -0.25, yBot: 0.18, ySill: 0.29, yBelt: 0.94, yTop: 1.41, wSill: 0.87, wBelt: 0.92, wTop: 0.67, crown: 0.045 },
      { x: 0.34, yBot: 0.18, ySill: 0.29, yBelt: 0.92, yTop: 1.37, wSill: 0.87, wBelt: 0.92, wTop: 0.67, crown: 0.04 },
      { x: 1.02, yBot: 0.18, ySill: 0.29, yBelt: 0.90, yTop: 0.97, wSill: 0.86, wBelt: 0.93, wTop: 0.79, crown: 0.035 },
      { x: 1.72, yBot: 0.19, ySill: 0.30, yBelt: 0.82, yTop: 0.88, wSill: 0.84, wBelt: 0.92, wTop: 0.76, crown: 0.03 },
      { x: 2.24, yBot: 0.20, ySill: 0.30, yBelt: 0.68, yTop: 0.73, wSill: 0.76, wBelt: 0.83, wTop: 0.68, crown: 0.02 },
      { x: 2.36, yBot: 0.22, ySill: 0.31, yBelt: 0.52, yTop: 0.57, wSill: 0.66, wBelt: 0.72, wTop: 0.56, crown: 0.015 },
    ],
  },

  // Station Wagon sportiva (Audi A4 Avant / Octavia RS)
  wagon: {
    wheelbase: 2.82,
    wheelRadius: 0.35,
    tireWidth: 0.24,
    trackHalf: 0.86,
    rideDropBase: 0,
    hasHatchLip: true,
    glassRange: [-2.02, 0.98],
    stations: [
      { x: -2.36, yBot: 0.23, ySill: 0.34, yBelt: 0.80, yTop: 0.88, wSill: 0.72, wBelt: 0.80, wTop: 0.66, crown: 0.02 },
      { x: -2.26, yBot: 0.20, ySill: 0.31, yBelt: 0.94, yTop: 1.24, wSill: 0.82, wBelt: 0.91, wTop: 0.67, crown: 0.03 },
      { x: -1.85, yBot: 0.18, ySill: 0.29, yBelt: 0.95, yTop: 1.41, wSill: 0.86, wBelt: 0.95, wTop: 0.67, crown: 0.04 },
      { x: -0.95, yBot: 0.18, ySill: 0.29, yBelt: 0.95, yTop: 1.44, wSill: 0.87, wBelt: 0.94, wTop: 0.67, crown: 0.045 },
      { x: 0.32, yBot: 0.18, ySill: 0.29, yBelt: 0.92, yTop: 1.42, wSill: 0.87, wBelt: 0.92, wTop: 0.67, crown: 0.04 },
      { x: 1.02, yBot: 0.18, ySill: 0.29, yBelt: 0.90, yTop: 0.97, wSill: 0.86, wBelt: 0.94, wTop: 0.79, crown: 0.035 },
      { x: 1.75, yBot: 0.19, ySill: 0.30, yBelt: 0.82, yTop: 0.88, wSill: 0.84, wBelt: 0.92, wTop: 0.76, crown: 0.03 },
      { x: 2.26, yBot: 0.20, ySill: 0.30, yBelt: 0.68, yTop: 0.73, wSill: 0.76, wBelt: 0.83, wTop: 0.68, crown: 0.02 },
      { x: 2.38, yBot: 0.22, ySill: 0.31, yBelt: 0.52, yTop: 0.57, wSill: 0.66, wBelt: 0.72, wTop: 0.56, crown: 0.015 },
    ],
  },

  // Supercar / Coupé bassa (911 / Huracán / Continental)
  coupe: {
    wheelbase: 2.66,
    wheelRadius: 0.36,
    tireWidth: 0.27,
    trackHalf: 0.90,
    rideDropBase: -0.02,
    defaultWing: true,
    glassRange: [-1.42, 0.88],
    stations: [
      { x: -2.28, yBot: 0.20, ySill: 0.32, yBelt: 0.74, yTop: 0.80, wSill: 0.78, wBelt: 0.88, wTop: 0.74, crown: 0.02 },
      { x: -2.14, yBot: 0.16, ySill: 0.28, yBelt: 0.88, yTop: 0.95, wSill: 0.88, wBelt: 0.99, wTop: 0.78, crown: 0.025 },
      { x: -1.48, yBot: 0.15, ySill: 0.26, yBelt: 0.90, yTop: 1.21, wSill: 0.90, wBelt: 1.00, wTop: 0.68, crown: 0.04 },
      { x: -0.45, yBot: 0.15, ySill: 0.26, yBelt: 0.88, yTop: 1.27, wSill: 0.90, wBelt: 0.95, wTop: 0.66, crown: 0.04 },
      { x: 0.28, yBot: 0.15, ySill: 0.26, yBelt: 0.86, yTop: 1.22, wSill: 0.90, wBelt: 0.95, wTop: 0.66, crown: 0.035 },
      { x: 0.92, yBot: 0.15, ySill: 0.26, yBelt: 0.82, yTop: 0.87, wSill: 0.90, wBelt: 0.98, wTop: 0.80, crown: 0.03 },
      { x: 1.66, yBot: 0.16, ySill: 0.27, yBelt: 0.72, yTop: 0.77, wSill: 0.87, wBelt: 0.96, wTop: 0.77, crown: 0.025 },
      { x: 2.18, yBot: 0.17, ySill: 0.27, yBelt: 0.56, yTop: 0.60, wSill: 0.78, wBelt: 0.86, wTop: 0.68, crown: 0.015 },
      { x: 2.30, yBot: 0.18, ySill: 0.26, yBelt: 0.42, yTop: 0.46, wSill: 0.66, wBelt: 0.74, wTop: 0.56, crown: 0.01 },
    ],
  },

  // SUV / Crossover muscoloso (Formentor / Renegade / Defender / RAM)
  suv: {
    wheelbase: 2.78,
    wheelRadius: 0.41,
    tireWidth: 0.26,
    trackHalf: 0.90,
    rideDropBase: 0.07,
    hasSuvCladding: true,
    hasHatchLip: true,
    glassRange: [-1.92, 1.0],
    stations: [
      { x: -2.30, yBot: 0.34, ySill: 0.46, yBelt: 1.02, yTop: 1.12, wSill: 0.76, wBelt: 0.86, wTop: 0.72, crown: 0.02 },
      { x: -2.18, yBot: 0.30, ySill: 0.42, yBelt: 1.12, yTop: 1.48, wSill: 0.86, wBelt: 0.95, wTop: 0.70, crown: 0.03 },
      { x: -1.72, yBot: 0.28, ySill: 0.40, yBelt: 1.14, yTop: 1.64, wSill: 0.89, wBelt: 0.98, wTop: 0.70, crown: 0.045 },
      { x: -0.75, yBot: 0.28, ySill: 0.40, yBelt: 1.14, yTop: 1.66, wSill: 0.90, wBelt: 0.96, wTop: 0.70, crown: 0.05 },
      { x: 0.35, yBot: 0.28, ySill: 0.40, yBelt: 1.12, yTop: 1.64, wSill: 0.90, wBelt: 0.96, wTop: 0.70, crown: 0.045 },
      { x: 1.05, yBot: 0.28, ySill: 0.40, yBelt: 1.08, yTop: 1.15, wSill: 0.89, wBelt: 0.97, wTop: 0.82, crown: 0.04 },
      { x: 1.85, yBot: 0.30, ySill: 0.41, yBelt: 1.02, yTop: 1.08, wSill: 0.86, wBelt: 0.95, wTop: 0.80, crown: 0.03 },
      { x: 2.24, yBot: 0.32, ySill: 0.42, yBelt: 0.88, yTop: 0.94, wSill: 0.78, wBelt: 0.86, wTop: 0.70, crown: 0.02 },
      { x: 2.34, yBot: 0.34, ySill: 0.42, yBelt: 0.68, yTop: 0.74, wSill: 0.68, wBelt: 0.76, wTop: 0.60, crown: 0.015 },
    ],
  },

  // Muscle Car USA (Mustang / Challenger / Camaro)
  muscle: {
    wheelbase: 2.86,
    wheelRadius: 0.37,
    tireWidth: 0.27,
    trackHalf: 0.91,
    rideDropBase: 0,
    glassRange: [-1.62, 0.86],
    stations: [
      { x: -2.40, yBot: 0.22, ySill: 0.34, yBelt: 0.86, yTop: 0.92, wSill: 0.78, wBelt: 0.88, wTop: 0.74, crown: 0.02 },
      { x: -2.24, yBot: 0.18, ySill: 0.30, yBelt: 0.98, yTop: 1.04, wSill: 0.88, wBelt: 0.99, wTop: 0.80, crown: 0.025 },
      { x: -1.64, yBot: 0.17, ySill: 0.28, yBelt: 0.99, yTop: 1.24, wSill: 0.90, wBelt: 1.00, wTop: 0.68, crown: 0.04 },
      { x: -0.60, yBot: 0.17, ySill: 0.28, yBelt: 0.98, yTop: 1.34, wSill: 0.90, wBelt: 0.96, wTop: 0.67, crown: 0.045 },
      { x: 0.24, yBot: 0.17, ySill: 0.28, yBelt: 0.96, yTop: 1.32, wSill: 0.90, wBelt: 0.96, wTop: 0.67, crown: 0.04 },
      { x: 0.94, yBot: 0.17, ySill: 0.28, yBelt: 0.94, yTop: 1.00, wSill: 0.90, wBelt: 0.98, wTop: 0.82, crown: 0.04 },
      { x: 1.78, yBot: 0.18, ySill: 0.29, yBelt: 0.88, yTop: 0.94, wSill: 0.88, wBelt: 0.97, wTop: 0.80, crown: 0.035 },
      { x: 2.32, yBot: 0.19, ySill: 0.30, yBelt: 0.76, yTop: 0.81, wSill: 0.80, wBelt: 0.88, wTop: 0.72, crown: 0.02 },
      { x: 2.44, yBot: 0.21, ySill: 0.30, yBelt: 0.56, yTop: 0.61, wSill: 0.68, wBelt: 0.76, wTop: 0.60, crown: 0.015 },
    ],
  },

  // JDM Sports (Supra Mk4 / Skyline R34 / MX-5)
  jdm: {
    wheelbase: 2.66,
    wheelRadius: 0.35,
    tireWidth: 0.26,
    trackHalf: 0.88,
    rideDropBase: -0.01,
    defaultWing: true,
    glassRange: [-1.52, 0.88],
    stations: [
      { x: -2.28, yBot: 0.19, ySill: 0.30, yBelt: 0.78, yTop: 0.84, wSill: 0.76, wBelt: 0.86, wTop: 0.72, crown: 0.02 },
      { x: -2.14, yBot: 0.16, ySill: 0.27, yBelt: 0.90, yTop: 0.96, wSill: 0.86, wBelt: 0.97, wTop: 0.76, crown: 0.025 },
      { x: -1.56, yBot: 0.15, ySill: 0.26, yBelt: 0.91, yTop: 1.24, wSill: 0.88, wBelt: 0.98, wTop: 0.66, crown: 0.04 },
      { x: -0.45, yBot: 0.15, ySill: 0.26, yBelt: 0.90, yTop: 1.30, wSill: 0.88, wBelt: 0.94, wTop: 0.66, crown: 0.04 },
      { x: 0.24, yBot: 0.15, ySill: 0.26, yBelt: 0.88, yTop: 1.26, wSill: 0.88, wBelt: 0.94, wTop: 0.66, crown: 0.035 },
      { x: 0.92, yBot: 0.15, ySill: 0.26, yBelt: 0.84, yTop: 0.90, wSill: 0.88, wBelt: 0.96, wTop: 0.79, crown: 0.035 },
      { x: 1.74, yBot: 0.16, ySill: 0.27, yBelt: 0.75, yTop: 0.81, wSill: 0.85, wBelt: 0.94, wTop: 0.76, crown: 0.03 },
      { x: 2.20, yBot: 0.17, ySill: 0.28, yBelt: 0.59, yTop: 0.64, wSill: 0.76, wBelt: 0.84, wTop: 0.66, crown: 0.02 },
      { x: 2.31, yBot: 0.18, ySill: 0.27, yBelt: 0.44, yTop: 0.49, wSill: 0.65, wBelt: 0.72, wTop: 0.56, crown: 0.015 },
    ],
  },
};

const RIM_COLORS: Record<VisualModsConfig['rimFinish'], string> = {
  silver: '#d4d4d8',
  anthracite: '#52525b',
  black: '#1c1c24',
  gold: '#eab308',
  bronze: '#a16207',
};

export interface ProceduralCarModelProps {
  archetype: BodyArchetype;
  brand?: string;
  paintHex: string;
  wheelSpeed?: number;
  exhaustGlow?: number;
  braking?: boolean;
  caliperColor?: string;
  visualMods?: VisualModsConfig;
}

export function ProceduralCarModel({
  archetype,
  brand = 'Volkswagen',
  paintHex,
  wheelSpeed = 0,
  exhaustGlow = 0.15,
  braking = false,
  caliperColor = '#ef4444',
  visualMods = DEFAULT_VISUAL_MODS,
}: ProceduralCarModelProps) {
  const spec = ARCHETYPES[archetype] ?? ARCHETYPES.hatchback;
  const wheelRefs = useRef<Array<THREE.Group | null>>([]);

  const { bodyGeo, glassGeo } = useMemo(() => {
    const body = buildLoftedShell(spec.stations, true);
    const glassStations = spec.stations.filter(
      (s) => s.x >= spec.glassRange[0] - 0.1 && s.x <= spec.glassRange[1] + 0.1,
    );
    const glass =
      glassStations.length >= 2 ? buildGreenhouseShell(glassStations) : buildGreenhouseShell(spec.stations.slice(2, 7));
    return { bodyGeo: body, glassGeo: glass };
  }, [spec]);

  useFrame((_, delta) => {
    if (wheelSpeed === 0) return;
    for (const w of wheelRefs.current) {
      if (w) w.rotation.z -= wheelSpeed * delta;
    }
  });

  const bodyDrop = spec.rideDropBase + (visualMods.lowered ? -0.065 : 0);
  const halfWb = spec.wheelbase / 2;
  const wheelY = spec.wheelRadius;
  const firstStation = spec.stations[0];
  const lastStation = spec.stations[spec.stations.length - 1];
  const rearX = firstStation.x;
  const frontX = lastStation.x;
  const rearY = firstStation.yBelt - 0.04;
  const frontY = lastStation.yBelt + 0.04;
  const rimColor = RIM_COLORS[visualMods.rimFinish] ?? RIM_COLORS.silver;
  const effectiveCaliper = visualMods.bremboCalipers ? '#dc2626' : caliperColor;

  const exhaustPositions = useMemo(() => {
    if (visualMods.exhaustStyle === 'r32_center') return [-0.14, 0.14];
    if (visualMods.exhaustStyle === 'quad') return [-0.58, -0.44, 0.44, 0.58];
    return [-0.52, 0.52];
  }, [visualMods.exhaustStyle]);

  const wheelPositions: Array<[number, number, number]> = [
    [halfWb, wheelY, spec.trackHalf],
    [halfWb, wheelY, -spec.trackHalf],
    [-halfWb, wheelY, spec.trackHalf],
    [-halfWb, wheelY, -spec.trackHalf],
  ];

  const isVwGroup = ['Volkswagen', 'SEAT', 'CUPRA', 'Škoda', 'Audi'].includes(brand);
  const isAlfa = brand === 'Alfa Romeo';
  const isBmw = brand === 'BMW';

  return (
    <group>
      {/* Scocca principale scolpita con curva 3D reale + vernice clearcoat */}
      <group position={[0, bodyDrop, 0]}>
        <mesh geometry={bodyGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={paintHex}
            metalness={0.68}
            roughness={0.19}
            clearcoat={1}
            clearcoatRoughness={0.06}
            envMapIntensity={1.85}
          />
        </mesh>

        {/* Vetri abitacolo incassati a 3D tumblehome */}
        <mesh geometry={glassGeo}>
          <meshPhysicalMaterial
            color="#070a10"
            metalness={0.22}
            roughness={0.05}
            clearcoat={1}
            envMapIntensity={2.3}
          />
        </mesh>

        {/* Minigonne laterali + splitter anteriore */}
        <mesh position={[0, firstStation.yBot + 0.02, 0]} castShadow>
          <boxGeometry args={[frontX - rearX - 0.35, 0.055, spec.trackHalf * 1.98]} />
          <meshStandardMaterial color="#0b0b10" roughness={0.65} metalness={0.3} />
        </mesh>
        <mesh position={[frontX - 0.08, lastStation.yBot + 0.02, 0]}>
          <boxGeometry args={[0.32, 0.04, 1.54]} />
          <meshStandardMaterial color="#111118" roughness={0.35} metalness={0.45} />
        </mesh>

        {/* Griglia anteriore con firma stilistica brand */}
        <mesh position={[frontX - 0.01, frontY - 0.07, 0]}>
          <boxGeometry args={[0.08, 0.16, isAlfa ? 0.34 : 0.88]} />
          <meshStandardMaterial color="#09090d" roughness={0.4} metalness={0.55} />
        </mesh>
        {isVwGroup && (
          <mesh position={[frontX + 0.02, frontY - 0.04, 0]}>
            <boxGeometry args={[0.03, 0.024, 0.88]} />
            <meshStandardMaterial
              color={brand === 'Volkswagen' ? '#ef4444' : '#e4e4e7'}
              emissive={brand === 'Volkswagen' ? '#7f1d1d' : '#000000'}
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
        )}
        {isBmw &&
          [-0.14, 0.14].map((zK) => (
            <mesh key={zK} position={[frontX + 0.02, frontY - 0.04, zK]}>
              <boxGeometry args={[0.04, 0.16, 0.2]} />
              <meshStandardMaterial color="#18181f" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        {isAlfa && (
          <mesh position={[frontX + 0.03, frontY - 0.06, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.16, 0.24, 3]} />
            <meshStandardMaterial color="#18181f" metalness={0.8} roughness={0.25} />
          </mesh>
        )}

        {/* Fari anteriori scolpiti con proiettori e striscia LED DRL */}
        {[-1, 1].map((side) => (
          <group key={`hl-${side}`} position={[frontX - 0.12, frontY + 0.02, side * 0.56]}>
            <mesh rotation={[0, side * -0.18, -0.12]}>
              <boxGeometry args={[0.24, 0.09, 0.3]} />
              <meshStandardMaterial color="#09090f" roughness={0.2} metalness={0.7} />
            </mesh>
            <mesh position={[0.06, -0.02, 0]} rotation={[0, side * -0.18, -0.12]}>
              <boxGeometry args={[0.16, 0.028, 0.28]} />
              <meshStandardMaterial
                color="#e0f2fe"
                emissive="#bae6fd"
                emissiveIntensity={2.8}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}

        {/* Fari posteriori LED 3D + diffusore posteriore */}
        {[-1, 1].map((side) => (
          <mesh
            key={`tl-${side}`}
            position={[rearX + 0.05, rearY + 0.04, side * 0.54]}
            rotation={[0, side * 0.16, 0]}
          >
            <boxGeometry args={[0.14, 0.09, 0.36]} />
            <meshStandardMaterial
              color="#ff1f1f"
              emissive="#ef4444"
              emissiveIntensity={braking ? 5.2 : 2.5}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Diffusore posteriore nero opaco */}
        <mesh position={[rearX + 0.02, firstStation.yBot + 0.06, 0]}>
          <boxGeometry args={[0.16, 0.14, 1.38]} />
          <meshStandardMaterial color="#0a0a0e" roughness={0.55} metalness={0.35} />
        </mesh>

        {/* Spoiler tetto su Hatchback/Wagon + Ala sportiva opzionale */}
        {spec.hasHatchLip && (
          <mesh position={[rearX + 0.26, 1.39, 0]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.24, 0.045, 1.26]} />
            <meshStandardMaterial color={paintHex} metalness={0.65} roughness={0.22} />
          </mesh>
        )}

        {(visualMods.spoiler || spec.defaultWing) && (
          <group position={[rearX + 0.2, rearY + (archetype === 'hatchback' ? 0.68 : 0.34), 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.04, 1.42]} />
              <meshStandardMaterial color="#111117" roughness={0.25} metalness={0.68} />
            </mesh>
            {[-0.44, 0.44].map((zOff) => (
              <mesh key={zOff} position={[0, -0.11, zOff]}>
                <boxGeometry args={[0.14, 0.2, 0.035]} />
                <meshStandardMaterial color="#18181f" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        )}

        {/* Antenna pinna di squalo sul tetto */}
        <mesh position={[-0.95, spec.stations[3].yTop + 0.07, 0]} rotation={[0, 0, -0.35]}>
          <boxGeometry args={[0.16, 0.07, 0.03]} />
          <meshStandardMaterial color="#111116" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Specchietti retrovisori aerodinamici */}
        {[-1, 1].map((side) => (
          <mesh
            key={`mir-${side}`}
            position={[0.62, spec.stations[5]?.yBelt + 0.06 || 0.98, side * (spec.trackHalf + 0.12)]}
            rotation={[0, side * -0.25, 0]}
            castShadow
          >
            <boxGeometry args={[0.15, 0.085, 0.19]} />
            <meshStandardMaterial color="#101016" metalness={0.65} roughness={0.25} />
          </mesh>
        ))}

        {/* Terminali di scarico (Stock / Golf 5 R32 Centrale / Quad) */}
        {exhaustPositions.map((zOff, idx) => {
          const isR32 = visualMods.exhaustStyle === 'r32_center';
          const tipRadius = isR32 ? 0.056 : 0.044;
          return (
            <group key={idx} position={[rearX - 0.02, firstStation.yBot + 0.05, zOff]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[tipRadius, tipRadius, 0.18, 20]} />
                <meshStandardMaterial color="#e4e4e7" metalness={0.96} roughness={0.14} />
              </mesh>
              <mesh position={[-0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[tipRadius * 0.76, tipRadius * 0.76, 0.06, 16]} />
                <meshStandardMaterial
                  color="#18181b"
                  emissive="#f97316"
                  emissiveIntensity={exhaustGlow * 2.5}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Passaruota scuri concavi + archi ruota attorno alle 4 ruote */}
      {wheelPositions.map((pos, idx) => (
        <group key={`arch-${idx}`} position={[pos[0], pos[1] + 0.04, pos[2] * 0.94]}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry
              args={[spec.wheelRadius + 0.09, spec.wheelRadius + 0.09, 0.28, 24, 1, false, 0, Math.PI]}
            />
            <meshStandardMaterial color="#060609" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* 4 Ruote multi-razza concave + dischi freno ventilati + pinze Brembo */}
      {wheelPositions.map((pos, idx) => {
        const isRight = pos[2] > 0;
        const rotorRadius = visualMods.bremboCalipers
          ? spec.wheelRadius * 0.56
          : spec.wheelRadius * 0.46;

        return (
          <group
            key={idx}
            position={pos}
            ref={(el) => {
              wheelRefs.current[idx] = el;
            }}
          >
            {/* Pneumatico */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[spec.wheelRadius, spec.wheelRadius, spec.tireWidth, 32]} />
              <meshStandardMaterial color="#101014" roughness={0.85} metalness={0.08} />
            </mesh>
            {/* Canale interno cerchio */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry
                args={[spec.wheelRadius * 0.72, spec.wheelRadius * 0.72, spec.tireWidth + 0.008, 24]}
              />
              <meshStandardMaterial color="#18181f" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Bordo esterno cerchio */}
            <mesh position={[0, 0, isRight ? spec.tireWidth * 0.48 : -spec.tireWidth * 0.48]}>
              <torusGeometry args={[spec.wheelRadius * 0.71, 0.022, 10, 28]} />
              <meshStandardMaterial color={rimColor} metalness={0.94} roughness={0.18} />
            </mesh>
            {/* 10 Razze concave */}
            {[0, 1, 2, 3, 4].map((spoke) => (
              <mesh
                key={spoke}
                rotation={[0, 0, (spoke * Math.PI) / 5]}
                position={[0, 0, isRight ? 0.03 : -0.03]}
              >
                <boxGeometry args={[spec.wheelRadius * 1.36, 0.032, spec.tireWidth * 0.85]} />
                <meshStandardMaterial color={rimColor} metalness={0.94} roughness={0.18} />
              </mesh>
            ))}
            {/* Mozzo centrale */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, spec.tireWidth + 0.02, 16]} />
              <meshStandardMaterial color={rimColor} metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Disco freno */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[rotorRadius, rotorRadius, 0.08, 22]} />
              <meshStandardMaterial color="#71717a" metalness={0.88} roughness={0.28} />
            </mesh>
            {/* Pinza freno (Brembo maggiorata o stock) */}
            <mesh position={[-rotorRadius * 0.72, 0.05, isRight ? 0.04 : -0.04]}>
              <boxGeometry
                args={visualMods.bremboCalipers ? [0.14, 0.21, 0.12] : [0.09, 0.14, 0.09]}
              />
              <meshStandardMaterial color={effectiveCaliper} metalness={0.4} roughness={0.32} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
