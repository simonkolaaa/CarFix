import { useMemo, useState } from 'react';
import {
  ArrowBigUp,
  BookOpen,
  Eye,
  Gauge,
  MessageCircle,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wrench,
} from 'lucide-react';
import type { CommunityBuild, ModCategory, RealModSpec, VisualModsConfig } from '../../core/types';
import { CATALOG_BY_ID } from '../../data/catalog';
import { MODS_BY_ID, MODS_CATALOG } from '../../data/modsCatalog';

interface CommunityViewProps {
  builds: CommunityBuild[];
  onToggleUpvote: (buildId: string) => void;
  onAddComment: (buildId: string, author: string, text: string) => void;
  onOpenInShowroom: (
    vehicleId: string,
    paintHex?: string,
    visualPatch?: Partial<VisualModsConfig>,
  ) => void;
}

const CATEGORY_LABELS: Record<'ALL' | ModCategory, string> = {
  ALL: 'Tutte le Mod',
  exhaust: 'Scarico',
  stage: 'Mappa & Turbo',
  suspension: 'Assetto',
  intake: 'Aspirazione & Intercooler',
  brakes: 'Freni',
  aesthetic: 'Cerchi & Spoiler',
};

export function CommunityView({
  builds,
  onToggleUpvote,
  onAddComment,
  onOpenInShowroom,
}: CommunityViewProps) {
  const [subTab, setSubTab] = useState<'builds' | 'mods_guide'>('builds');
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [inspectedMod, setInspectedMod] = useState<{
    buildId: string;
    spec: RealModSpec;
  } | null>(null);
  const [modCategoryFilter, setModCategoryFilter] = useState<'ALL' | ModCategory>('ALL');
  const [commentAuthor, setCommentAuthor] = useState('@appassionato');
  const [commentText, setCommentText] = useState('');

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const b of builds) {
      for (const t of b.tags) set.add(t);
    }
    return ['ALL', ...Array.from(set)];
  }, [builds]);

  const filteredBuilds = useMemo(() => {
    if (filterTag === 'ALL') return builds;
    return builds.filter((b) => b.tags.includes(filterTag));
  }, [builds, filterTag]);

  const filteredModsCatalog = useMemo(() => {
    if (modCategoryFilter === 'ALL') return MODS_CATALOG;
    return MODS_CATALOG.filter((m) => m.category === modCategoryFilter);
  }, [modCategoryFilter]);

  return (
    <section className="studio-grid min-h-screen bg-[#08080b] px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono-tech text-[11px] uppercase tracking-[0.22em] text-cyan-400">
              ModsNation Inspired · Modifiche Reali & Cosa Cambia
            </span>
            <h1 className="font-display hero-title-clamp mt-1 font-bold text-white">
              Community & Guida Modifiche
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-zinc-400">
              Clicca su qualsiasi modifica all’interno di una build (es.{' '}
              <span className="text-cyan-300">Scarico Centrale R32 Golf 5</span>) per leggere cosa cambia davvero a livello di
              sound, prestazioni, affidabilità e legalità in Italia — oppure provala subito in 3D!
            </p>
          </div>

          <div className="flex rounded-2xl border border-white/10 bg-zinc-950/90 p-1">
            <button
              type="button"
              onClick={() => setSubTab('builds')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                subTab === 'builds'
                  ? 'bg-cyan-400 text-black'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Build della Community
            </button>
            <button
              type="button"
              onClick={() => setSubTab('mods_guide')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                subTab === 'mods_guide'
                  ? 'bg-cyan-400 text-black'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Guida Modifiche ({MODS_CATALOG.length})
            </button>
          </div>
        </div>

        {subTab === 'builds' ? (
          <>
            {/* Tag Filters */}
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilterTag(tag)}
                  className={`font-mono-tech cursor-pointer rounded-xl px-3 py-1.5 text-xs transition ${
                    filterTag === tag
                      ? 'bg-cyan-400 font-bold text-black'
                      : 'border border-white/10 bg-zinc-950/70 text-zinc-300 hover:border-white/30'
                  }`}
                >
                  {tag === 'ALL' ? `Tutte le Build (${builds.length})` : tag}
                </button>
              ))}
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredBuilds.map((build) => {
                const car = CATALOG_BY_ID[build.vehicleId];
                const commentsOpen = openCommentsId === build.id;
                const activeBuildMod =
                  inspectedMod?.buildId === build.id ? inspectedMod.spec : null;

                return (
                  <article
                    key={build.id}
                    className="glass-hud flex flex-col justify-between rounded-3xl p-5 sm:p-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono-tech text-xs text-cyan-300">
                          {build.authorHandle} · {car ? `${car.brand} ${car.model}` : build.vehicleId}
                        </span>
                        <span className="font-mono-tech rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-300">
                          {build.kmOnClock.toLocaleString('it-IT')} km
                        </span>
                      </div>

                      <h2 className="font-display mt-2 text-xl font-bold text-white sm:text-2xl">
                        {build.title}
                      </h2>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="font-mono-tech inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                          <Sparkles className="h-3 w-3" />
                          {build.powerLabel}
                        </span>
                        {build.tags.map((t) => (
                          <span
                            key={t}
                            className="font-mono-tech rounded-lg bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{build.summary}</p>

                      {/* Clickable Real Mods list */}
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-3.5">
                        <p className="font-mono-tech mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
                          <Wrench className="h-3 w-3 text-cyan-400" />
                          Modifiche installate (clicca per vedere cosa cambia!)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {build.mods.map((modLabel, idx) => {
                            const specId = build.modIds?.[idx];
                            const spec = specId ? MODS_BY_ID[specId] : undefined;
                            const isSelected = activeBuildMod?.id === spec?.id && Boolean(spec);
                            return (
                              <button
                                key={`${modLabel}-${idx}`}
                                type="button"
                                onClick={() => {
                                  if (!spec) return;
                                  setInspectedMod(
                                    isSelected ? null : { buildId: build.id, spec },
                                  );
                                }}
                                className={`rounded-xl border px-2.5 py-1 text-left text-xs transition ${
                                  spec
                                    ? isSelected
                                      ? 'cursor-pointer border-cyan-400 bg-cyan-400 text-black font-bold'
                                      : 'cursor-pointer border-cyan-400/25 bg-cyan-500/10 text-cyan-200 hover:border-cyan-400'
                                    : 'border-white/10 bg-white/5 text-zinc-300'
                                }`}
                              >
                                {modLabel} {spec ? '▾' : ''}
                              </button>
                            );
                          })}
                        </div>

                        {/* Scheda "Cosa cambia" inline */}
                        {activeBuildMod && (
                          <div className="mt-3 rounded-xl border border-cyan-400/35 bg-zinc-950/90 p-3 text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-heading font-bold text-white">
                                {activeBuildMod.name}
                              </span>
                              <span className="font-mono-tech text-amber-300">
                                {activeBuildMod.estimatedCostEur}
                              </span>
                            </div>
                            <p className="text-zinc-200">{activeBuildMod.whatChangesSummary}</p>
                            <p className="text-zinc-400">
                              <strong className="text-cyan-300">Sound:</strong> {activeBuildMod.soundImpact}
                            </p>
                            <p className="text-zinc-400">
                              <strong className="text-emerald-300">Prestazioni:</strong>{' '}
                              {activeBuildMod.performanceImpact}
                            </p>
                            <p className="text-zinc-400">
                              <strong className="text-amber-300">Affidabilità:</strong>{' '}
                              {activeBuildMod.reliabilityImpact}
                            </p>
                            <p className="text-zinc-400">
                              <strong className="text-rose-300">Legalità Italia:</strong>{' '}
                              {activeBuildMod.legalityItaly}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleUpvote(build.id)}
                            className={`flex cursor-pointer items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                              build.userUpvoted
                                ? 'border-cyan-400 bg-cyan-400 text-black'
                                : 'border-white/15 bg-white/5 text-zinc-200 hover:border-cyan-400/50'
                            }`}
                          >
                            <ArrowBigUp className="h-4 w-4" />
                            {build.upvotes}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenCommentsId(commentsOpen ? null : build.id)
                            }
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {build.comments.length} commenti
                          </button>
                        </div>

                        {car && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenInShowroom(car.id, car.defaultColor, build.visualMods)
                            }
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-200"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Prova questa Build in 3D
                          </button>
                        )}
                      </div>

                      {commentsOpen && (
                        <div className="mt-3 space-y-2.5 rounded-2xl border border-white/10 bg-black/60 p-3.5">
                          {build.comments.length === 0 ? (
                            <p className="text-xs text-zinc-500">
                              Nessun commento ancora: lascia un consiglio tecnico!
                            </p>
                          ) : (
                            build.comments.map((c) => (
                              <div key={c.id} className="text-xs">
                                <span className="font-mono-tech font-semibold text-cyan-300">
                                  {c.author}
                                </span>{' '}
                                <span className="text-zinc-500">· {c.createdAt}</span>
                                <p className="mt-0.5 text-zinc-200">{c.text}</p>
                              </div>
                            ))
                          )}

                          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                            <input
                              type="text"
                              value={commentAuthor}
                              onChange={(e) => setCommentAuthor(e.target.value)}
                              placeholder="@tuonome"
                              className="font-mono-tech w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white sm:w-32"
                            />
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Scrivi un consiglio su tagliando o mods..."
                              className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!commentText.trim()) return;
                                onAddComment(build.id, commentAuthor, commentText);
                                setCommentText('');
                              }}
                              className="flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-cyan-400 px-3 py-1.5 text-xs font-bold text-black hover:bg-cyan-300"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Invia
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          /* GUIDA MODIFICHE REALI */
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_LABELS) as Array<'ALL' | ModCategory>).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setModCategoryFilter(cat)}
                  className={`font-mono-tech cursor-pointer rounded-xl px-3 py-1.5 text-xs transition ${
                    modCategoryFilter === cat
                      ? 'bg-cyan-400 font-bold text-black'
                      : 'border border-white/10 bg-zinc-950/70 text-zinc-300 hover:border-white/30'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredModsCatalog.map((mod) => (
                <div
                  key={mod.id}
                  className="glass-hud flex flex-col justify-between rounded-3xl p-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-tech rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] uppercase text-cyan-300">
                        {CATEGORY_LABELS[mod.category]}
                      </span>
                      <span className="font-mono-tech text-xs font-semibold text-amber-300">
                        {mod.estimatedCostEur}
                      </span>
                    </div>

                    <h3 className="font-display mt-2 text-xl font-bold text-white">
                      {mod.name}
                    </h3>
                    <p className="font-mono-tech mt-1 text-[11px] text-zinc-400">
                      Compatibilità: {mod.compatibleLabel}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-zinc-200">
                      {mod.whatChangesSummary}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-black/50 p-3.5 text-xs">
                      <p className="flex items-start gap-2 text-zinc-300">
                        <Volume2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                        <span>
                          <strong className="text-white">Sound:</strong> {mod.soundImpact}
                        </span>
                      </p>
                      <p className="flex items-start gap-2 text-zinc-300">
                        <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>
                          <strong className="text-white">Prestazioni:</strong> {mod.performanceImpact}
                        </span>
                      </p>
                      <p className="flex items-start gap-2 text-zinc-300">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span>
                          <strong className="text-white">Affidabilità:</strong> {mod.reliabilityImpact}
                        </span>
                      </p>
                      <p className="flex items-start gap-2 text-zinc-300">
                        <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                        <span>
                          <strong className="text-white">Legalità Italia:</strong> {mod.legalityItaly}
                        </span>
                      </p>
                    </div>
                  </div>

                  {mod.visualPatch && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInShowroom(
                          mod.id === 'scarico-r32-golf5' ? 'vw-golf-5-tdi-bkc' : 'vw-golf-75-gti',
                          undefined,
                          mod.visualPatch,
                        )
                      }
                      className="mt-4 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black hover:bg-zinc-200"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Anteprima questa Mod in 3D nello Showroom
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
