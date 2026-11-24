import { useState } from 'react';
import type { EngineWiki, VehicleModel } from '../../core/types';
import {
  getPartSpecsForPowertrain,
  type EnginePartId,
  type PowertrainLayout,
} from '../../data/simulatorScenarios';
import { RealKinematicEngine3D } from './RealKinematicEngine3D';

export interface SimPartRuntimeState {
  faulty: boolean;
  disconnected: boolean;
  removed: boolean;
  upgraded: boolean;
}

interface EngineBay3DProps {
  vehicle?: VehicleModel;
  engine?: EngineWiki;
  powertrainLayout: PowertrainLayout;
  paintHex: string;
  partStates: Record<EnginePartId, SimPartRuntimeState>;
  selectedPart: EnginePartId;
  onSelectPart: (id: EnginePartId) => void;
  exploded: boolean;
  cameraMode: 'top_electude' | '3d_orbit';
  multimeterActive: boolean;
  rpm: number;
  running: boolean;
  autoRotate: boolean;
}

// Coordinate percentuali calibrate esattamente sopra la foto ufficiale Electude (./simulator/electude-bay.jpg)
const ELECTUDE_PIN_COORDS: Record<EnginePartId, { x: number; y: number }> = {
  coils: { x: 43, y: 51 }, // 4 bobine nere con connettori colorati
  block: { x: 35, y: 55 }, // Testata & monoblocco in alluminio
  timing: { x: 25, y: 56 }, // Lato distribuzione / cinghia servizi a sinistra
  turbo: { x: 41, y: 39 }, // Collettore/turbina sul lato posteriore
  egr_downpipe: { x: 27, y: 40 }, // EGR / Downpipe / ECU posteriore sinistro
  intake_maf: { x: 75, y: 55 }, // Airbox & manicotto corrugato a destra
  intercooler: { x: 42, y: 74 }, // Ventola / radiatore / intercooler anteriore
  battery: { x: 75, y: 70 }, // Batteria blu 12V in basso a destra
};

const PIN_ORDER = Object.keys(ELECTUDE_PIN_COORDS) as EnginePartId[];

export function EngineBay3D({
  vehicle,
  engine,
  powertrainLayout,
  partStates,
  selectedPart,
  onSelectPart,
  exploded,
  cameraMode,
  multimeterActive,
  rpm,
  running,
}: EngineBay3DProps) {
  const [hoveredPart, setHoveredPart] = useState<EnginePartId | null>(null);
  const partSpecs = getPartSpecsForPowertrain(powertrainLayout);
  const selectedCoord = ELECTUDE_PIN_COORDS[selectedPart];

  const hasMisfire =
    running && (partStates.coils.faulty || partStates.coils.disconnected || partStates.coils.removed);

  // Calcola zoom mirato sul componente quando l'utente attiva "Zoom / Ispeziona"
  const zoomOriginX = `${selectedCoord.x}%`;
  const zoomOriginY = `${selectedCoord.y}%`;

  if (cameraMode === '3d_orbit') {
    return (
      <RealKinematicEngine3D
        vehicle={vehicle}
        engine={engine}
        powertrainLayout={powertrainLayout}
        partStates={partStates}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        rpm={rpm}
        running={running}
        exploded={exploded}
      />
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#4d4e50]">
      {/* Container quadrato centrato sull'immagine esatta Electude */}
      <div
        className={`relative aspect-square h-full max-h-full max-w-full select-none transition-transform duration-500 ease-out ${
          hasMisfire ? 'animate-pulse' : ''
        }`}
        style={{
          transformOrigin: `${zoomOriginX} ${zoomOriginY}`,
          transform: exploded
            ? 'scale(1.42)'
            : running && powertrainLayout !== 'elettrico'
              ? `translateY(${((rpm % 130) / 130) * 0.4}px)`
              : 'none',
        }}
      >
        <img
          src="./simulator/electude-bay.jpg"
          alt="Vano Motore Electude Photorealistic"
          className="h-full w-full object-cover"
          draggable={false}
        />

        {/* Layer visivo dedicato per Diesel / Ibrido / Elettrico (sovraimpressioni realistiche pulite!) */}
        {powertrainLayout === 'diesel' && (
          <div className="pointer-events-none absolute left-[28%] top-[47%] flex flex-col items-center rounded-md border border-zinc-400/50 bg-zinc-900/80 px-2.5 py-1 shadow-lg backdrop-blur-sm">
            <span className="font-mono-tech text-[9px] font-bold tracking-widest text-zinc-200">
              COMMON RAIL · TDI / JTD
            </span>
          </div>
        )}

        {(powertrainLayout === 'ibrido' || powertrainLayout === 'elettrico') && (
          <svg
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {/* Cablaggi Alta Tensione Arancioni (400V HV Busbars) */}
            <path
              d="M 43 44 C 52 44, 62 48, 72 56"
              fill="none"
              stroke="#f97316"
              strokeWidth="2.1"
              strokeLinecap="round"
              opacity="0.92"
            />
            <path
              d="M 43 52 C 55 54, 65 56, 74 63"
              fill="none"
              stroke="#ea580c"
              strokeWidth="1.9"
              strokeLinecap="round"
              opacity="0.9"
            />
            {powertrainLayout === 'elettrico' && (
              <>
                <rect
                  x="27"
                  y="43"
                  width="31"
                  height="21"
                  rx="2.5"
                  fill="rgba(30,41,59,0.9)"
                  stroke="#94a3b8"
                  strokeWidth="0.7"
                />
                <text
                  x="42.5"
                  y="52"
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="3.1"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  EV DRIVE UNIT 400V
                </text>
                <rect x="33" y="55" width="19" height="4.5" rx="1" fill="#f97316" />
                <text
                  x="42.5"
                  y="58.2"
                  textAnchor="middle"
                  fill="#09090b"
                  fontSize="2.3"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  HV INTERLOCK
                </text>
              </>
            )}
          </svg>
        )}

        {/* Maschere componenti smontati */}
        {PIN_ORDER.map((id) => {
          if (!partStates[id].removed) return null;
          const coord = ELECTUDE_PIN_COORDS[id];
          return (
            <div
              key={`rem-${id}`}
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-dashed border-amber-400 bg-black/75 px-2 py-1 text-[9px] font-bold uppercase text-amber-300 backdrop-blur-sm"
            >
              Smontato
            </div>
          );
        })}

        {/* Puntali Rosso & Nero del Multimetro Electude sul componente selezionato */}
        {multimeterActive && (
          <svg
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          >
            {/* Filo & Puntale Rosso (+) */}
            <path
              d={`M ${selectedCoord.x - 10} ${selectedCoord.y - 16} L ${selectedCoord.x - 1.4} ${selectedCoord.y - 0.8}`}
              stroke="#ef4444"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
            <circle
              cx={selectedCoord.x - 1.2}
              cy={selectedCoord.y - 0.6}
              r="1.1"
              fill="#facc15"
              stroke="#ef4444"
              strokeWidth="0.6"
            />
            {/* Filo & Puntale Nero (-) */}
            <path
              d={`M ${selectedCoord.x + 11} ${selectedCoord.y - 15} L ${selectedCoord.x + 1.4} ${selectedCoord.y - 0.8}`}
              stroke="#18181b"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
            <circle
              cx={selectedCoord.x + 1.2}
              cy={selectedCoord.y - 0.6}
              r="1.1"
              fill="#e4e4e7"
              stroke="#18181b"
              strokeWidth="0.6"
            />
          </svg>
        )}

        {/* Hotspot interattivi discreti e precisi sui componenti reali della foto */}
        {PIN_ORDER.map((id, idx) => {
          const coord = ELECTUDE_PIN_COORDS[id];
          const st = partStates[id];
          const isSelected = selectedPart === id;
          const isHovered = hoveredPart === id;
          const hasFault = st.faulty || st.disconnected || st.removed;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPart(id)}
              onMouseEnter={() => setHoveredPart(id)}
              onMouseLeave={() => setHoveredPart(null)}
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              className={`font-mono-tech absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border transition-all ${
                isSelected || isHovered
                  ? 'flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold shadow-xl'
                  : 'flex h-5 w-5 items-center justify-center text-[9px] font-bold shadow-md hover:scale-125'
              } ${
                isSelected
                  ? 'border-cyan-200 bg-cyan-400 text-black ring-4 ring-cyan-400/35'
                  : hasFault
                    ? 'animate-pulse border-rose-300 bg-rose-600 text-white ring-4 ring-rose-500/30'
                    : st.upgraded
                      ? 'border-emerald-300 bg-emerald-500 text-black'
                      : 'border-white/80 bg-black/80 text-white hover:border-cyan-300'
              }`}
            >
              <span>{idx + 1}</span>
              {(isSelected || isHovered) && (
                <span className="whitespace-nowrap">{partSpecs[id].shortLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
