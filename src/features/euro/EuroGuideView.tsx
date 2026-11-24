import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Cpu, Leaf, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { EuroClass } from '../../core/types';
import { EURO_STANDARDS_GUIDE } from '../../data/euroStandards';
import { ENGINES_BY_ID } from '../../data/engines';

interface EuroGuideViewProps {
  focusedEuro?: EuroClass | null;
  onOpenEngineWiki: (engineId: string) => void;
}

export function EuroGuideView({ focusedEuro, onOpenEngineWiki }: EuroGuideViewProps) {
  const [selectedEuro, setSelectedEuro] = useState<EuroClass>(focusedEuro ?? 'EURO_0');

  useEffect(() => {
    if (focusedEuro) setSelectedEuro(focusedEuro);
  }, [focusedEuro]);

  const current =
    EURO_STANDARDS_GUIDE.find((e) => e.id === selectedEuro) ?? EURO_STANDARDS_GUIDE[0];

  return (
    <section className="studio-grid min-h-screen bg-[#08080b] px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <span className="font-mono-tech text-[11px] uppercase tracking-[0.22em] text-cyan-400">
            Guida Tecnica & ZTL Italia
          </span>
          <h1 className="font-display hero-title-clamp mt-1 font-bold text-white">
            Da Euro 0 a Euro 7: cos’è cambiato davvero
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            Ogni nuova norma sulle emissioni ha salvato i polmoni in città ma ha aggiunto componenti sotto il cofano
            (catalizzatori, EGR, FAP/DPF, AdBlue, sensori). Ecco la guida completa, senza tecnicismi inutili.
          </p>
        </div>

        {/* Interactive Step Bar Euro 0 -> Euro 7 */}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {EURO_STANDARDS_GUIDE.map((step) => {
            const active = step.id === current.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedEuro(step.id)}
                className={`cursor-pointer rounded-2xl border p-3 text-left transition ${
                  active
                    ? 'border-cyan-400 bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
                    : 'border-white/10 bg-zinc-950/80 text-zinc-300 hover:border-white/30 hover:text-white'
                }`}
              >
                <span className="font-mono-tech block text-[10px] font-semibold opacity-75">
                  {step.yearIntroduced}
                </span>
                <span className="font-display mt-0.5 block text-sm font-bold sm:text-base">
                  {step.label.split(' ')[0]} {step.label.split(' ')[1]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Bento Card */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: Overview & Emission Bars */}
          <div className="glass-hud rounded-3xl p-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-tech rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                Introdotta nel {current.yearIntroduced}
              </span>
              <span className="font-mono-tech text-xs text-zinc-400">
                Scala relativa rispetto a Euro 0 = 100%
              </span>
            </div>

            <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
              {current.label}
            </h2>
            <p className="mt-1 text-base font-medium italic text-cyan-200">
              “{current.ironicTagline}”
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{current.summary}</p>

            {/* Animated Bars */}
            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/50 p-4">
              <p className="font-mono-tech flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400">
                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                Limiti residui ammessi allo scarico (più basso = più pulito)
              </p>
              {[
                { label: 'Monossido di Carbonio (CO)', val: current.coIndex, color: 'bg-sky-400' },
                { label: 'Ossidi di Azoto (NOx)', val: current.noxIndex, color: 'bg-amber-400' },
                { label: 'Particolato Fine (PM)', val: current.pmIndex, color: 'bg-emerald-400' },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="mb-1 flex justify-between text-xs text-zinc-300">
                    <span>{bar.label}</span>
                    <span className="font-mono-tech">{bar.val}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                      style={{ width: `${bar.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Hardware Introduced */}
            <div className="mt-5">
              <h3 className="font-mono-tech mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-400">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                Pezzi introdotti sotto l’auto
              </h3>
              <div className="flex flex-wrap gap-2">
                {current.hardwareIntroduced.map((hw) => (
                  <span
                    key={hw}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-100"
                  >
                    {hw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Reliability Impact, ZTL & Linked Engines */}
          <div className="space-y-4 lg:col-span-5">
            <div className="glass-hud rounded-2xl border-amber-500/25 p-5">
              <h3 className="font-heading flex items-center gap-2 text-sm font-bold text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                Effetti collaterali sull’affidabilità
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {current.reliabilitySideEffects}
              </p>
            </div>

            <div className="glass-hud rounded-2xl border-rose-500/25 p-5">
              <h3 className="font-heading flex items-center gap-2 text-sm font-bold text-rose-300">
                <ShieldAlert className="h-4 w-4" />
                ZTL, Area B & Blocchi del traffico in Italia
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {current.ztlItalyStatus}
              </p>
            </div>

            <div className="glass-hud rounded-2xl border-emerald-500/25 p-5">
              <h3 className="font-heading flex items-center gap-2 text-sm font-bold text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Consiglio d’acquisto CarFix
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {current.buyingAdvice}
              </p>
            </div>

            <div className="glass-hud rounded-2xl p-5">
              <h3 className="font-mono-tech text-xs uppercase tracking-wider text-zinc-400">
                Motori simbolo di questa era nella Wiki
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {current.exampleEngineIds.map((id) => {
                  const eng = ENGINES_BY_ID[id];
                  if (!eng) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenEngineWiki(id)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                    >
                      {eng.code}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
