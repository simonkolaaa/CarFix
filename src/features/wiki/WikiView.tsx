import { useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Eye,
  Flame,
  Fuel,
  Gauge,
  Globe,
  Loader2,
  MessageSquareText,
  Scale,
  Search,
  ShieldAlert,
  Skull,
  ThumbsUp,
  Wrench,
} from 'lucide-react';
import type { EngineWiki, FuelType, ManufacturerGroup, RecallItem, VerdictTier } from '../../core/types';
import { GROUP_LABELS } from '../../core/vehicleRules';
import { CATALOG } from '../../data/catalog';
import { ENGINES_BY_ID, ENGINES_WIKI } from '../../data/engines';
import { getEngineDeepSpecs } from '../../data/engineEncyclopedia';
import { fetchVehicleRecalls } from '../../services/nhtsaApi';
import {
  fetchNhtsaOwnerComplaints,
  fetchVehicleLiveWiki,
  fetchWikiLiveSearch,
  type LiveWikiSummary,
  type NhtsaComplaintsReport,
} from '../../services/vehicleWikiApi';

function getSimonBuyingVerdict(engine: EngineWiki): {
  headline: string;
  subnote: string;
  tone: 'simon_owns' | 'buy' | 'solid' | 'caution' | 'avoid';
} {
  if (engine.id === 'vag-19-tdi') {
    return {
      headline: 'Simon lo ha, puoi immaginare...',
      subnote:
        'Da prendere subito: ALH 90 CV e BKC 105 CV sono tra i motori più longevi mai costruiti (su BXE 2006–2008 verifica o fai le bronzine preventive).',
      tone: 'simon_owns',
    };
  }
  if (engine.reliabilityScore > 90) {
    return {
      headline: 'Simon consiglia di comprarlo',
      subnote: `Punteggio ${engine.reliabilityScore}/100 tra forum e officine: meccanica robusta e pochissime sorprese se tagliandato con olio giusto.`,
      tone: 'buy',
    };
  }
  if (engine.reliabilityScore >= 75) {
    return {
      headline: 'Buon acquisto — Consigliato con tagliandi regolari',
      subnote: `Punteggio ${engine.reliabilityScore}/100: motore valido per uso quotidiano, basta rispettare le scadenze chiave qui sotto.`,
      tone: 'solid',
    };
  }
  if (engine.reliabilityScore >= 55) {
    return {
      headline: 'Valuta con attenzione prima di firmare',
      subnote: `Punteggio ${engine.reliabilityScore}/100: controlla fatture di distribuzione/catena e difetti tipici prima dell’acquisto.`,
      tone: 'caution',
    };
  }
  return {
    headline: 'Sconsigliato — Alto rischio spese impreviste',
    subnote: `Punteggio ${engine.reliabilityScore}/100: acquista solo con lavori critici già certificati da fattura recente e prezzo scontato.`,
    tone: 'avoid',
  };
}

interface WikiViewProps {
  focusedEngineId?: string | null;
  focusedVehicleId?: string | null;
  onOpenInShowroom: (vehicleId: string, paintHex?: string) => void;
}

const FUEL_TYPES: Array<'ALL' | FuelType> = [
  'ALL',
  'Diesel',
  'Benzina',
  'Ibrido',
  'GPL/Metano',
  'Elettrico',
];

export function WikiView({
  focusedEngineId,
  focusedVehicleId,
  onOpenInShowroom,
}: WikiViewProps) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | VerdictTier>('ALL');
  const [groupFilter, setGroupFilter] = useState<'ALL' | ManufacturerGroup>('ALL');
  const [fuelFilter, setFuelFilter] = useState<'ALL' | FuelType>('ALL');
  const [selectedEngineId, setSelectedEngineId] = useState<string>(
    focusedEngineId ?? 'vag-19-tdi',
  );
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [recalls, setRecalls] = useState<RecallItem[]>([]);
  const [recallsLoading, setRecallsLoading] = useState(false);
  const [recallsLive, setRecallsLive] = useState(false);
  const [liveWiki, setLiveWiki] = useState<LiveWikiSummary | null>(null);
  const [searchWikiFallback, setSearchWikiFallback] = useState<LiveWikiSummary | null>(null);
  const [complaints, setComplaints] = useState<NhtsaComplaintsReport | null>(null);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 3) {
      setSearchWikiFallback(null);
      return;
    }
    let active = true;
    const t = window.setTimeout(() => {
      fetchWikiLiveSearch(q).then((res) => {
        if (active) setSearchWikiFallback(res);
      });
    }, 450);
    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [search]);

  useEffect(() => {
    if (focusedEngineId && ENGINES_BY_ID[focusedEngineId]) {
      setSelectedEngineId(focusedEngineId);
      setSelectedMilestoneId(null);
    }
  }, [focusedEngineId]);

  const filteredEngines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ENGINES_WIKI.filter((eng) => {
      if (tierFilter !== 'ALL' && eng.verdictTier !== tierFilter) return false;
      if (groupFilter !== 'ALL' && eng.group !== groupFilter) return false;
      if (fuelFilter !== 'ALL' && eng.fuelType !== fuelFilter) return false;
      if (!q) return true;

      const matchingVehicles = CATALOG.filter((v) => v.engineId === eng.id)
        .map((v) => `${v.brand} ${v.model}`)
        .join(' ')
        .toLowerCase();

      const matchingCodes = eng.engineCodes
        .map((c) => `${c.code} ${c.powerHp} ${c.models ?? ''} ${c.note}`)
        .join(' ')
        .toLowerCase();

      return (
        eng.code.toLowerCase().includes(q) ||
        eng.familyName.toLowerCase().includes(q) ||
        eng.tagline.toLowerCase().includes(q) ||
        matchingCodes.includes(q) ||
        matchingVehicles.includes(q)
      );
    }).sort((a, b) =>
      tierFilter === 'hall_of_shame'
        ? a.reliabilityScore - b.reliabilityScore
        : b.reliabilityScore - a.reliabilityScore,
    );
  }, [search, tierFilter, groupFilter, fuelFilter]);

  const activeEngine =
    filteredEngines.find((e) => e.id === selectedEngineId) ??
    filteredEngines[0] ??
    ENGINES_BY_ID[selectedEngineId] ??
    ENGINES_WIKI[0];

  const matchingCars = useMemo(
    () => CATALOG.filter((c) => c.engineId === activeEngine.id),
    [activeEngine.id],
  );

  const recallProbeCar = useMemo(() => {
    if (focusedVehicleId) {
      const exact = matchingCars.find((c) => c.id === focusedVehicleId);
      if (exact) return exact;
    }
    return matchingCars[0] ?? CATALOG[0];
  }, [matchingCars, focusedVehicleId]);

  const activeMilestone = useMemo(
    () =>
      activeEngine.milestones.find((m) => m.id === selectedMilestoneId) ??
      activeEngine.milestones[0],
    [activeEngine, selectedMilestoneId],
  );

  const deepSpecs = useMemo(() => getEngineDeepSpecs(activeEngine), [activeEngine]);

  useEffect(() => {
    let active = true;
    setRecallsLoading(true);
    setLiveWiki(null);
    setComplaints(null);
    Promise.all([
      fetchVehicleRecalls(
        recallProbeCar.nhtsaMake,
        recallProbeCar.nhtsaModel,
        recallProbeCar.nhtsaYear,
        activeEngine.euRecalls,
      ),
      fetchVehicleLiveWiki(recallProbeCar),
      fetchNhtsaOwnerComplaints(
        recallProbeCar.nhtsaMake,
        recallProbeCar.nhtsaModel,
        recallProbeCar.nhtsaYear,
      ),
    ]).then(([res, wikiRes, cmpRes]) => {
      if (!active) return;
      setRecalls(res.items);
      setRecallsLive(res.liveLoaded);
      setLiveWiki(wikiRes);
      setComplaints(cmpRes);
      setRecallsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [activeEngine, recallProbeCar]);

  const qLower = search.trim().toLowerCase();

  return (
    <section className="studio-grid min-h-screen bg-[#08080b] px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="font-display hero-title-clamp font-bold text-white">
            Cerca una macchina
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            Cerca per modello, potenza o codice motore (es.{' '}
            <span className="font-mono-tech text-cyan-300">TDI 90 CV</span>,{' '}
            <span className="font-mono-tech text-cyan-300">1.3 MJT 75 CV</span>,{' '}
            <span className="font-mono-tech text-cyan-300">BKC</span>,{' '}
            <span className="font-mono-tech text-cyan-300">EB2</span>,{' '}
            <span className="font-mono-tech text-cyan-300">2.0 HDi</span>). Scopri quali motori comprare e cosa evitare.
          </p>
        </div>

        {/* Search + Tier + Group + Fuel Filters */}
        <div className="glass-hud rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca auto, motore, CV o sigla (es. TDI 90, 1.3 MJT 75, BKC)..."
                className="w-full rounded-xl border border-white/10 bg-[#0d0d12] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 md:col-span-7 md:justify-end">
              {[
                { id: 'ALL' as const, label: 'Tutti i Motori', icon: Flame },
                { id: 'hall_of_fame' as const, label: 'Hall of Fame', icon: Award },
                { id: 'hall_of_shame' as const, label: 'Hall of Shame', icon: Skull },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = tierFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTierFilter(tab.id)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? tab.id === 'hall_of_shame'
                          ? 'bg-rose-500 text-white'
                          : tab.id === 'hall_of_fame'
                            ? 'bg-emerald-400 text-black'
                            : 'bg-cyan-400 text-black'
                        : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGroupFilter('ALL')}
                className={`font-mono-tech cursor-pointer rounded-lg px-2.5 py-1 text-[11px] ${
                  groupFilter === 'ALL'
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Tutti i Gruppi
              </button>
              {(Object.keys(GROUP_LABELS) as ManufacturerGroup[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupFilter(g)}
                  className={`font-mono-tech cursor-pointer rounded-lg px-2.5 py-1 text-[11px] ${
                    groupFilter === g
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {GROUP_LABELS[g].label}
                </button>
              ))}
            </div>

            {/* Alimentazione Filter */}
            <div className="flex flex-wrap items-center gap-1">
              <Fuel className="mr-1 h-3.5 w-3.5 text-cyan-400" />
              {FUEL_TYPES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFuelFilter(f)}
                  className={`font-mono-tech cursor-pointer rounded-lg px-2 py-1 text-[11px] ${
                    fuelFilter === f
                      ? 'bg-cyan-400 font-bold text-black'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {f === 'ALL' ? 'Tutte Alim.' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Master-Detail Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Lista Motori */}
          <div className="space-y-2.5 lg:col-span-4">
            {filteredEngines.map((eng) => {
              const selected = activeEngine.id === eng.id;
              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => {
                    setSelectedEngineId(eng.id);
                    setSelectedMilestoneId(null);
                  }}
                  className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition ${
                    selected
                      ? 'border-cyan-400/70 bg-zinc-900/95 shadow-lg shadow-cyan-500/10'
                      : 'border-white/10 bg-zinc-950/75 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tech text-[10px] uppercase tracking-wider text-zinc-400">
                      {GROUP_LABELS[eng.group].badge} · {eng.fuelType}
                    </span>
                    <span
                      className={`font-mono-tech rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        eng.verdictTier === 'hall_of_fame'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : eng.verdictTier === 'hall_of_shame'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {eng.reliabilityScore}/100
                    </span>
                  </div>
                  <h3 className="font-heading mt-1 text-base font-bold text-white">
                    {eng.code}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {eng.engineCodes.slice(0, 4).map((c) => (
                      <span
                        key={c.code}
                        className="font-mono-tech rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-cyan-300"
                      >
                        {c.code}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scheda Tecnica & Codici Motore */}
          <div className="space-y-5 lg:col-span-8">
            <div className="glass-hud rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono-tech text-xs uppercase tracking-widest text-cyan-300">
                    {activeEngine.familyName} · {activeEngine.fuelType}
                  </span>
                  <h2 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
                    {activeEngine.code}
                  </h2>
                </div>
                <span
                  className={`font-display inline-block rounded-2xl px-4 py-2 text-2xl font-bold ${
                    activeEngine.verdictTier === 'hall_of_fame'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : activeEngine.verdictTier === 'hall_of_shame'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  {activeEngine.reliabilityScore}/100
                </span>
              </div>

              <p className="mt-3 text-base font-medium italic text-zinc-100">
                “{activeEngine.tagline}”
              </p>

              {/* Verdetto & Consiglio Acquisto di Simon */}
              {(() => {
                const verdict = getSimonBuyingVerdict(activeEngine);
                const styles =
                  verdict.tone === 'simon_owns'
                    ? 'border-cyan-400/60 bg-gradient-to-r from-cyan-500/20 to-emerald-500/15 text-cyan-100'
                    : verdict.tone === 'buy'
                      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
                      : verdict.tone === 'solid'
                        ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
                        : verdict.tone === 'caution'
                          ? 'border-amber-400/45 bg-amber-500/10 text-amber-100'
                          : 'border-rose-500/50 bg-rose-500/15 text-rose-100';
                return (
                  <div className={`mt-4 rounded-2xl border p-4 ${styles}`}>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 shrink-0" />
                      <span className="font-display text-base font-bold">{verdict.headline}</span>
                    </div>
                    <p className="mt-1 text-xs opacity-90">{verdict.subnote}</p>
                  </div>
                );
              })()}

              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                {activeEngine.ironicSummary}
              </p>

              {/* Risultato Live Enciclopedia su ricerca diretta */}
              {search.trim().length >= 3 && searchWikiFallback && (
                <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-3.5 text-xs">
                  <span className="font-mono-tech text-[10px] uppercase text-cyan-300">
                    Risultato Live su “{search.trim()}”: {searchWikiFallback.title}
                  </span>
                  <p className="mt-1 leading-relaxed text-zinc-200">{searchWikiFallback.extract}</p>
                </div>
              )}

              {/* Codici Motore Esatti & Modelli Compatibili */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-4">
                <p className="font-mono-tech mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-cyan-300">
                  <Cpu className="h-3.5 w-3.5" />
                  Codici Motore, Varianti Potenza & Auto Che Lo Montano
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {activeEngine.engineCodes.map((variant) => {
                    const matched =
                      qLower.length >= 2 &&
                      (variant.code.toLowerCase().includes(qLower) ||
                        variant.powerHp.toLowerCase().includes(qLower) ||
                        (variant.models ?? '').toLowerCase().includes(qLower));
                    return (
                      <div
                        key={variant.code}
                        className={`rounded-xl border p-3 text-xs ${
                          matched
                            ? 'border-cyan-400 bg-cyan-500/15'
                            : variant.status === 'avoid'
                              ? 'border-rose-500/35 bg-rose-500/10'
                              : variant.status === 'caution'
                                ? 'border-amber-500/35 bg-amber-500/10'
                                : 'border-emerald-500/30 bg-emerald-500/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-tech text-sm font-bold text-white">
                            {variant.code}
                          </span>
                          <span
                            className={`font-mono-tech rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              variant.status === 'avoid'
                                ? 'bg-rose-500/25 text-rose-200'
                                : variant.status === 'caution'
                                  ? 'bg-amber-500/25 text-amber-200'
                                  : 'bg-emerald-500/25 text-emerald-200'
                            }`}
                          >
                            {variant.status === 'avoid'
                              ? 'Evita'
                              : variant.status === 'caution'
                                ? 'Attenzione'
                                : 'Consigliato'}
                          </span>
                        </div>
                        <p className="font-mono-tech mt-1 text-[11px] font-semibold text-cyan-300">
                          {variant.powerHp} · {variant.years}
                        </p>
                        {variant.models && (
                          <p className="mt-1 text-[11px] text-zinc-300">
                            <strong className="text-white">Auto:</strong> {variant.models}
                          </p>
                        )}
                        <p className="mt-1 leading-relaxed text-zinc-200">{variant.note}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
                  <p className="font-mono-tech flex items-center gap-1.5 text-[11px] uppercase text-cyan-300">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Consenso Forum & Reddit
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                    {activeEngine.forumConsensus}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
                  <p className="font-mono-tech flex items-center gap-1.5 text-[11px] uppercase text-amber-300">
                    <Wrench className="h-3.5 w-3.5" />
                    Potenziale Mods & Tuning
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                    {activeEngine.tuningPotential}
                  </p>
                </div>
              </div>

              {liveWiki && (
                <div className="mt-4 rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono-tech flex items-center gap-1.5 text-[11px] uppercase text-cyan-300">
                      <Globe className="h-3.5 w-3.5" />
                      Scheda Tecnica & Storica — {liveWiki.title}
                    </span>
                    <span className="font-mono-tech text-[10px] uppercase text-zinc-400">
                      Fonte: {liveWiki.source === 'IT_WIKI' ? 'Enciclopedia IT' : 'Enciclopedia EN'}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
                    {liveWiki.thumbnailUrl && (
                      <img
                        src={liveWiki.thumbnailUrl}
                        alt={liveWiki.title}
                        className="h-28 w-full shrink-0 rounded-xl border border-white/15 object-cover sm:w-44"
                      />
                    )}
                    <p className="text-xs leading-relaxed text-zinc-200">{liveWiki.extract}</p>
                  </div>
                </div>
              )}

              {/* Scheda Tecnica Approfondita + Checklist Acquisto Usato */}
              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/55 p-4 lg:col-span-6">
                  <p className="font-mono-tech flex items-center gap-1.5 text-[11px] uppercase text-cyan-300">
                    <Gauge className="h-3.5 w-3.5" />
                    Specifiche Tecniche & Costi Reali
                  </p>
                  <div className="space-y-2 text-xs text-zinc-300">
                    <p>
                      <strong className="text-white">Distribuzione:</strong>{' '}
                      {deepSpecs.distributionType}
                    </p>
                    <p>
                      <strong className="text-white">Olio & Capacità:</strong>{' '}
                      {deepSpecs.oilSpecAndCapacity}
                    </p>
                    <p>
                      <strong className="text-white">Iniezione & Turbo:</strong>{' '}
                      {deepSpecs.injectionAndTurbo}
                    </p>
                    <p>
                      <strong className="text-emerald-300">Consumi Reali:</strong>{' '}
                      {deepSpecs.realFuelConsumption}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <span className="font-mono-tech block text-[9px] uppercase text-zinc-400">
                          Tagliando Medio
                        </span>
                        <span className="font-mono-tech text-[11px] font-bold text-white">
                          {deepSpecs.typicalServiceCostEur}
                        </span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <span className="font-mono-tech block text-[9px] uppercase text-zinc-400">
                          Distribuzione
                        </span>
                        <span className="font-mono-tech text-[11px] font-bold text-amber-300">
                          {deepSpecs.typicalTimingCostEur}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 lg:col-span-6">
                  <p className="font-mono-tech flex items-center gap-1.5 text-[11px] uppercase text-emerald-300">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Checklist Acquisto Usato (5 Controlli Prima di Firmare)
                  </p>
                  <ul className="space-y-1.5 text-xs text-zinc-200">
                    {deepSpecs.usedCarChecklist.map((check, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono-tech mt-0.5 rounded bg-emerald-400/20 px-1.5 text-[10px] font-bold text-emerald-300">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{check}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-white/10 pt-2">
                    <p className="font-mono-tech flex items-center gap-1 text-[10px] uppercase text-zinc-400">
                      <Scale className="h-3 w-3 text-cyan-300" />
                      Confronto Diretto:
                    </p>
                    {deepSpecs.rivalsComparison.map((cmp, idx) => (
                      <p key={idx} className="mt-0.5 text-[11px] text-zinc-300">
                        • {cmp}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {matchingCars.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="font-mono-tech mb-2 text-[11px] uppercase tracking-wider text-zinc-400">
                    Modelli in Catalogo con questo motore (apri in 3D)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchingCars.map((car) => (
                      <button
                        key={car.id}
                        type="button"
                        onClick={() => onOpenInShowroom(car.id, car.defaultColor)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-cyan-400 hover:text-cyan-300"
                      >
                        <Eye className="h-3.5 w-3.5 text-cyan-400" />
                        {car.brand} {car.model}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Timeline "Cosa si rompe a X km" */}
            <div className="glass-hud rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono-tech text-[11px] uppercase tracking-widest text-cyan-400">
                    Timeline Interattiva
                  </span>
                  <h3 className="font-heading text-xl font-bold text-white">
                    Cosa si rompe a X km
                  </h3>
                </div>
                <span className="text-xs text-zinc-400">
                  Clicca su una soglia per i dettagli
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {activeEngine.milestones.map((m) => {
                  const isActive = activeMilestone.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMilestoneId(m.id)}
                      className={`cursor-pointer rounded-2xl border p-3.5 text-left transition ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-400/15 shadow-lg shadow-cyan-500/10'
                          : 'border-white/10 bg-black/50 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono-tech text-xs font-bold text-cyan-300">
                          {m.kmThreshold.toLocaleString('it-IT')} km
                        </span>
                        {m.severity === 'critical' ? (
                          <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                        ) : m.severity === 'warning' ? (
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-white">
                        {m.componentName}
                      </p>
                    </button>
                  );
                })}
              </div>

              {activeMilestone && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/55 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <h4 className="font-heading text-base font-bold text-white">
                      {activeMilestone.componentName}
                    </h4>
                    <span className="font-mono-tech rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
                      Costo medio: {activeMilestone.estimatedCostEur}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <p className="font-mono-tech text-[11px] uppercase text-cyan-300">
                        1. Cos’è e a cosa serve
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                        {activeMilestone.whatItIs}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono-tech text-[11px] uppercase text-rose-300">
                        2. Sintomi prima del disastro
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                        {activeMilestone.symptoms}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono-tech text-[11px] uppercase text-emerald-300">
                        3. Prevenzione & Mods
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                        {activeMilestone.preventionAndMods}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live NHTSA + EU Recalls */}
            <div className="glass-hud rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono-tech text-[11px] uppercase tracking-widest text-cyan-400">
                    Bollettini Sicurezza
                  </span>
                  <h3 className="font-heading text-lg font-bold text-white">
                    Richiami Ufficiali ({recallProbeCar.brand} {recallProbeCar.model})
                  </h3>
                </div>
                <span className="font-mono-tech flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase text-zinc-300">
                  {recallsLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Interrogando NHTSA...
                    </>
                  ) : recallsLive ? (
                    'API NHTSA Live + EU Curati'
                  ) : (
                    'Database Richiami EU'
                  )}
                </span>
              </div>

              {recalls.length === 0 && !recallsLoading ? (
                <p className="mt-3 text-xs text-zinc-400">
                  Nessun richiamo critico registrato su NHTSA per {recallProbeCar.nhtsaMake}{' '}
                  {recallProbeCar.nhtsaModel} ({recallProbeCar.nhtsaYear}).
                </p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {recalls.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-white/10 bg-black/50 p-3.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-white">{r.component}</span>
                        <span className="font-mono-tech rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
                          {r.source === 'EU_CURATED' ? 'EU Safety' : 'NHTSA US'} · {r.date}
                        </span>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-zinc-300">{r.summary}</p>
                      <p className="mt-1 text-emerald-300/90">
                        <strong>Rimedio:</strong> {r.remedy}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Segnalazioni Reali Proprietari NHTSA Live */}
              {complaints && complaints.topComponents.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono-tech flex items-center gap-1.5 text-[11px] uppercase text-amber-300">
                      <BookOpen className="h-3.5 w-3.5" />
                      Segnalazioni Reali Proprietari (NHTSA Complaints: {complaints.totalCount})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {complaints.topComponents.map((cmp) => (
                      <div
                        key={cmp.component}
                        className="rounded-xl border border-white/10 bg-black/45 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{cmp.component}</span>
                          <span className="font-mono-tech rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            {cmp.count} casi
                          </span>
                        </div>
                        {cmp.sampleSummary && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                            {cmp.sampleSummary}
                          </p>
                        )}
                      </div>
                    ))}
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
