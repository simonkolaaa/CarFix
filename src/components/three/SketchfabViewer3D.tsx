import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Globe, Loader2, Sparkles } from 'lucide-react';
import {
  DEFAULT_VISUAL_MODS,
  type VehicleModel,
  type VisualModsConfig,
} from '../../core/types';
import {
  buildSketchfabEmbedUrl,
  getPreferredModelIndex,
  hexToLinearRgb,
  loadSketchfabViewerSdk,
  searchSketchfabModelsForVehicle,
  type SketchfabCarModel,
  type SketchfabMaterial,
  type SketchfabViewerApi,
} from '../../services/sketchfabApi';

interface SketchfabViewer3DProps {
  vehicle: VehicleModel;
  paintHex?: string;
  paintAppliedNonce?: number;
  visualMods?: VisualModsConfig;
  compact?: boolean;
}

const RIM_HEX: Record<VisualModsConfig['rimFinish'], string> = {
  silver: '#d4d4d8',
  anthracite: '#52525b',
  black: '#111115',
  gold: '#eab308',
  bronze: '#a16207',
};

const CALIPER_HEX: Record<VisualModsConfig['caliperColor'], string> = {
  stock: '#71717a',
  red: '#dc2626',
  yellow: '#facc15',
  blue: '#2563eb',
  lime: '#84cc16',
};

function applyMaterialsToViewer(
  api: SketchfabViewerApi,
  materials: SketchfabMaterial[],
  paintHex?: string,
  applyBodyPaint = false,
  visualMods: VisualModsConfig = DEFAULT_VISUAL_MODS,
) {
  try {
    const bodyRgb = paintHex ? hexToLinearRgb(paintHex) : null;
    const rimRgb = hexToLinearRgb(RIM_HEX[visualMods.rimFinish] ?? '#d4d4d8');
    const chosenCaliperKey =
      visualMods.caliperColor !== 'stock'
        ? visualMods.caliperColor
        : visualMods.bremboCalipers
          ? 'red'
          : 'stock';
    const caliperRgb = hexToLinearRgb(CALIPER_HEX[chosenCaliperKey]);

    for (const mat of materials) {
      const name = (mat.name || '').toLowerCase();
      const albedo = mat.channels?.AlbedoPBR ?? mat.channels?.DiffuseColor;
      if (!albedo) continue;

      const isGlass =
        name.includes('glass') ||
        name.includes('window') ||
        name.includes('windshield') ||
        name.includes('vetr');
      const isTire = name.includes('tire') || name.includes('tyre') || name.includes('rubber');
      const isLight = name.includes('light') || name.includes('lamp') || name.includes('tail');
      const isInterior = name.includes('int') || name.includes('seat') || name.includes('dash');

      const isBody =
        !isGlass &&
        !isTire &&
        !isLight &&
        !isInterior &&
        (name.includes('paint') ||
          name.includes('carpaint') ||
          name.includes('body') ||
          name.includes('coat') ||
          name.includes('chasis') ||
          name.includes('chassis') ||
          name.includes('exterior') ||
          name.includes('metal_paint'));

      const isRim =
        !isTire &&
        (name.includes('rim') ||
          name.includes('alloy') ||
          name.includes('wheel_metal') ||
          name.includes('cerch') ||
          (name.includes('wheel') && !name.includes('steering')));

      const isCaliper =
        name.includes('caliper') ||
        name.includes('brake_cal') ||
        name.includes('pinz') ||
        (name.includes('brake') && !name.includes('disc'));

      if (applyBodyPaint && bodyRgb && isBody) {
        const updated = { ...mat, channels: { ...mat.channels } };
        updated.channels.AlbedoPBR = { ...albedo, enable: true, color: bodyRgb };
        api.setMaterial(updated);
      } else if (isRim) {
        const updated = { ...mat, channels: { ...mat.channels } };
        updated.channels.AlbedoPBR = { ...albedo, enable: true, color: rimRgb };
        api.setMaterial(updated);
      } else if (isCaliper && chosenCaliperKey !== 'stock') {
        const updated = { ...mat, channels: { ...mat.channels } };
        updated.channels.AlbedoPBR = { ...albedo, enable: true, color: caliperRgb };
        api.setMaterial(updated);
      } else if (isGlass && visualMods.tintedGlass && mat.channels?.Opacity) {
        const updated = { ...mat, channels: { ...mat.channels } };
        updated.channels.Opacity = { ...mat.channels.Opacity, factor: 0.92 };
        updated.channels.AlbedoPBR = { ...albedo, enable: true, color: [0.02, 0.02, 0.03] };
        api.setMaterial(updated);
      }
    }
  } catch {
    // Ignore third-party model material quirks
  }
}

export function SketchfabViewer3D({
  vehicle,
  paintHex,
  paintAppliedNonce = 0,
  visualMods = DEFAULT_VISUAL_MODS,
  compact = false,
}: SketchfabViewer3DProps) {
  const [models, setModels] = useState<SketchfabCarModel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [sdkFallbackEmbed, setSdkFallbackEmbed] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<SketchfabViewerApi | null>(null);
  const materialsRef = useRef<SketchfabMaterial[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    searchSketchfabModelsForVehicle(vehicle).then((res) => {
      if (!active) return;
      setModels(res.models);
      setFromApi(res.fromApi);
      setActiveIndex(getPreferredModelIndex(res.models, visualMods));
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [vehicle]);

  useEffect(() => {
    if (models.length <= 1) return;
    const preferred = getPreferredModelIndex(models, visualMods);
    if (preferred !== 0) {
      setActiveIndex(preferred);
    }
  }, [visualMods.exhaustStyle, visualMods.spoiler, visualMods.lowered, models]);

  const current = models[activeIndex] ?? null;

  useEffect(() => {
    if (!current || !iframeRef.current) return;
    let cancelled = false;
    apiRef.current = null;
    materialsRef.current = [];
    setSdkFallbackEmbed(false);

    loadSketchfabViewerSdk().then((SketchfabCtor) => {
      if (cancelled || !iframeRef.current) return;
      if (!SketchfabCtor) {
        setSdkFallbackEmbed(true);
        return;
      }

      try {
        const client = new SketchfabCtor('1.12.1', iframeRef.current);
        client.init(current.uid, {
          autostart: 1,
          preload: 1,
          transparent: 1,
          ui_theme: 'dark',
          ui_infos: 0,
          ui_watermark: 0,
          ui_stop: 0,
          ui_help: 0,
          ui_hint: 0,
          ui_settings: 0,
          ui_vr: 0,
          ui_ar: 0,
          ui_share: 0,
          ui_annotations: 0,
          ui_controls: 0,
          ui_fullscreen: 0,
          ui_inspector: 0,
          success: (api) => {
            if (cancelled) return;
            apiRef.current = api;
            api.start();
            api.addEventListener('viewerready', () => {
              if (cancelled) return;
              // Forza lo sfondo dello studio esattamente uguale a #060609 (niente rettangoli grigi!)
              try {
                api.setBackground?.({ color: [0.024, 0.024, 0.036], enable: 'fixed' });
              } catch {
                // ignore if scene locks background
              }
              api.getMaterialList((err, mats) => {
                if (!err && Array.isArray(mats)) {
                  materialsRef.current = mats;
                  applyMaterialsToViewer(
                    api,
                    mats,
                    paintHex,
                    paintAppliedNonce > 0,
                    visualMods,
                  );
                }
              });
            });
          },
          error: () => {
            if (!cancelled) setSdkFallbackEmbed(true);
          },
        });
      } catch {
        setSdkFallbackEmbed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [current?.uid]);

  useEffect(() => {
    if (!apiRef.current || materialsRef.current.length === 0) return;
    applyMaterialsToViewer(
      apiRef.current,
      materialsRef.current,
      paintHex,
      paintAppliedNonce > 0,
      visualMods,
    );
  }, [
    paintHex,
    paintAppliedNonce,
    visualMods.rimFinish,
    visualMods.bremboCalipers,
    visualMods.caliperColor,
    visualMods.tintedGlass,
  ]);

  const activeModBadges: string[] = [];
  if (visualMods.exhaustStyle === 'r32_center') activeModBadges.push('Scarico R32');
  if (visualMods.exhaustStyle === 'quad') activeModBadges.push('Scarico Quad');
  if (visualMods.lowered) activeModBadges.push('Coilover -35mm');
  if (visualMods.bremboCalipers || visualMods.caliperColor !== 'stock') {
    activeModBadges.push(`Pinze ${visualMods.caliperColor === 'stock' ? 'Rosse' : visualMods.caliperColor.toUpperCase()}`);
  }
  if (visualMods.tintedGlass) activeModBadges.push('Vetri Privacy');
  if (visualMods.rimFinish !== 'silver') {
    activeModBadges.push(`Cerchi ${visualMods.rimInches}" ${visualMods.rimFinish}`);
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#060609]">
      {loading ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#060609] text-zinc-300">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="font-mono-tech text-xs uppercase tracking-widest text-zinc-400">
            Caricamento sagoma 3D reale ({vehicle.brand} {vehicle.model})...
          </p>
        </div>
      ) : current ? (
        <>
          {/* Clipping verticale -56px sopra e sotto: nasconde totalmente i watermark/barre Sketchfab */}
          <div className="absolute inset-0 overflow-hidden bg-[#060609]">
            <iframe
              key={`${current.uid}-${sdkFallbackEmbed ? 'fb' : 'sdk'}`}
              ref={iframeRef}
              title={`Modello 3D ${vehicle.brand} ${vehicle.model}`}
              src={sdkFallbackEmbed ? buildSketchfabEmbedUrl(current.uid) : undefined}
              className="absolute -top-14 left-0 h-[calc(100%+7rem)] w-full border-0 bg-[#060609]"
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
            />
          </div>

          {/* Sfumature morbide sui bordi (niente stacchi o contorni grezzi sullo sfondo!) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-[#060609] via-[#060609]/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-[#060609] via-[#060609]/70 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#060609]/90 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#060609]/90 to-transparent" />

          {/* Switcher variante 3D pulito in basso */}
          {models.length > 1 && (
            <div
              className={`pointer-events-auto absolute z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-3 py-1 text-[11px] backdrop-blur-md ${
                compact ? 'bottom-3 left-3' : 'bottom-28 left-6 hidden sm:flex'
              }`}
            >
              <Globe className="h-3 w-3 text-cyan-400" />
              <span className="font-mono-tech text-[10px] uppercase tracking-wider text-cyan-300">
                {fromApi ? 'Variante 3D' : 'Modello'}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i - 1 + models.length) % models.length)}
                className="cursor-pointer rounded-full p-0.5 text-zinc-300 hover:bg-white/15 hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono-tech text-[10px] text-white">
                {activeIndex + 1}/{models.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i + 1) % models.length)}
                className="cursor-pointer rounded-full p-0.5 text-zinc-300 hover:bg-white/15 hover:text-white"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {activeModBadges.length > 0 && !compact && (
            <div className="pointer-events-none absolute right-6 top-44 z-20 hidden flex-col items-end gap-1.5 lg:flex">
              {activeModBadges.map((badge) => (
                <span
                  key={badge}
                  className="font-mono-tech inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-black/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200 backdrop-blur-md"
                >
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  {badge}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-zinc-300">
            Nessuna sagoma 3D trovata per {vehicle.brand} {vehicle.model}.
          </p>
        </div>
      )}
    </div>
  );
}
