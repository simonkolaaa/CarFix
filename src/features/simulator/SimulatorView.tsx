import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  Layers,
  Play,
  Power,
  RotateCw,
  ScanLine,
  Sparkles,
  Unplug,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  ENGINE_PART_LIST,
  SIMULATOR_SCENARIOS,
  getPartSpecsForPowertrain,
  getPowertrainLayoutFromFuel,
  type EnginePartId,
  type PowertrainLayout,
  type SimulatorScenario,
} from '../../data/simulatorScenarios';
import { CATALOG, CATALOG_BY_ID } from '../../data/catalog';
import { ENGINES_BY_ID } from '../../data/engines';
import { EngineBay3D, type SimPartRuntimeState } from '../../components/three/EngineBay3D';

interface SimulatorViewProps {
  initialVehicleId?: string | null;
}

function buildInitialPartStates(
  scenario: SimulatorScenario,
): Record<EnginePartId, SimPartRuntimeState> {
  const result = {} as Record<EnginePartId, SimPartRuntimeState>;
  for (const part of ENGINE_PART_LIST) {
    result[part.id] = {
      faulty: Boolean(scenario.initialFaults[part.id]),
      disconnected: false,
      removed: false,
      upgraded: false,
    };
  }
  return result;
}

export function computeSimulatorTelemetry(
  baseHp: number,
  baseNm: number,
  layout: PowertrainLayout,
  partStates: Record<EnginePartId, SimPartRuntimeState>,
  ignitionOn: boolean,
  engineRunning: boolean,
  throttleRpm: number,
) {
  const specs = Object.values(getPartSpecsForPowertrain(layout));
  let hpBonus = 0;
  let nmBonus = 0;
  let boostBonus = 0;
  let iatBonus = 0;
  const activeDtcs: Array<{ partId: EnginePartId; code: string; reason: string }> = [];

  for (const spec of specs) {
    const st = partStates[spec.id];
    if (st.upgraded && !st.faulty && !st.disconnected && !st.removed) {
      hpBonus += spec.hpDelta;
      nmBonus += spec.nmDelta;
      boostBonus += spec.boostDeltaBar;
      iatBonus += spec.iatDeltaC;
    }
    if (st.faulty) {
      activeDtcs.push({
        partId: spec.id,
        code: spec.faultDtc,
        reason: spec.faultTitle,
      });
    } else if (st.disconnected || st.removed) {
      activeDtcs.push({
        partId: spec.id,
        code: spec.faultDtc,
        reason: `${spec.shortLabel}: connettore scollegato o componente smontato`,
      });
    }
  }

  const batteryDown =
    partStates.battery.faulty || partStates.battery.disconnected || partStates.battery.removed;
  const cannotRun =
    batteryDown ||
    partStates.timing.removed ||
    partStates.block.removed ||
    partStates.coils.disconnected ||
    partStates.coils.removed;

  const actualRunning = ignitionOn && engineRunning && !cannotRun;
  const rpm = actualRunning ? throttleRpm : 0;
  const loadRatio = actualRunning ? Math.max(0.15, (rpm - 850) / 5650) : 0;

  const peakHp = Math.max(
    40,
    Math.round((baseHp + hpBonus) * (partStates.turbo.faulty ? 0.68 : 1)),
  );
  const peakNm = Math.max(
    80,
    Math.round((baseNm + nmBonus) * (partStates.turbo.faulty ? 0.72 : 1)),
  );
  const currentBoost =
    actualRunning && layout !== 'elettrico' && !partStates.turbo.removed
      ? Number(((0.95 + boostBonus) * loadRatio - (partStates.turbo.faulty ? 0.4 : 0)).toFixed(2))
      : 0;
  const oilPressureBar =
    actualRunning && layout !== 'elettrico'
      ? partStates.timing.faulty
        ? 0.7
        : Number((1.9 + (rpm / 6500) * 3.1).toFixed(1))
      : 0;
  const iatCelsius = actualRunning ? Math.round(42 + loadRatio * 24 + iatBonus) : 22;
  const voltage = !ignitionOn
    ? 0
    : actualRunning
      ? layout === 'elettrico'
        ? 398
        : 14.3
      : partStates.battery.faulty
        ? 10.8
        : partStates.battery.upgraded
          ? 13.4
          : 12.6;

  return {
    actualRunning,
    cannotRun,
    rpm,
    peakHp,
    peakNm,
    currentBoost,
    oilPressureBar,
    iatCelsius,
    voltage,
    activeDtcs,
  };
}

export function SimulatorView({ initialVehicleId }: SimulatorViewProps) {
  const [scenarioId, setScenarioId] = useState<string>(SIMULATOR_SCENARIOS[0].id);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialVehicleId ?? 'vw-golf-5-gti',
  );

  useEffect(() => {
    if (initialVehicleId && CATALOG_BY_ID[initialVehicleId]) {
      setSelectedVehicleId(initialVehicleId);
      setScenarioId(SIMULATOR_SCENARIOS[0].id);
    }
  }, [initialVehicleId]);

  const scenario =
    SIMULATOR_SCENARIOS.find((s) => s.id === scenarioId) ?? SIMULATOR_SCENARIOS[0];
  const selectedVehicle = CATALOG_BY_ID[selectedVehicleId] ?? CATALOG[0];
  const selectedEngine = ENGINES_BY_ID[selectedVehicle.engineId];

  const isCustomVehicleMode = scenario.id === 'free-dyno';
  const powertrainLayout: PowertrainLayout = isCustomVehicleMode
    ? getPowertrainLayoutFromFuel(selectedEngine?.fuelType ?? 'Benzina')
    : scenario.powertrain;

  const paintHex = isCustomVehicleMode ? selectedVehicle.defaultColor : '#881337';
  const displayVehicleName = isCustomVehicleMode
    ? `${selectedVehicle.brand} ${selectedVehicle.model}`
    : scenario.vehicleName;
  const baseHp = isCustomVehicleMode ? selectedVehicle.powerHp : scenario.baseHp;
  const baseNm = isCustomVehicleMode ? selectedVehicle.torqueNm : scenario.baseNm;

  const partSpecsById = useMemo(
    () => getPartSpecsForPowertrain(powertrainLayout),
    [powertrainLayout],
  );
  const partSpecList = useMemo(() => Object.values(partSpecsById), [partSpecsById]);

  const [partStates, setPartStates] = useState<Record<EnginePartId, SimPartRuntimeState>>(() =>
    buildInitialPartStates(SIMULATOR_SCENARIOS[0]),
  );
  const [selectedPart, setSelectedPart] = useState<EnginePartId>('coils');
  const [cameraMode, setCameraMode] = useState<'top_electude' | '3d_orbit'>('top_electude');
  const [exploded, setExploded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  const [ignitionOn, setIgnitionOn] = useState(true);
  const [engineRunning, setEngineRunning] = useState(true);
  const [throttleRpm, setThrottleRpm] = useState(1100);
  const [benchTab, setBenchTab] = useState<'parts' | 'obd' | 'multimeter'>('parts');
  const [dtcClearedNotice, setDtcClearedNotice] = useState<string | null>(null);

  const handleSelectScenario = (nextId: string) => {
    const next = SIMULATOR_SCENARIOS.find((s) => s.id === nextId);
    if (!next) return;
    setScenarioId(next.id);
    setPartStates(buildInitialPartStates(next));
    setThrottleRpm(1100);
    setIgnitionOn(true);
    setEngineRunning(true);
    setDtcClearedNotice(null);
    const firstFault = (Object.keys(next.initialFaults) as EnginePartId[]).find(
      (k) => next.initialFaults[k],
    );
    setSelectedPart(firstFault ?? 'coils');
  };

  const updatePart = (id: EnginePartId, patch: Partial<SimPartRuntimeState>) => {
    setPartStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const telemetry = useMemo(
    () =>
      computeSimulatorTelemetry(
        baseHp,
        baseNm,
        powertrainLayout,
        partStates,
        ignitionOn,
        engineRunning,
        throttleRpm,
      ),
    [baseHp, baseNm, powertrainLayout, partStates, ignitionOn, engineRunning, throttleRpm],
  );

  const activeSpec = partSpecsById[selectedPart];
  const activeRuntime = partStates[selectedPart];

  return (
    <section className="min-h-screen bg-[#07070a] px-4 pb-20 pt-24 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header + Scelta Auto / Work Order */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Engine Bay Simulator 3D
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              Scegli qualsiasi auto dal catalogo per ispezionare il vano motore, accendere il
              propulsore in 3D con tutti i componenti in movimento o testare sensori e guasti.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SIMULATOR_SCENARIOS.map((sc) => {
              const active = sc.id === scenario.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(sc.id)}
                  className={`font-mono-tech cursor-pointer rounded-xl border px-3 py-2 text-left text-[11px] transition ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/15 text-white'
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="block text-[9px] text-cyan-300">{sc.badge}</span>
                  <span className="font-semibold">{sc.title.split('—')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra selezione auto reale per morphing istantaneo del vano motore */}
        <div className="glass-hud flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-tech flex items-center gap-1.5 text-[11px] uppercase text-cyan-300">
              <Car className="h-4 w-4" />
              Scegli Veicolo Reale:
            </span>
            <select
              aria-label="Scegli veicolo Simulator"
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(e.target.value);
                setScenarioId('free-dyno');
                setPartStates(buildInitialPartStates(SIMULATOR_SCENARIOS[0]));
              }}
              className="rounded-xl border border-white/15 bg-[#0d0d12] px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
            >
              {CATALOG.map((car) => {
                const f = ENGINES_BY_ID[car.engineId]?.fuelType ?? '';
                return (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} · [{f}] · {car.powerHp} CV
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tech rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase text-cyan-200">
              Architettura: {powertrainLayout.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() =>
                setCameraMode((m) => (m === 'top_electude' ? '3d_orbit' : 'top_electude'))
              }
              className={`font-mono-tech flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition ${
                cameraMode === 'top_electude'
                  ? 'border-cyan-400 bg-cyan-400 text-black'
                  : 'border-white/15 bg-white/10 text-white'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              {cameraMode === 'top_electude' ? 'Vista Electude Reale' : 'Motore 3D Reale'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT: VANO MOTORE 3D ELECTUDE + TELEMETRIA BANCO */}
          <div className="space-y-4 lg:col-span-7">
            <div className="glass-hud relative h-[430px] overflow-hidden rounded-3xl sm:h-[500px]">
              <EngineBay3D
                vehicle={selectedVehicle}
                engine={selectedEngine}
                powertrainLayout={powertrainLayout}
                paintHex={paintHex}
                partStates={partStates}
                selectedPart={selectedPart}
                onSelectPart={setSelectedPart}
                exploded={exploded}
                cameraMode={cameraMode}
                multimeterActive={benchTab === 'multimeter'}
                rpm={telemetry.rpm}
                running={telemetry.actualRunning}
                autoRotate={autoRotate}
              />

              {/* Top Overlay Controlli */}
              <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-2">
                <div className="pointer-events-auto rounded-xl border border-white/15 bg-black/80 px-3 py-2 backdrop-blur-md">
                  <p className="font-mono-tech text-[10px] uppercase text-cyan-300">
                    {displayVehicleName} ({powertrainLayout.toUpperCase()})
                  </p>
                  <p className="text-xs font-bold text-white">
                    Selezionato: {activeSpec.name}
                  </p>
                </div>

                <div className="pointer-events-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExploded((v) => !v)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      exploded
                        ? 'bg-cyan-400 text-black'
                        : 'border border-white/15 bg-black/80 text-white hover:bg-black'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    {exploded ? 'Vista Intera' : 'Zoom Pezzo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoRotate((v) => !v)}
                    className={`cursor-pointer rounded-xl p-2 transition ${
                      autoRotate
                        ? 'bg-cyan-400 text-black'
                        : 'border border-white/15 bg-black/80 text-zinc-300'
                    }`}
                    title="Ruota automaticamente"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Telemetria Banco */}
              <div className="pointer-events-none absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                <div className="rounded-xl border border-white/10 bg-black/85 p-2 backdrop-blur-md">
                  <span className="font-mono-tech text-[9px] uppercase text-zinc-400">
                    {powertrainLayout === 'elettrico' ? 'RPM Rotore' : 'Giri Motore'}
                  </span>
                  <p className="font-mono-tech text-xs font-bold text-cyan-300">
                    {telemetry.rpm} rpm
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/85 p-2 backdrop-blur-md">
                  <span className="font-mono-tech text-[9px] uppercase text-zinc-400">Potenza</span>
                  <p className="font-mono-tech text-xs font-bold text-white">{telemetry.peakHp} CV</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/85 p-2 backdrop-blur-md">
                  <span className="font-mono-tech text-[9px] uppercase text-zinc-400">Coppia</span>
                  <p className="font-mono-tech text-xs font-bold text-white">{telemetry.peakNm} Nm</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/85 p-2 backdrop-blur-md">
                  <span className="font-mono-tech text-[9px] uppercase text-zinc-400">
                    {powertrainLayout === 'elettrico' ? 'Inverter' : 'Boost'}
                  </span>
                  <p className="font-mono-tech text-xs font-bold text-emerald-300">
                    {powertrainLayout === 'elettrico'
                      ? `${telemetry.voltage} V`
                      : `${telemetry.currentBoost} bar`}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/85 p-2 backdrop-blur-md">
                  <span className="font-mono-tech text-[9px] uppercase text-zinc-400">
                    {powertrainLayout === 'elettrico' ? 'Bypass' : 'P. Olio'}
                  </span>
                  <p
                    className={`font-mono-tech text-xs font-bold ${
                      telemetry.oilPressureBar < 1 && telemetry.actualRunning && powertrainLayout !== 'elettrico'
                        ? 'text-rose-400'
                        : 'text-white'
                    }`}
                  >
                    {powertrainLayout === 'elettrico' ? 'OK' : `${telemetry.oilPressureBar} bar`}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/85 p-2 backdrop-blur-md">
                  <span className="font-mono-tech text-[9px] uppercase text-zinc-400">Temp / 12V</span>
                  <p className="font-mono-tech text-xs font-bold text-amber-300">
                    {telemetry.iatCelsius}°C · {powertrainLayout === 'elettrico' ? '12.6V' : `${telemetry.voltage}V`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: BANK DIAGNOSTICA ELECTUDE + STRUMENTI + UPGRADES */}
          <div className="space-y-4 lg:col-span-5">
            <div className="glass-hud rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-amber-300">
                  {scenario.badge}
                </span>
                {telemetry.activeDtcs.length === 0 ? (
                  <span className="font-mono-tech flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Sistema OK
                  </span>
                ) : (
                  <span className="font-mono-tech flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    <AlertTriangle className="h-3 w-3" />
                    {telemetry.activeDtcs.length} Errori OBD
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-200">
                {scenario.customerComplaint}
              </p>
              <p className="mt-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-[11px] text-cyan-200">
                <strong>Suggerimento:</strong> {scenario.hint}
              </p>
            </div>

            {/* Quadro Accensione + Acceleratore */}
            <div className="glass-hud rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIgnitionOn((v) => !v)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      ignitionOn ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {ignitionOn ? 'Quadro ON' : 'Quadro OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEngineRunning((v) => !v)}
                    disabled={!ignitionOn}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      telemetry.actualRunning
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {telemetry.actualRunning ? 'Acceso' : 'Avvia'}
                  </button>
                </div>
                <span className="font-mono-tech text-xs text-zinc-300">
                  {telemetry.rpm} giri/min
                </span>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="font-mono-tech uppercase text-zinc-400">
                    Pedale Acceleratore (Banco Prova)
                  </span>
                  <span className="font-mono-tech text-cyan-300">
                    {powertrainLayout === 'elettrico' ? '0 → 14.000 RPM' : '850 → 6.500 RPM'}
                  </span>
                </div>
                <input
                  type="range"
                  min={850}
                  max={6500}
                  step={50}
                  value={throttleRpm}
                  onChange={(e) => setThrottleRpm(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Tabs Diagnostica & Modding */}
            <div className="glass-hud rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-black/60 p-1">
                <button
                  type="button"
                  onClick={() => setBenchTab('parts')}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${
                    benchTab === 'parts' ? 'bg-cyan-400 text-black' : 'text-zinc-300'
                  }`}
                >
                  <Wrench className="h-3.5 w-3.5" />
                  Pezzo & Mods
                </button>
                <button
                  type="button"
                  onClick={() => setBenchTab('obd')}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${
                    benchTab === 'obd' ? 'bg-cyan-400 text-black' : 'text-zinc-300'
                  }`}
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  OBD-II
                </button>
                <button
                  type="button"
                  onClick={() => setBenchTab('multimeter')}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${
                    benchTab === 'multimeter' ? 'bg-cyan-400 text-black' : 'text-zinc-300'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Multimetro
                </button>
              </div>

              {benchTab === 'parts' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {partSpecList.map((p, idx) => {
                      const st = partStates[p.id];
                      const bad = st.faulty || st.disconnected || st.removed;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPart(p.id)}
                          className={`font-mono-tech cursor-pointer rounded-lg border px-2 py-1 text-[10px] transition ${
                            selectedPart === p.id
                              ? 'border-cyan-400 bg-cyan-400 text-black font-bold'
                              : bad
                                ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                                : st.upgraded
                                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                                  : 'border-white/10 bg-white/5 text-zinc-300'
                          }`}
                        >
                          {idx + 1}. {p.shortLabel}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/50 p-3.5">
                    <span className="font-mono-tech text-[10px] uppercase text-cyan-300">
                      {activeSpec.system}
                    </span>
                    <h3 className="font-heading text-base font-bold text-white">
                      {activeSpec.name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                      {activeSpec.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeRuntime.faulty && (
                        <button
                          type="button"
                          onClick={() => updatePart(selectedPart, { faulty: false })}
                          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {activeSpec.oemRepairAction}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          updatePart(selectedPart, {
                            disconnected: !activeRuntime.disconnected,
                          })
                        }
                        className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                          activeRuntime.disconnected
                            ? 'border-rose-400 bg-rose-500/20 text-rose-200'
                            : 'border-white/15 bg-white/5 text-zinc-200'
                        }`}
                      >
                        <Unplug className="h-3.5 w-3.5" />
                        {activeRuntime.disconnected ? 'Ricollega Spinotto' : 'Scollega Spinotto'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updatePart(selectedPart, { removed: !activeRuntime.removed })
                        }
                        className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                          activeRuntime.removed
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-white/15 bg-white/5 text-zinc-200'
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        {activeRuntime.removed ? 'Rimonta Pezzo' : 'Smonta Pezzo'}
                      </button>
                    </div>

                    <div className="mt-3 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          updatePart(selectedPart, {
                            upgraded: !activeRuntime.upgraded,
                            faulty: false,
                          })
                        }
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition ${
                          activeRuntime.upgraded
                            ? 'border-emerald-400 bg-emerald-500/15'
                            : 'border-cyan-400/35 bg-cyan-500/10 hover:bg-cyan-500/20'
                        }`}
                      >
                        <div>
                          <p className="font-mono-tech flex items-center gap-1 text-[10px] font-bold uppercase text-cyan-300">
                            <Sparkles className="h-3 w-3" />
                            {activeRuntime.upgraded ? 'Upgrade Montato' : 'Monta Upgrade'}
                          </p>
                          <p className="text-xs font-bold text-white">{activeSpec.upgradeName}</p>
                        </div>
                        <span className="font-mono-tech rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-emerald-300">
                          +{activeSpec.hpDelta} CV / +{activeSpec.nmDelta} Nm
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {benchTab === 'obd' && (
                <div className="space-y-2.5">
                  {telemetry.activeDtcs.length === 0 ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                      Nessun errore DTC in centralina!
                    </div>
                  ) : (
                    telemetry.activeDtcs.map((d) => (
                      <button
                        key={`${d.partId}-${d.code}`}
                        type="button"
                        onClick={() => {
                          setSelectedPart(d.partId);
                          setBenchTab('parts');
                        }}
                        className="flex w-full cursor-pointer items-start justify-between gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-left"
                      >
                        <div>
                          <span className="font-mono-tech text-xs font-bold text-rose-300">
                            {d.code}
                          </span>
                          <p className="text-xs text-zinc-200">{d.reason}</p>
                        </div>
                        <span className="font-mono-tech text-[10px] text-cyan-300">Vai →</span>
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setDtcClearedNotice(
                        telemetry.activeDtcs.length > 0
                          ? 'Ripara o ricollega prima il guasto fisico!'
                          : 'Memoria DTC azzerata!',
                      )
                    }
                    className="w-full cursor-pointer rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-zinc-200"
                  >
                    Cancella Errori OBD
                  </button>
                  {dtcClearedNotice && (
                    <p className="font-mono-tech text-center text-[11px] text-cyan-300">
                      {dtcClearedNotice}
                    </p>
                  )}
                </div>
              )}

              {benchTab === 'multimeter' && (
                <div className="space-y-3 rounded-xl border border-amber-400/35 bg-zinc-950 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech flex items-center gap-1.5 text-[10px] uppercase text-amber-300">
                      <Zap className="h-3.5 w-3.5" />
                      Multimetro + Puntali 3D su {activeSpec.shortLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-emerald-500/30 bg-black p-3">
                      <span className="font-mono-tech text-[9px] uppercase text-zinc-400">
                        Tensione (V DC)
                      </span>
                      <p className="font-mono-tech mt-1 text-sm font-bold text-emerald-300">
                        {!ignitionOn
                          ? '0.00 V'
                          : activeRuntime.disconnected || activeRuntime.removed
                            ? '0.00 V (Aperto)'
                            : activeRuntime.faulty
                              ? activeSpec.faultVoltage
                              : activeSpec.healthyVoltage}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-500/30 bg-black p-3">
                      <span className="font-mono-tech text-[9px] uppercase text-zinc-400">
                        Resistenza (Ω)
                      </span>
                      <p className="font-mono-tech mt-1 text-sm font-bold text-cyan-300">
                        {activeRuntime.disconnected || activeRuntime.removed
                          ? '∞ Ω (Circuito aperto)'
                          : activeRuntime.faulty
                            ? activeSpec.faultOhms
                            : activeSpec.healthyOhms}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
