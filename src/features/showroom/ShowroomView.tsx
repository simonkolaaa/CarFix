import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Check,
  Cpu,
  Flame,
  Fuel,
  Globe,
  Info,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Skull,
} from 'lucide-react';
import type {
  FuelType,
  GarageCar,
  ManufacturerGroup,
  RealModSpec,
  VehicleModel,
  VisualModsConfig,
} from '../../core/types';
import { GROUP_LABELS } from '../../core/vehicleRules';
import { CATALOG, CATALOG_BY_ID } from '../../data/catalog';
import { ENGINES_BY_ID } from '../../data/engines';
import { getRecommendedModsForVehicle } from '../../core/modAdvisor';
import {
  computeLiveVehicleTelemetry,
  fetchVehicleLiveWiki,
  type LiveWikiSummary,
} from '../../services/vehicleWikiApi';
import { fetchVehicleRecalls } from '../../services/nhtsaApi';
import { SketchfabViewer3D } from '../../components/three/SketchfabViewer3D';
import { RealGlbCarModel } from '../../components/three/RealGlbCarModel';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';

interface ShowroomViewProps {
  activeVehicleId: string | null;
  paintHex: string;
  paintAppliedNonce: number;
  visualMods: VisualModsConfig;
  onApplyVehicle: (
    vehicleId: string,
    paintHex?: string,
    visualPatch?: Partial<VisualModsConfig>,
    preferredMode?: 'sketchfab' | 'user_photo',
  ) => void;
  onSaveToGarage: (vehicle: VehicleModel, paintHex: string) => GarageCar;
  onOpenWikiEngine: (engineId: string, vehicleId?: string) => void;
  onOpenEuroGuide: (euroId: VehicleModel['euroClass']) => void;
  onOpenSimulator: (vehicleId: string) => void;
}

export function ShowroomView({
  activeVehicleId,
  paintHex,
  paintAppliedNonce,
  visualMods,
  onApplyVehicle,
  onSaveToGarage,
  onOpenWikiEngine,
  onOpenEuroGuide,
  onOpenSimulator,
}: ShowroomViewProps) {
  const effectiveVehicle =
    (activeVehicleId ? CATALOG_BY_ID[activeVehicleId] : null) ??
    CATALOG_BY_ID['vw-golf-5-r32'] ??
    CATALOG[0];

  const activeEngine = ENGINES_BY_ID[effectiveVehicle.engineId];

  const [groupFilter, setGroupFilter] = useState<'ALL' | ManufacturerGroup>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>(effectiveVehicle.brand);
  const [selectedFuel, setSelectedFuel] = useState<'ALL' | FuelType>('ALL');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(effectiveVehicle.id);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [showWikiDrawer, setShowWikiDrawer] = useState(true);

  const [liveWiki, setLiveWiki] = useState<LiveWikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [liveRecallsCount, setLiveRecallsCount] = useState<number>(0);

  // Sincronizza selettori quando activeVehicleId cambia dall'esterno (es. dal Garage o Wiki)
  useEffect(() => {
    setSelectedBrand(effectiveVehicle.brand);
    setSelectedVehicleId(effectiveVehicle.id);
  }, [effectiveVehicle.id, effectiveVehicle.brand]);

  // Carica in tempo reale Wikipedia IT/EN + NHTSA Recalls ogni volta che cambia l'auto selezionata!
  useEffect(() => {
    let active = true;
    setWikiLoading(true);
    setLiveWiki(null);

    Promise.all([
      fetchVehicleLiveWiki(effectiveVehicle),
      fetchVehicleRecalls(
        effectiveVehicle.nhtsaMake,
        effectiveVehicle.nhtsaModel,
        effectiveVehicle.nhtsaYear,
        activeEngine?.euRecalls ?? [],
      ),
    ]).then(([wikiRes, recallRes]) => {
      if (!active) return;
      setLiveWiki(wikiRes);
      setLiveRecallsCount(recallRes.items.length);
      setWikiLoading(false);
    });

    return () => {
      active = false;
    };
  }, [effectiveVehicle, activeEngine]);

  const availableBrands = useMemo(() => {
    const filtered =
      groupFilter === 'ALL' ? CATALOG : CATALOG.filter((c) => c.group === groupFilter);
    return Array.from(new Set(filtered.map((c) => c.brand))).sort((a, b) => a.localeCompare(b));
  }, [groupFilter]);

  const availableFuelsForBrand = useMemo(() => {
    const brandCars = CATALOG.filter((c) => c.brand === selectedBrand);
    const set = new Set<FuelType>();
    for (const car of brandCars) {
      const eng = ENGINES_BY_ID[car.engineId];
      if (eng) set.add(eng.fuelType);
    }
    return Array.from(set);
  }, [selectedBrand]);

  const modelsForBrandAndFuel = useMemo(() => {
    return CATALOG.filter((c) => {
      if (c.brand !== selectedBrand) return false;
      if (selectedFuel === 'ALL') return true;
      return ENGINES_BY_ID[c.engineId]?.fuelType === selectedFuel;
    });
  }, [selectedBrand, selectedFuel]);

  const liveTelemetry = useMemo(() => {
    if (!activeEngine) return null;
    return computeLiveVehicleTelemetry(effectiveVehicle, activeEngine, visualMods, [] as RealModSpec[]);
  }, [effectiveVehicle, activeEngine, visualMods]);

  const topRecommendedMod = useMemo(() => {
    if (!activeEngine) return null;
    return getRecommendedModsForVehicle(effectiveVehicle, activeEngine)[0] ?? null;
  }, [effectiveVehicle, activeEngine]);

  const applyImmediate = (nextId: string) => {
    const chosen = CATALOG_BY_ID[nextId];
    if (!chosen) return;
    setSelectedVehicleId(chosen.id);
    onApplyVehicle(chosen.id, chosen.defaultColor, undefined, 'sketchfab');
  };

  const handleGroupChange = (nextGroup: 'ALL' | ManufacturerGroup) => {
    setGroupFilter(nextGroup);
    const pool = nextGroup === 'ALL' ? CATALOG : CATALOG.filter((c) => c.group === nextGroup);
    if (pool.length > 0) {
      setSelectedBrand(pool[0].brand);
      setSelectedFuel('ALL');
      applyImmediate(pool[0].id);
    }
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedFuel('ALL');
    const first = CATALOG.find((c) => c.brand === brand);
    if (first) applyImmediate(first.id);
  };

  const handleFuelChange = (fuel: 'ALL' | FuelType) => {
    setSelectedFuel(fuel);
    const matches = CATALOG.filter(
      (c) =>
        c.brand === selectedBrand &&
        (fuel === 'ALL' || ENGINES_BY_ID[c.engineId]?.fuelType === fuel),
    );
    if (matches.length > 0) {
      applyImmediate(matches[0].id);
    }
  };

  const handleSaveCurrent = () => {
    onSaveToGarage(effectiveVehicle, paintHex);
    setSavedNotice(`${effectiveVehicle.brand} ${effectiveVehicle.model} salvata nel Garage!`);
    window.setTimeout(() => setSavedNotice(null), 3200);
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#060609] pt-20">
      {/* FULL-BLEED 3D STAGE SENZA CONTORNI O RIQUADRI GRIGI */}
      <div className="absolute inset-0">
        {effectiveVehicle.id === 'ferrari-458-italia' ? (
          <Canvas shadows dpr={[1, 2]} camera={{ position: [4.2, 1.75, 4.4], fov: 38 }}>
            <color attach="background" args={['#060609']} />
            <ambientLight intensity={0.45} />
            <spotLight position={[5, 7, 5]} intensity={85} castShadow />
            <Environment resolution={128}>
              <Lightformer
                form="rect"
                intensity={2.6}
                position={[0, 5, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[10, 3, 1]}
              />
            </Environment>
            <RealGlbCarModel paintHex={paintHex} visualMods={visualMods} brand={effectiveVehicle.brand} />
            <ContactShadows position={[0, 0.01, 0]} opacity={0.78} scale={8} blur={2} />
            <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.6} minDistance={3.2} maxDistance={9} />
          </Canvas>
        ) : (
          <SketchfabViewer3D
            vehicle={effectiveVehicle}
            paintHex={paintHex}
            paintAppliedNonce={paintAppliedNonce}
            visualMods={visualMods}
          />
        )}
      </div>

      {/* Top Floating HUD Selector */}
      <div className="pointer-events-none relative z-20 mx-auto max-w-7xl px-3 pt-2 sm:px-6">
        <div className="glass-hud pointer-events-auto rounded-2xl p-3 sm:p-3.5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleGroupChange('ALL')}
                className={`font-mono-tech cursor-pointer rounded-lg px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
                  groupFilter === 'ALL'
                    ? 'bg-cyan-400 font-bold text-black'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                Tutti ({CATALOG.length})
              </button>
              {(Object.keys(GROUP_LABELS) as ManufacturerGroup[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGroupChange(g)}
                  className={`font-mono-tech cursor-pointer rounded-lg px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
                    groupFilter === g
                      ? 'bg-cyan-400 font-bold text-black'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {GROUP_LABELS[g].label}
                </button>
              ))}
            </div>
            <span className="font-mono-tech hidden text-[10px] uppercase tracking-widest text-cyan-300/90 sm:inline">
              LIVE 3D
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <label className="font-mono-tech mb-1 block text-[10px] uppercase tracking-widest text-zinc-400">
                1 · Brand
              </label>
              <select
                aria-label="Select Brand"
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="font-mono-tech mb-1 flex items-center gap-1 text-[10px] uppercase tracking-widest text-cyan-300">
                <Fuel className="h-3 w-3" />
                2 · Alimentazione
              </label>
              <select
                aria-label="Select Fuel Type"
                value={selectedFuel}
                onChange={(e) => handleFuelChange(e.target.value as 'ALL' | FuelType)}
                className="w-full cursor-pointer rounded-xl border border-cyan-400/30 bg-[#0d0d12] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="ALL">
                  Tutte ({CATALOG.filter((c) => c.brand === selectedBrand).length})
                </option>
                {availableFuelsForBrand.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="font-mono-tech mb-1 block text-[10px] uppercase tracking-widest text-zinc-400">
                3 · Serie, Modello & Motore
              </label>
              <select
                aria-label="Select Model"
                value={selectedVehicleId}
                onChange={(e) => applyImmediate(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#0d0d12] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {modelsForBrandAndFuel.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.model} · {m.powerHp} CV ({m.years})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end sm:col-span-2">
              <button
                type="button"
                onClick={() => applyImmediate(selectedVehicleId)}
                className="flex h-[38px] w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3 text-sm font-bold text-black shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LEFT TELEMETRY CARD (si aggiorna in tempo reale per ogni auto e mod!) */}
      {activeEngine && liveTelemetry && (
        <motion.div
          key={effectiveVehicle.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-none relative z-20 mx-auto mt-4 max-w-7xl px-3 sm:px-6"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="glass-hud pointer-events-auto rounded-2xl p-4 lg:col-span-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono-tech rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] uppercase text-zinc-300">
                  {effectiveVehicle.generation} · {effectiveVehicle.years}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenEuroGuide(effectiveVehicle.euroClass)}
                  className="font-mono-tech flex cursor-pointer items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                >
                  <Info className="h-3 w-3" />
                  {effectiveVehicle.euroClass.replace('_', ' ')}
                </button>
                <span
                  className={`font-mono-tech inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    activeEngine.verdictTier === 'hall_of_fame'
                      ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : activeEngine.verdictTier === 'hall_of_shame'
                        ? 'border border-rose-500/40 bg-rose-500/15 text-rose-300'
                        : 'border border-amber-500/40 bg-amber-500/15 text-amber-300'
                  }`}
                >
                  {activeEngine.verdictTier === 'hall_of_fame' ? (
                    <Award className="h-3 w-3" />
                  ) : activeEngine.verdictTier === 'hall_of_shame' ? (
                    <Skull className="h-3 w-3" />
                  ) : (
                    <ShieldCheck className="h-3 w-3" />
                  )}
                  {activeEngine.reliabilityScore}/100
                </span>
              </div>

              <h2 className="font-display mt-2 text-2xl font-bold leading-tight text-white">
                {effectiveVehicle.brand} {effectiveVehicle.model}
              </h2>
              <p className="font-mono-tech mt-0.5 text-xs text-cyan-300">
                {activeEngine.code} · {activeEngine.fuelType}
              </p>

              {/* Griglia Telemetria Real-Time */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="rounded-xl border border-white/10 bg-black/55 p-2 text-center">
                  <p className="font-mono-tech text-[9px] uppercase text-zinc-400">Potenza</p>
                  <p className="font-mono-tech text-sm font-bold text-white">
                    {liveTelemetry.liveHp} <span className="text-[10px] text-zinc-400">CV</span>
                  </p>
                  {liveTelemetry.hpDelta > 0 && (
                    <p className="font-mono-tech text-[9px] text-emerald-400">
                      +{liveTelemetry.hpDelta} mod
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/55 p-2 text-center">
                  <p className="font-mono-tech text-[9px] uppercase text-zinc-400">Coppia</p>
                  <p className="font-mono-tech text-sm font-bold text-white">
                    {liveTelemetry.liveNm} <span className="text-[10px] text-zinc-400">Nm</span>
                  </p>
                  {liveTelemetry.nmDelta > 0 && (
                    <p className="font-mono-tech text-[9px] text-emerald-400">
                      +{liveTelemetry.nmDelta}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/55 p-2 text-center">
                  <p className="font-mono-tech text-[9px] uppercase text-zinc-400">0–100</p>
                  <p className="font-mono-tech text-sm font-bold text-cyan-300">
                    {liveTelemetry.live0To100}s
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/55 p-2 text-center">
                  <p className="font-mono-tech text-[9px] uppercase text-zinc-400">Vmax</p>
                  <p className="font-mono-tech text-sm font-bold text-white">
                    {liveTelemetry.topSpeedKmh}
                  </p>
                </div>
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-zinc-300">
                {effectiveVehicle.highlightNote}
              </p>

              {/* Codici Motore Live Pills */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {activeEngine.engineCodes.slice(0, 4).map((c) => (
                  <span
                    key={c.code}
                    className={`font-mono-tech rounded-md px-1.5 py-0.5 text-[10px] ${
                      c.status === 'recommended'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : c.status === 'avoid'
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {c.code}
                  </span>
                ))}
              </div>
            </div>

            {/* Spazio centrale completamente libero sull'auto 3D */}
            <div className="hidden lg:col-span-4 lg:block" />

            {/* RIGHT LIVE WIKI & NHTSA CARD */}
            <div className="lg:col-span-4 flex flex-col items-end gap-2">
              <div className="glass-hud pointer-events-auto w-full rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tech flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-cyan-300">
                    <Globe className="h-3.5 w-3.5" />
                    Wiki & Richiami Live
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-tech inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                      <ShieldAlert className="h-3 w-3" />
                      {liveRecallsCount} Richiami
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowWikiDrawer((v) => !v)}
                      className="font-mono-tech cursor-pointer text-[10px] text-zinc-400 hover:text-white"
                    >
                      {showWikiDrawer ? 'Riduci' : 'Espandi'}
                    </button>
                  </div>
                </div>

                {showWikiDrawer && (
                  <div className="mt-2.5 space-y-2.5">
                    {wikiLoading ? (
                      <div className="flex items-center gap-2 py-3 text-xs text-zinc-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                        Recupero dati live Wikipedia & NHTSA...
                      </div>
                    ) : (
                      liveWiki && (
                        <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white">{liveWiki.title}</span>
                            <span className="font-mono-tech text-[9px] uppercase text-cyan-300/80">
                              Scheda Live
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-6 text-[11px] leading-relaxed text-zinc-300">
                            {liveWiki.extract}
                          </p>
                        </div>
                      )
                    )}

                    {topRecommendedMod && (
                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-2.5 text-[11px]">
                        <p className="font-mono-tech text-[9px] uppercase text-emerald-300">
                          Mod consigliata ({topRecommendedMod.mod.estimatedCostEur})
                        </p>
                        <p className="mt-0.5 font-semibold text-white">
                          {topRecommendedMod.mod.name}
                        </p>
                        <p className="text-[10px] text-zinc-300">
                          {topRecommendedMod.tailoredReason}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenWikiEngine(activeEngine.id, effectiveVehicle.id)}
                        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                      >
                        <Flame className="h-3.5 w-3.5 text-amber-400" />
                        Wiki Motore
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenSimulator(effectiveVehicle.id)}
                        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
                      >
                        <Cpu className="h-3.5 w-3.5" />
                        Vano Motore 3D
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveCurrent}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-zinc-200"
                    >
                      {savedNotice ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Salvata nel Garage!
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Salva nel Garage
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
