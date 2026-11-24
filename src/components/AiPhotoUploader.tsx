import { useState, type ChangeEvent } from 'react';
import { Camera, CheckCircle2, Loader2, ShieldAlert, Upload } from 'lucide-react';
import { validateAndProcessCarPhoto } from '../services/carImageGatekeeper';
import type { GatekeeperVerdict } from '../core/carGatekeeperRules';
import type { RimStyleId, VisualModsConfig } from '../core/types';

interface AiPhotoUploaderProps {
  onPhotoApproved: (payload: {
    dataUrl: string;
    cutoutSucceeded?: boolean;
    dominantColorHex?: string;
    detectedRimFinish?: VisualModsConfig['rimFinish'];
    detectedRimStyle?: RimStyleId;
    detectedStance?: 'stock' | 'lowered';
    aiConfidence: number;
    aiLabel: string;
    caption: string;
  }) => void;
  compact?: boolean;
}

export function AiPhotoUploader({ onPhotoApproved, compact = false }: AiPhotoUploaderProps) {
  const [stage, setStage] = useState<'idle' | 'loading_ai' | 'scanning' | 'removing_bg'>('idle');
  const [lastVerdict, setLastVerdict] = useState<GatekeeperVerdict | null>(null);
  const [caption, setCaption] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLastVerdict(null);
    setStage('loading_ai');

    const result = await validateAndProcessCarPhoto(file, (next) => {
      if (next === 'done') setStage('idle');
      else setStage(next);
    });

    setStage('idle');
    setLastVerdict(result.verdict);

    if (result.verdict.approved && result.dataUrl) {
      onPhotoApproved({
        dataUrl: result.dataUrl,
        cutoutSucceeded: result.cutoutSucceeded,
        dominantColorHex: result.dominantColorHex,
        detectedRimFinish: result.detectedRimFinish,
        detectedRimStyle: result.detectedRimStyle,
        detectedStance: result.detectedStance,
        aiConfidence: result.verdict.confidence,
        aiLabel: result.verdict.detectedLabel,
        caption: caption.trim() || 'Riferimento Auto Reale',
      });
      setCaption('');
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-cyan-400" />
          <h4 className="font-heading text-sm font-semibold text-white">
            Carica Foto Reale → Rileva Modello, Vernice & Cerchi in 3D
          </h4>
        </div>
        <span className="font-mono-tech rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-cyan-300">
          AI Car & Rim Analyzer
        </span>
      </div>

      {!compact && (
        <p className="mt-1.5 text-xs text-zinc-400">
          Carica la foto della tua auto reale: l’AI verifica che sia una vettura (no selfie/meme),{' '}
          <span className="text-emerald-300">estrae vernice, finitura e stile cerchi</span> e li replica
          sul modello 3D del Garage così puoi rifinire ogni dettaglio!
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Nota / setup cerchi (es. Golf V grigia con cerchi neri)"
          className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/60 focus:outline-none"
        />

        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            stage !== 'idle'
              ? 'pointer-events-none bg-zinc-800 text-zinc-300'
              : 'bg-cyan-400 text-black hover:bg-cyan-300'
          }`}
        >
          {stage === 'loading_ai' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Carico AI...
            </>
          )}
          {stage === 'scanning' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisi Auto & Cerchi...
            </>
          )}
          {stage === 'idle' && (
            <>
              <Upload className="h-4 w-4" />
              Analizza Foto Auto
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={stage !== 'idle'}
            className="hidden"
          />
        </label>
      </div>

      {lastVerdict && (
        <div
          className={`mt-3 flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
            lastVerdict.approved
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          {lastVerdict.approved ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          )}
          <div>
            <p className="font-medium leading-relaxed">{lastVerdict.message}</p>
            <p className="font-mono-tech mt-1 text-[10px] opacity-75">
              Rilevato: {lastVerdict.detectedLabel} · Confidenza: {Math.round(lastVerdict.confidence * 100)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
