import type {
  EngineWiki,
  RealModSpec,
  VehicleModel,
  VisualModsConfig,
} from '../core/types';

export interface LiveWikiSummary {
  title: string;
  description: string;
  extract: string;
  pageUrl: string;
  thumbnailUrl?: string;
  source: 'IT_WIKI' | 'EN_WIKI' | 'FALLBACK';
}

export interface NhtsaComplaintGroup {
  component: string;
  count: number;
  sampleSummary: string;
}

export interface NhtsaComplaintsReport {
  totalCount: number;
  topComponents: NhtsaComplaintGroup[];
  liveLoaded: boolean;
}

export interface LiveVehicleTelemetry {
  baseHp: number;
  baseNm: number;
  liveHp: number;
  liveNm: number;
  hpDelta: number;
  nmDelta: number;
  base0To100: number;
  live0To100: number;
  topSpeedKmh: number;
  estimatedWeightKg: number;
  powerToWeightKgPerHp: number;
  activeModsSummary: string[];
}

const WIKI_CACHE_PREFIX = 'carfix_wiki_live_v2_';
const COMPLAINTS_CACHE_PREFIX = 'carfix_nhtsa_cmp_v1_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface WikiRestResponse {
  title?: string;
  description?: string;
  extract?: string;
  content_urls?: {
    desktop?: { page?: string };
  };
  thumbnail?: {
    source?: string;
  };
}

function buildWikiArticleSlug(vehicle: VehicleModel): string {
  const clean = vehicle.model.replace(/\(.*?\)/g, '').trim();
  const tokens = clean
    .replace(/\b(Mk\d|IV|V|VI|VII|VIII|\d\.\d|TDI|TSI|TFSI|GTI|GTE|R32|JTDm?|PureTech|Fire|EcoBoost|EV)\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return `${vehicle.brand} ${tokens.join(' ')}`.trim();
}

export function cleanWikiExtract(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/^={2,}\s*(.*?)\s*={2,}$/gm, '$1:')
    .replace(/={2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function queryFullWikiExtract(
  lang: 'it' | 'en',
  exactTitle: string,
): Promise<{ extract?: string; thumbnail?: string } | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exchars=1600&explaintext=1&pithumbsize=640&titles=${encodeURIComponent(exactTitle)}&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: {
        pages?: Record<string, { extract?: string; thumbnail?: { source?: string } }>;
      };
    };
    const page = data.query?.pages ? Object.values(data.query.pages)[0] : null;
    if (!page?.extract) return null;
    return { extract: cleanWikiExtract(page.extract), thumbnail: page.thumbnail?.source };
  } catch {
    return null;
  }
}

async function queryWikiSummary(lang: 'it' | 'en', titleOrQuery: string): Promise<LiveWikiSummary | null> {
  try {
    const slug = encodeURIComponent(titleOrQuery.replace(/\s+/g, '_'));
    const directUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(4500) });
    if (res.ok) {
      const data = (await res.json()) as WikiRestResponse;
      if (data.extract && data.extract.length > 30) {
        const resolvedTitle = data.title ?? titleOrQuery;
        const deep = await queryFullWikiExtract(lang, resolvedTitle);
        return {
          title: resolvedTitle,
          description: data.description ?? `Scheda enciclopedica ${lang.toUpperCase()}`,
          extract: deep?.extract && deep.extract.length > data.extract.length ? deep.extract : cleanWikiExtract(data.extract),
          pageUrl:
            data.content_urls?.desktop?.page ??
            `https://${lang}.wikipedia.org/wiki/${slug}`,
          thumbnailUrl: deep?.thumbnail ?? data.thumbnail?.source,
          source: lang === 'it' ? 'IT_WIKI' : 'EN_WIKI',
        };
      }
    }

    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(titleOrQuery)}&srlimit=1&format=json&origin=*`;
    const sRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4500) });
    if (!sRes.ok) return null;
    const sData = (await sRes.json()) as {
      query?: { search?: Array<{ title?: string }> };
    };
    const hitTitle = sData.query?.search?.[0]?.title;
    if (!hitTitle) return null;

    const deep = await queryFullWikiExtract(lang, hitTitle);
    const hitSlug = encodeURIComponent(hitTitle.replace(/\s+/g, '_'));
    if (deep?.extract) {
      return {
        title: hitTitle,
        description: `Enciclopedia ${lang.toUpperCase()}`,
        extract: deep.extract,
        pageUrl: `https://${lang}.wikipedia.org/wiki/${hitSlug}`,
        thumbnailUrl: deep.thumbnail,
        source: lang === 'it' ? 'IT_WIKI' : 'EN_WIKI',
      };
    }

    const hitRes = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${hitSlug}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!hitRes.ok) return null;
    const hitData = (await hitRes.json()) as WikiRestResponse;
    if (!hitData.extract) return null;

    return {
      title: hitData.title ?? hitTitle,
      description: hitData.description ?? `Scheda enciclopedica ${lang.toUpperCase()}`,
      extract: cleanWikiExtract(hitData.extract),
      pageUrl:
        hitData.content_urls?.desktop?.page ??
        `https://${lang}.wikipedia.org/wiki/${hitSlug}`,
      thumbnailUrl: hitData.thumbnail?.source,
      source: lang === 'it' ? 'IT_WIKI' : 'EN_WIKI',
    };
  } catch {
    return null;
  }
}

export async function fetchWikiLiveSearch(query: string): Promise<LiveWikiSummary | null> {
  const q = query.trim();
  if (q.length < 2) return null;
  const itHit = await queryWikiSummary('it', q);
  if (itHit) return itHit;
  return await queryWikiSummary('en', q);
}

export async function fetchVehicleLiveWiki(vehicle: VehicleModel): Promise<LiveWikiSummary> {
  const query = buildWikiArticleSlug(vehicle);
  const cacheKey = `${WIKI_CACHE_PREFIX}${query.toLowerCase()}`;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { ts: number; data: LiveWikiSummary };
      if (Date.now() - parsed.ts < CACHE_TTL_MS) {
        return parsed.data;
      }
    }
  } catch {
    // Ignore storage errors
  }

  const itHit = await queryWikiSummary('it', query);
  if (itHit) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: itHit }));
    } catch {
      // Ignore quota
    }
    return itHit;
  }

  const enHit = await queryWikiSummary('en', query);
  if (enHit) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: enHit }));
    } catch {
      // Ignore quota
    }
    return enHit;
  }

  return {
    title: `${vehicle.brand} ${vehicle.model}`,
    description: `${vehicle.generation} · ${vehicle.years}`,
    extract: vehicle.highlightNote,
    pageUrl: `https://it.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
    source: 'FALLBACK',
  };
}

export async function fetchNhtsaOwnerComplaints(
  make: string,
  model: string,
  year: number,
): Promise<NhtsaComplaintsReport> {
  const cacheKey = `${COMPLAINTS_CACHE_PREFIX}${make.toUpperCase()}_${model.toUpperCase()}_${year}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { ts: number; data: NhtsaComplaintsReport };
      if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch {
    // Ignore
  }

  try {
    const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(String(year))}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5500) });
    if (!res.ok) return { totalCount: 0, topComponents: [], liveLoaded: false };

    const data = (await res.json()) as {
      count?: number;
      results?: Array<{ components?: string; summary?: string }>;
    };
    const grouped = new Map<string, { count: number; sampleSummary: string }>();
    for (const item of data.results ?? []) {
      const comp = (item.components || 'ALTRO').split(',')[0].trim();
      const prev = grouped.get(comp);
      if (prev) {
        prev.count++;
      } else {
        grouped.set(comp, {
          count: 1,
          sampleSummary: (item.summary || '').slice(0, 220),
        });
      }
    }

    const topComponents: NhtsaComplaintGroup[] = Array.from(grouped.entries())
      .map(([component, info]) => ({
        component,
        count: info.count,
        sampleSummary: info.sampleSummary,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const report: NhtsaComplaintsReport = {
      totalCount: data.count ?? (data.results?.length ?? 0),
      topComponents,
      liveLoaded: true,
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: report }));
    } catch {
      // Ignore quota
    }
    return report;
  } catch {
    return { totalCount: 0, topComponents: [], liveLoaded: false };
  }
}

function estimateBaseWeightKg(vehicle: VehicleModel): number {
  switch (vehicle.bodyArchetype) {
    case 'hatchback':
      return vehicle.brand === 'Fiat' && vehicle.model.includes('Panda') ? 1050 : 1320;
    case 'sedan':
      return 1520;
    case 'wagon':
      return 1590;
    case 'coupe':
      return 1460;
    case 'suv':
      return 1780;
    case 'muscle':
      return 1740;
    case 'jdm':
      return vehicle.model.includes('MX-5') ? 1070 : 1410;
    default:
      return 1400;
  }
}

export function computeLiveVehicleTelemetry(
  vehicle: VehicleModel,
  engine: EngineWiki,
  visualMods: VisualModsConfig,
  installedModSpecs: RealModSpec[] = [],
): LiveVehicleTelemetry {
  const baseWeight = estimateBaseWeightKg(vehicle);
  let hpDelta = 0;
  let nmDelta = 0;
  let zeroHundredModDelta = 0;
  let weightDelta = 0;
  const activeModsSummary: string[] = [];

  for (const mod of installedModSpecs) {
    const avgHp = Math.round((mod.hpGainMin + mod.hpGainMax) / 2);
    const avgNm = Math.round((mod.nmGainMin + mod.nmGainMax) / 2);
    hpDelta += avgHp;
    nmDelta += avgNm;
    zeroHundredModDelta += mod.zeroToHundredDeltaSec;
    if (mod.id === 'cerchi-forgiati') weightDelta -= 16;
    activeModsSummary.push(mod.name.split('(')[0].trim());
  }

  if (visualMods.exhaustStyle === 'r32_center') {
    hpDelta += engine.fuelType === 'Benzina' ? 3 : 2;
    nmDelta += 4;
    activeModsSummary.push('Scarico R32 Centrale');
  } else if (visualMods.exhaustStyle === 'quad') {
    hpDelta += engine.fuelType === 'Elettrico' ? 0 : 12;
    nmDelta += engine.fuelType === 'Elettrico' ? 0 : 18;
    zeroHundredModDelta -= 0.15;
    activeModsSummary.push('Scarico Quad / Downpipe');
  }

  if (visualMods.lowered) {
    zeroHundredModDelta -= 0.12;
    activeModsSummary.push('Assetto Coilover -35mm');
  }
  if (visualMods.bremboCalipers) {
    activeModsSummary.push('Pinze Brembo Racing');
  }
  if (visualMods.rimFinish === 'gold' || visualMods.rimStyle === 'oz_ultraleggera') {
    weightDelta -= 12;
    zeroHundredModDelta -= 0.1;
  }
  if (visualMods.spoiler) {
    activeModsSummary.push('Spoiler Clubsport');
  }

  const liveHp = vehicle.powerHp + hpDelta;
  const liveNm = vehicle.torqueNm + nmDelta;
  const estimatedWeightKg = Math.max(890, baseWeight + weightDelta);

  const rawBase0100 = Math.max(2.9, Math.min(13.8, (baseWeight / Math.max(55, vehicle.powerHp)) * 0.72 + 1.3));
  const base0To100 = Number(rawBase0100.toFixed(1));

  const hpFactor = vehicle.powerHp / Math.max(vehicle.powerHp, liveHp);
  const live0To100 = Number(
    Math.max(2.6, Math.min(base0To100, rawBase0100 * Math.pow(hpFactor, 0.85) + zeroHundredModDelta)).toFixed(1),
  );

  const topSpeedKmh = Math.round(Math.min(340, 145 + Math.pow(liveHp, 0.62) * 3.8));
  const powerToWeightKgPerHp = Number((estimatedWeightKg / Math.max(1, liveHp)).toFixed(2));

  return {
    baseHp: vehicle.powerHp,
    baseNm: vehicle.torqueNm,
    liveHp,
    liveNm,
    hpDelta,
    nmDelta,
    base0To100,
    live0To100,
    topSpeedKmh,
    estimatedWeightKg,
    powerToWeightKgPerHp,
    activeModsSummary: Array.from(new Set(activeModsSummary)),
  };
}
