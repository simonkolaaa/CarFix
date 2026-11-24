import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Eye,
  Flame,
  Fuel,
  Plus,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';
import {
  DEFAULT_VISUAL_MODS,
  type FuelType,
  type GarageCar,
  type MaintenanceCategory,
  type MaintenanceLogEntry,
  type ModCategory,
  type RealModSpec,
  type VisualModsConfig,
} from '../../core/types';
import { evaluateCategorizedMaintenance } from '../../core/maintenanceEngine';
import { getRecommendedModsForVehicle } from '../../core/modAdvisor';
import { computeLiveVehicleTelemetry } from '../../services/vehicleWikiApi';
import { CATALOG, CATALOG_BY_ID, PAINT_SWATCHES } from '../../data/catalog';
import { ENGINES_BY_ID } from '../../data/engines';
import { MODS_BY_ID } from '../../data/modsCatalog';
import { MAINTENANCE_CATEGORIES } from '../../data/maintenanceCatalog';
import { SketchfabViewer3D } from '../../components/three/SketchfabViewer3D';
import { deriveVisualModsFromEntries } from '../../state/useCarFixStore';

interface GarageViewProps {
  garageCars: GarageCar[];
  onAddCar: (payload: {
    vehicleId: string;
    nickname: string;
    customColorHex: string;
    currentKm: number;
    transmission: GarageCar['transmission'];
  }) => GarageCar;
  onUpdateCar: (carId: string, patch: Partial<GarageCar>) => void;
  onUpdateCarVisualMods: (carId: string, patch: Partial<VisualModsConfig>) => void;
  onRemoveCar: (carId: string) => void;
  onLogMaintenance: (
    carId: string,
    payload: Omit<MaintenanceLogEntry, 'id' | 'completedDate'>,
  ) => void;
  onRemoveMaintenanceLog: (carId: string, logId: string) => void;
  onAddMod: (
    carId: string,
    mod: {
      modSpecId?: string;
      category: ModCategory;
      title: string;
      notes: string;
      installedAtKm: number;
    },
  ) => void;
  onRemoveMod: (carId: string, modId: string) => void;
  onOpenInShowroom: (
    vehicleId: string,
    paintHex: string,
    visualPatch?: Partial<VisualModsConfig>,
    preferredMode?: 'sketchfab' | 'user_photo',
  ) => void;
  onOpenWiki: (engineId: string, vehicleId: string) => void;
  onOpenSimulator: (vehicleId: string) => void;
  onPublishToCommunity: (payload: {
    garageCar: GarageCar;
    authorHandle: string;
    title: string;
    summary: string;
    powerLabel: string;
  }) => void;
  onExportJson: () => string;
  onImportJson: (jsonText: string) => boolean;
}

const MOD_CATEGORIES: Array<{ value: ModCategory; label: string }> = [
  { value: 'stage', label: 'Mappa / Stage' },
  { value: 'exhaust', label: 'Scarico / Downpipe' },
  { value: 'suspension', label: 'Assetto / Coilover' },
  { value: 'intake', label: 'Aspirazione / Intercooler' },
  { value: 'brakes', label: 'Freni / Tubi treccia' },
  { value: 'aesthetic', label: 'Estetica / Cerchi' },
];

export function GarageView({
  garageCars,
  onAddCar,
  onUpdateCar,
  onUpdateCarVisualMods,
  onRemoveCar,
  onLogMaintenance,
  onRemoveMaintenanceLog,
  onAddMod,
  onRemoveMod,
  onOpenInShowroom,
  onOpenWiki,
  onOpenSimulator,
  onPublishToCommunity,
  onExportJson,
  onImportJson,
}: GarageViewProps) {
  const allBrands = useMemo(
    () => Array.from(new Set(CATALOG.map((c) => c.brand))).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const [selectedBrand, setSelectedBrand] = useState('Volkswagen');
  const [selectedFuel, setSelectedFuel] = useState<'ALL' | FuelType>('ALL');
  const [selectedVehicleId, setSelectedVehicleId] = useState('vw-golf-5-tdi-bkc');
  const [nickname, setNickname] = useState('');
  const [initialKm, setInitialKm] = useState(145000);
  const [transmission, setTransmission] = useState<'Manuale' | 'Automatico'>('Manuale');

  const [activeCarId, setActiveCarId] = useState<string | null>(garageCars[0]?.id ?? null);
  const [paintNonce, setPaintNonce] = useState(0);
  const [activeMaintCat, setActiveMaintCat] = useState<'ALL' | MaintenanceCategory>('ALL');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [costDraftEur, setCostDraftEur] = useState<Record<string, string>>({});

  const [selectedRealModId, setSelectedRealModId] = useState<string>('');
  const [modCategory, setModCategory] = useState<ModCategory>('exhaust');
  const [modTitle, setModTitle] = useState('');
  const [modNotes, setModNotes] = useState('');
  const [modKm, setModKm] = useState(145000);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const fuelsForSelectedBrand = useMemo(() => {
    const set = new Set<FuelType>();
    for (const c of CATALOG) {
      if (c.brand === selectedBrand) {
        const eng = ENGINES_BY_ID[c.engineId];
        if (eng) set.add(eng.fuelType);
      }
    }
    return Array.from(set);
  }, [selectedBrand]);

  const modelsForPicker = useMemo(
    () =>
      CATALOG.filter(
        (c) =>
          c.brand === selectedBrand &&
          (selectedFuel === 'ALL' || ENGINES_BY_ID[c.engineId]?.fuelType === selectedFuel),
      ),
    [selectedBrand, selectedFuel],
  );

  const activeCar = useMemo(
    () => garageCars.find((c) => c.id === activeCarId) ?? garageCars[0] ?? null,
    [garageCars, activeCarId],
  );

  const activeCatalogModel = activeCar ? CATALOG_BY_ID[activeCar.vehicleId] : null;
  const activeEngine = activeCatalogModel ? ENGINES_BY_ID[activeCatalogModel.engineId] : null;

  const recommendedMods = useMemo(() => {
    if (!activeCatalogModel || !activeEngine) return [];
    return getRecommendedModsForVehicle(activeCatalogModel, activeEngine);
  }, [activeCatalogModel, activeEngine]);

  useEffect(() => {
    if (recommendedMods.length > 0) {
      setSelectedRealModId((prev) =>
        recommendedMods.some((r) => r.mod.id === prev) ? prev : recommendedMods[0].mod.id,
      );
    } else {
      setSelectedRealModId('');
    }
  }, [activeCar?.id, activeCatalogModel?.id, recommendedMods]);

  const selectedRealMod =
    recommendedMods.find((r) => r.mod.id === selectedRealModId)?.mod ??
    recommendedMods[0]?.mod ??
    null;

  const mergedVisualMods: VisualModsConfig = useMemo(() => {
    if (!activeCar) return { ...DEFAULT_VISUAL_MODS };
    const fromMods = deriveVisualModsFromEntries(activeCar.mods);
    return {
      ...DEFAULT_VISUAL_MODS,
      ...fromMods,
      ...(activeCar.visualMods ?? {}),
    };
  }, [activeCar]);

  const installedModSpecs = useMemo(() => {
    if (!activeCar) return [] as RealModSpec[];
    return activeCar.mods
      .map((m) => (m.modSpecId ? MODS_BY_ID[m.modSpecId] : undefined))
      .filter((x): x is RealModSpec => Boolean(x));
  }, [activeCar]);

  const liveTelemetry = useMemo(() => {
    if (!activeCatalogModel || !activeEngine) return null;
    return computeLiveVehicleTelemetry(
      activeCatalogModel,
      activeEngine,
      mergedVisualMods,
      installedModSpecs,
    );
  }, [activeCatalogModel, activeEngine, mergedVisualMods, installedModSpecs]);

  const maintenanceReport = useMemo(() => {
    if (!activeCar || !activeCatalogModel || !activeEngine) return null;
    return evaluateCategorizedMaintenance(
      activeCar.currentKm,
      activeCatalogModel,
      activeEngine,
      activeCar.transmission,
      activeCar.maintenanceLogs ?? [],
    );
  }, [activeCar, activeCatalogModel, activeEngine]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedFuel('ALL');
    const first = CATALOG.find((c) => c.brand === brand);
    if (first) setSelectedVehicleId(first.id);
  };

  const handleFuelChange = (fuel: 'ALL' | FuelType) => {
    setSelectedFuel(fuel);
    const matches = CATALOG.filter(
      (c) =>
        c.brand === selectedBrand &&
        (fuel === 'ALL' || ENGINES_BY_ID[c.engineId]?.fuelType === fuel),
    );
    if (matches.length > 0) setSelectedVehicleId(matches[0].id);
  };

  const handleCreateCar = () => {
    const model = CATALOG_BY_ID[selectedVehicleId];
    if (!model) return;
    const created = onAddCar({
      vehicleId: model.id,
      nickname: nickname.trim() || model.model,
      customColorHex: model.defaultColor,
      currentKm: Math.max(0, Number(initialKm) || 0),
      transmission,
    });
    setActiveCarId(created.id);
    setNickname('');
    setModKm(created.currentKm);
  };

  const handleDeleteCar = (carId: string) => {
    const remaining = garageCars.filter((c) => c.id !== carId);
    onRemoveCar(carId);
    if (activeCarId === carId) {
      setActiveCarId(remaining[0]?.id ?? null);
    }
  };

  const handleExport = () => {
    const json = onExportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carfix-garage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const ok = onImportJson(text);
    setImportNotice(ok ? 'Backup Garage importato!' : 'File JSON non valido.');
    window.setTimeout(() => setImportNotice(null), 3200);
  };

  const handleInstallRealMod = (mod: RealModSpec) => {
    if (!activeCar) return;
    onAddMod(activeCar.id, {
      modSpecId: mod.id,
      category: mod.category,
      title: mod.name,
      notes: `${mod.performanceImpact} | ${mod.estimatedCostEur}`,
      installedAtKm: activeCar.currentKm,
    });
    if (mod.visualPatch) {
      onUpdateCarVisualMods(activeCar.id, mod.visualPatch);
    }
  };

  const visibleMaintTasks = useMemo(() => {
    if (!maintenanceReport) return [];
    if (activeMaintCat === 'ALL') return maintenanceReport.allTasks;
    return maintenanceReport.categories.find((c) => c.category === activeMaintCat)?.tasks ?? [];
  }, [maintenanceReport, activeMaintCat]);

  const normalizedActiveTransmission: 'Manuale' | 'Automatico' =
    activeCar?.transmission === 'Manuale' ? 'Manuale' : 'Automatico';

  return (
    <section className="min-h-screen bg-[#07070a] px-4 pb-20 pt-24 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header + Backup JSON */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-widest text-cyan-400">
              Garage Digitale 3D · Tagliandi 7 Categorie & Modifiche Su Misura
            </span>
            <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Il Mio Garage
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Gestisci i tuoi veicoli in 3D, registra ogni intervento nei 7 impianti principali e
              installa modifiche reali consigliate con incremento stimato di CV, Nm e 0–100.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" />
              Esporta Backup JSON
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10">
              <Upload className="h-3.5 w-3.5" />
              Importa JSON
              <input type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {importNotice && (
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-200">
            {importNotice}
          </div>
        )}

        {/* Form aggiunta veicolo (SOLO Manuale / Automatico) */}
        <div className="glass-hud rounded-2xl p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-cyan-400" />
            <h2 className="font-heading text-sm font-semibold text-white">
              Aggiungi un’auto al Garage
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-2">
              <label className="font-mono-tech mb-1 block text-[10px] uppercase text-zinc-400">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0d12] px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {allBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-mono-tech mb-1 flex items-center gap-1 text-[10px] uppercase text-cyan-300">
                <Fuel className="h-3 w-3" />
                Alimentazione
              </label>
              <select
                value={selectedFuel}
                onChange={(e) => handleFuelChange(e.target.value as 'ALL' | FuelType)}
                className="w-full rounded-xl border border-cyan-400/30 bg-[#0d0d12] px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="ALL">Tutte</option>
                {fuelsForSelectedBrand.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="font-mono-tech mb-1 block text-[10px] uppercase text-zinc-400">
                Modello & Motore
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0d12] px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                {modelsForPicker.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.model} · {car.powerHp} CV
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-mono-tech mb-1 block text-[10px] uppercase text-zinc-400">
                Soprannome Build
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Es. La Mia Golfina"
                className="w-full rounded-xl border border-white/10 bg-[#0d0d12] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-mono-tech mb-1 block text-[10px] uppercase text-zinc-400">
                KM / Cambio
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={initialKm}
                  onChange={(e) => setInitialKm(Number(e.target.value))}
                  className="font-mono-tech w-24 rounded-xl border border-white/10 bg-[#0d0d12] px-2.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
                <select
                  aria-label="Tipo di cambio"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as 'Manuale' | 'Automatico')}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0d0d12] px-2 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Manuale">Manuale</option>
                  <option value="Automatico">Automatico</option>
                </select>
              </div>
            </div>

            <div className="flex items-end sm:col-span-1">
              <button
                type="button"
                onClick={handleCreateCar}
                className="h-[42px] w-full cursor-pointer rounded-xl bg-cyan-400 text-sm font-bold text-black transition hover:bg-cyan-300"
              >
                Salva
              </button>
            </div>
          </div>
        </div>

        {/* Empty Garage State */}
        {garageCars.length === 0 ? (
          <div className="glass-hud rounded-3xl p-10 text-center">
            <Car className="mx-auto h-10 w-10 text-cyan-400/80" />
            <h3 className="font-heading mt-3 text-xl font-bold text-white">
              Il tuo Garage è ancora vuoto
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-400">
              Aggiungi una vettura qui sopra per visualizzare la sua sagoma 3D reale, monitorare i
              7 impianti di manutenzione e scoprire le mod consigliate per il tuo motore!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* RIGA SUPERIORE: Lista Auto (sx) + Modello 3D Reale (dx) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-4">
                {garageCars.map((car) => {
                  const model = CATALOG_BY_ID[car.vehicleId];
                  const eng = model ? ENGINES_BY_ID[model.engineId] : null;
                  const report =
                    model && eng
                      ? evaluateCategorizedMaintenance(
                          car.currentKm,
                          model,
                          eng,
                          car.transmission,
                          car.maintenanceLogs ?? [],
                        )
                      : null;
                  const isSelected = activeCar?.id === car.id;

                  return (
                    <div
                      key={car.id}
                      onClick={() => {
                        setActiveCarId(car.id);
                        setModKm(car.currentKm);
                      }}
                      className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/10'
                          : 'border-white/10 bg-zinc-950/80 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono-tech text-[10px] uppercase tracking-wider text-zinc-400">
                            {model?.brand} · {eng?.fuelType} ·{' '}
                            {car.transmission === 'Manuale' ? 'Manuale' : 'Automatico'}
                          </span>
                          <h3 className="font-heading text-base font-bold text-white">
                            {car.nickname}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/30"
                            style={{ backgroundColor: car.customColorHex }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCar(car.id);
                            }}
                            title="Rimuovi auto dal Garage"
                            className="cursor-pointer rounded-lg border border-rose-500/35 bg-rose-500/10 p-1.5 text-rose-300 transition hover:bg-rose-500/25"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-mono-tech text-zinc-300">
                          {car.currentKm.toLocaleString('it-IT')} km · {car.mods.length} mods
                        </span>
                        {report && (
                          <span
                            className={`font-mono-tech rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              report.totalOverdue > 0
                                ? 'bg-rose-500/20 text-rose-300'
                                : report.totalUpcoming > 0
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            Salute {report.overallHealthPct}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeCar && activeCatalogModel && (
                <div className="glass-hud relative h-[360px] overflow-hidden rounded-3xl sm:h-[420px] lg:col-span-8">
                  <SketchfabViewer3D
                    vehicle={activeCatalogModel}
                    paintHex={activeCar.customColorHex}
                    paintAppliedNonce={paintNonce + 1}
                    visualMods={mergedVisualMods}
                    compact
                  />

                  <div className="pointer-events-auto absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/80 px-2.5 py-1.5 backdrop-blur-md">
                    {PAINT_SWATCHES.slice(0, 6).map((sw) => (
                      <button
                        key={sw.hex}
                        type="button"
                        title={sw.name}
                        onClick={() => {
                          onUpdateCar(activeCar.id, { customColorHex: sw.hex });
                          setPaintNonce((n) => n + 1);
                        }}
                        className={`h-4 w-4 cursor-pointer rounded-full border ${
                          activeCar.customColorHex.toLowerCase() === sw.hex.toLowerCase()
                            ? 'scale-110 border-white ring-1 ring-cyan-400'
                            : 'border-white/25'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGA INFERIORE A TUTTA LARGHEZZA (100% max-w-7xl) */}
            {activeCar && activeCatalogModel && activeEngine && maintenanceReport && liveTelemetry && (
              <div className="w-full space-y-6">
                {/* 1. PROFILO VEICOLO, TELEMETRIA POTENZA MODIFICATA & KM */}
                <div className="glass-hud rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="font-mono-tech text-xs text-cyan-300">
                        {activeCatalogModel.brand} {activeCatalogModel.model} · {activeEngine.fuelType}
                      </span>
                      <h2 className="font-display mt-1 text-2xl font-bold text-white">
                        {activeCar.nickname}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenInShowroom(
                            activeCar.vehicleId,
                            activeCar.customColorHex,
                            mergedVisualMods,
                            'sketchfab',
                          )
                        }
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-black hover:bg-zinc-200"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Apri in Showroom
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenSimulator(activeCar.vehicleId)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
                      >
                        <Cpu className="h-3.5 w-3.5" />
                        Vano Motore 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenWiki(activeEngine.id, activeCar.vehicleId)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        <Flame className="h-3.5 w-3.5 text-amber-400" />
                        Wiki & Codici
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onPublishToCommunity({
                            garageCar: activeCar,
                            authorHandle: '@io_carfix',
                            title: `${activeCatalogModel.brand} ${activeCar.nickname}`,
                            summary: `${activeEngine.code} con ${activeCar.currentKm.toLocaleString('it-IT')} km · Potenza stimata ${liveTelemetry.liveHp} CV / ${liveTelemetry.liveNm} Nm.`,
                            powerLabel: `${liveTelemetry.liveHp} CV`,
                          });
                          setPublishNotice('Build pubblicata nel feed Community!');
                          window.setTimeout(() => setPublishNotice(null), 3200);
                        }}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Pubblica
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCar(activeCar.id)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Rimuovi dal Garage
                      </button>
                    </div>
                  </div>

                  {publishNotice && (
                    <div className="mt-3 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200">
                      {publishNotice}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-12">
                    <div className="flex flex-wrap items-end gap-3 sm:col-span-5">
                      <div>
                        <label className="font-mono-tech mb-1 block text-[10px] uppercase text-zinc-400">
                          Chilometraggio attuale
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={activeCar.currentKm}
                            onChange={(e) =>
                              onUpdateCar(activeCar.id, {
                                currentKm: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="font-mono-tech w-36 rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                          />
                          <span className="font-mono-tech text-xs text-zinc-400">km</span>
                        </div>
                      </div>

                      <div>
                        <label className="font-mono-tech mb-1 block text-[10px] uppercase text-zinc-400">
                          Cambio
                        </label>
                        <select
                          aria-label="Cambio veicolo"
                          value={normalizedActiveTransmission}
                          onChange={(e) =>
                            onUpdateCar(activeCar.id, {
                              transmission: e.target.value as 'Manuale' | 'Automatico',
                            })
                          }
                          className="rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="Manuale">Manuale</option>
                          <option value="Automatico">Automatico</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:col-span-7">
                      <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                        <span className="font-mono-tech text-[9px] uppercase text-zinc-400">
                          Potenza Build
                        </span>
                        <p className="font-mono-tech text-base font-bold text-white">
                          {liveTelemetry.liveHp} CV{' '}
                          {liveTelemetry.hpDelta > 0 && (
                            <span className="text-xs text-emerald-400">
                              (+{liveTelemetry.hpDelta})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                        <span className="font-mono-tech text-[9px] uppercase text-zinc-400">
                          Coppia Stimata
                        </span>
                        <p className="font-mono-tech text-base font-bold text-white">
                          {liveTelemetry.liveNm} Nm
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                        <span className="font-mono-tech text-[9px] uppercase text-zinc-400">
                          0–100 km/h
                        </span>
                        <p className="font-mono-tech text-base font-bold text-cyan-300">
                          {liveTelemetry.live0To100}s
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. PIANO MANUTENZIONE COMPLETO A TUTTA LARGHEZZA */}
                <div className="glass-hud rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-heading flex items-center gap-2 text-lg font-bold text-white">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        Piano Manutenzione Completo (7 Categorie)
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Salute globale{' '}
                        <span className="font-mono-tech font-bold text-white">
                          {maintenanceReport.overallHealthPct}%
                        </span>{' '}
                        · {maintenanceReport.totalOverdue} scadute · {maintenanceReport.totalUpcoming}{' '}
                        imminenti · Spesa registrata:{' '}
                        <span className="font-mono-tech text-cyan-300">
                          {maintenanceReport.totalSpentEur.toLocaleString('it-IT')} €
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveMaintCat('ALL')}
                      className={`font-mono-tech cursor-pointer rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                        activeMaintCat === 'ALL'
                          ? 'border-cyan-400 bg-cyan-400 text-black'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      Tutte ({maintenanceReport.allTasks.length})
                    </button>
                    {maintenanceReport.categories.map((cat) => (
                      <button
                        key={cat.category}
                        type="button"
                        onClick={() => setActiveMaintCat(cat.category)}
                        className={`font-mono-tech flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] transition ${
                          activeMaintCat === cat.category
                            ? 'border-cyan-400 bg-cyan-500/20 text-white'
                            : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        <span>{cat.shortLabel}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                            cat.overdueCount > 0
                              ? 'bg-rose-500/30 text-rose-200'
                              : cat.upcomingCount > 0
                                ? 'bg-amber-500/30 text-amber-200'
                                : 'bg-emerald-500/25 text-emerald-200'
                          }`}
                        >
                          {cat.healthPct}%
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                    {visibleMaintTasks.map((ev) => {
                      const isExpanded = expandedTaskId === ev.task.id;
                      const catMeta = MAINTENANCE_CATEGORIES.find((c) => c.id === ev.task.category);
                      return (
                        <div
                          key={ev.task.id}
                          className={`rounded-xl border transition ${
                            ev.status === 'overdue'
                              ? 'border-rose-500/35 bg-rose-500/5'
                              : ev.status === 'upcoming'
                                ? 'border-amber-500/35 bg-amber-500/5'
                                : 'border-white/10 bg-black/45'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTaskId((cur) => (cur === ev.task.id ? null : ev.task.id))
                              }
                              className="flex flex-1 cursor-pointer items-center gap-2.5 text-left"
                            >
                              {ev.status === 'overdue' ? (
                                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                              ) : ev.status === 'upcoming' ? (
                                <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs font-bold text-white">
                                    {ev.task.title}
                                  </span>
                                  <span className="font-mono-tech rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-zinc-300">
                                    {catMeta?.shortLabel}
                                  </span>
                                </div>
                                <p className="font-mono-tech mt-0.5 text-[10px] text-zinc-400">
                                  Ogni {ev.task.intervalKm.toLocaleString('it-IT')} km ·{' '}
                                  {ev.remainingKm <= 0 ? (
                                    <span className="text-rose-300">
                                      Scaduto da {Math.abs(ev.remainingKm).toLocaleString('it-IT')} km
                                    </span>
                                  ) : (
                                    <span className="text-emerald-300">
                                      Tra {ev.remainingKm.toLocaleString('it-IT')} km (a{' '}
                                      {ev.nextDueKm.toLocaleString('it-IT')} km)
                                    </span>
                                  )}
                                  {ev.lastCompleted &&
                                    ` · Ultimo: ${ev.lastCompleted.completedAtKm.toLocaleString('it-IT')} km`}
                                </p>
                              </div>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                placeholder="€"
                                value={costDraftEur[ev.task.id] ?? ''}
                                onChange={(e) =>
                                  setCostDraftEur((prev) => ({
                                    ...prev,
                                    [ev.task.id]: e.target.value,
                                  }))
                                }
                                className="font-mono-tech w-16 rounded-lg border border-white/15 bg-black/70 px-2 py-1 text-[11px] text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const rawCost = Number(costDraftEur[ev.task.id]);
                                  onLogMaintenance(activeCar.id, {
                                    taskId: ev.task.id,
                                    taskTitle: ev.task.title,
                                    completedAtKm: activeCar.currentKm,
                                    costEur: Number.isFinite(rawCost) && rawCost > 0 ? rawCost : undefined,
                                  });
                                  setCostDraftEur((prev) => ({ ...prev, [ev.task.id]: '' }));
                                }}
                                className="cursor-pointer rounded-lg bg-emerald-400 px-2.5 py-1 text-[10px] font-bold text-black hover:bg-emerald-300"
                              >
                                Segna Fatto
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-1.5 border-t border-white/10 px-3 pb-3 pt-2.5 text-xs text-zinc-300">
                              <p>
                                <strong className="text-white">Cos’è:</strong> {ev.task.whatItIs}
                              </p>
                              <p>
                                <strong className="text-amber-300">Sintomi:</strong> {ev.task.symptoms}
                              </p>
                              <p>
                                <strong className="text-rose-300">Se ignori:</strong> {ev.task.ifIgnored}
                              </p>
                              <p>
                                <strong className="text-cyan-300">Consiglio & Costo:</strong>{' '}
                                {ev.task.preventionTip} ({ev.task.estimatedCostEur})
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {(activeCar.maintenanceLogs ?? []).length > 0 && (
                    <div className="border-t border-white/10 pt-3">
                      <p className="font-mono-tech mb-2 text-[10px] uppercase text-zinc-400">
                        Storico Interventi Registrati ({activeCar.maintenanceLogs!.length})
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {activeCar.maintenanceLogs!.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs"
                          >
                            <span className="text-zinc-200">
                              <strong className="text-emerald-300">{log.taskTitle}</strong> · a{' '}
                              {log.completedAtKm.toLocaleString('it-IT')} km ({log.completedDate})
                              {typeof log.costEur === 'number' ? ` · ${log.costEur} €` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveMaintenanceLog(activeCar.id, log.id)}
                              className="cursor-pointer p-1 text-zinc-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. CONSIGLI MODS REALI SU MISURA A TUTTA LARGHEZZA */}
                <div className="glass-hud rounded-2xl p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="font-heading flex items-center gap-2 text-lg font-bold text-white">
                      <Wrench className="h-5 w-5 text-cyan-400" />
                      Modifiche Reali Consigliate per {activeCatalogModel.brand}{' '}
                      {activeCatalogModel.model}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Filtrate in tempo reale per motore{' '}
                      <span className="text-cyan-300">{activeEngine.code}</span> ({activeEngine.fuelType}) con
                      stima di +CV, +Nm, impatto affidabilità e legalità.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {recommendedMods.slice(0, 6).map((rec) => {
                      const alreadyInstalled = activeCar.mods.some(
                        (m) => m.modSpecId === rec.mod.id,
                      );
                      return (
                        <div
                          key={rec.mod.id}
                          className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                            rec.isTopPick
                              ? 'border-cyan-400/35 bg-cyan-500/5'
                              : 'border-white/10 bg-black/45'
                          }`}
                        >
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="font-mono-tech rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                                Match {rec.matchScore}%
                              </span>
                              <span className="font-mono-tech text-[10px] font-bold text-emerald-300">
                                {rec.estimatedHpGainAvg > 0
                                  ? `+${rec.mod.hpGainMin}–${rec.mod.hpGainMax} CV · +${rec.mod.nmGainMin}–${rec.mod.nmGainMax} Nm`
                                  : 'Handling / Affidabilità / Look'}
                              </span>
                            </div>
                            <h4 className="mt-2 text-sm font-bold text-white">{rec.mod.name}</h4>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                              {rec.tailoredReason}
                            </p>
                            {rec.safetyNote && (
                              <p className="mt-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                                {rec.safetyNote}
                              </p>
                            )}
                            <p className="mt-1.5 text-[10px] text-zinc-400">
                              {rec.mod.legalityItaly}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                            <span className="font-mono-tech text-[10px] text-zinc-400">
                              {rec.mod.estimatedCostEur}
                            </span>
                            <button
                              type="button"
                              disabled={alreadyInstalled}
                              onClick={() => handleInstallRealMod(rec.mod)}
                              className={`cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                                alreadyInstalled
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-cyan-400 text-black hover:bg-cyan-300'
                              }`}
                            >
                              {alreadyInstalled ? 'Installata ✓' : '+ Installa Mod'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 lg:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-white/10 bg-black/50 p-3.5">
                      <p className="font-mono-tech text-[10px] uppercase text-cyan-300">
                        Selettore Rapido Compatibile ({activeCatalogModel.brand} {activeCatalogModel.model})
                      </p>
                      {selectedRealMod ? (
                        <>
                          <select
                            aria-label="Selettore mod compatibili"
                            value={selectedRealModId}
                            onChange={(e) => setSelectedRealModId(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-[#0d0d12] px-3 py-2 text-xs text-white"
                          >
                            {recommendedMods.map((rec) => (
                              <option key={rec.mod.id} value={rec.mod.id}>
                                {rec.mod.name}{' '}
                                {rec.estimatedHpGainAvg > 0
                                  ? `(+${rec.mod.hpGainMin}-${rec.mod.hpGainMax} CV)`
                                  : '(Handling/Look)'}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleInstallRealMod(selectedRealMod)}
                            className="w-full cursor-pointer rounded-xl bg-white/15 py-2 text-xs font-bold text-white hover:bg-white/25"
                          >
                            Installa “{selectedRealMod.name.split('(')[0].trim()}”
                          </button>
                        </>
                      ) : (
                        <p className="text-xs text-zinc-400">
                          Nessuna mod specifica in catalogo per questa configurazione.
                        </p>
                      )}

                      <p className="font-mono-tech pt-2 text-[10px] uppercase text-zinc-400">
                        Oppure aggiungi mod personalizzata
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={modCategory}
                          onChange={(e) => setModCategory(e.target.value as ModCategory)}
                          className="rounded-xl border border-white/15 bg-[#0d0d12] px-2 py-2 text-xs text-white"
                        >
                          {MOD_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={modKm}
                          onChange={(e) => setModKm(Number(e.target.value))}
                          className="font-mono-tech w-24 rounded-xl border border-white/15 bg-[#0d0d12] px-2 py-2 text-xs text-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={modTitle}
                        onChange={(e) => setModTitle(e.target.value)}
                        placeholder="Es. Downpipe 200 celle + Stage 1"
                        className="w-full rounded-xl border border-white/15 bg-[#0d0d12] px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={modNotes}
                        onChange={(e) => setModNotes(e.target.value)}
                        placeholder="Dettagli officina / pressione turbo"
                        className="w-full rounded-xl border border-white/15 bg-[#0d0d12] px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!modTitle.trim()) return;
                          onAddMod(activeCar.id, {
                            category: modCategory,
                            title: modTitle.trim(),
                            notes: modNotes.trim(),
                            installedAtKm: Number(modKm) || activeCar.currentKm,
                          });
                          setModTitle('');
                          setModNotes('');
                        }}
                        className="w-full cursor-pointer rounded-xl bg-cyan-400 py-2 text-xs font-bold text-black hover:bg-cyan-300"
                      >
                        + Registra Mod Libera
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="font-mono-tech text-[10px] uppercase text-zinc-400">
                        Modifiche attive su questa build ({activeCar.mods.length})
                      </p>
                      {activeCar.mods.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                          Nessuna mod ancora installata. Scegli una modifica consigliata qui sopra
                          per vedere aggiornarsi CV, coppia e 0–100 in tempo reale!
                        </p>
                      ) : (
                        activeCar.mods.map((mod) => (
                          <div
                            key={mod.id}
                            className="flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-black/50 p-3 text-xs"
                          >
                            <div>
                              <span className="font-mono-tech text-[10px] uppercase text-cyan-300">
                                {mod.category} · {mod.installedAtKm.toLocaleString('it-IT')} km
                              </span>
                              <p className="font-semibold text-white">{mod.title}</p>
                              {mod.notes && (
                                <p className="mt-0.5 text-[11px] text-zinc-400">{mod.notes}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveMod(activeCar.id, mod.id)}
                              className="cursor-pointer p-1 text-zinc-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
