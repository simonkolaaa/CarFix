import type { CuratedRecall, RecallItem } from '../core/types';

interface NhtsaRecallRaw {
  NHTSACampaignNumber?: string;
  ReportReceivedDate?: string;
  Component?: string;
  Summary?: string;
  Remedy?: string;
}

interface NhtsaCacheEntry {
  timestamp: number;
  items: RecallItem[];
}

const CACHE_PREFIX = 'carfix_nhtsa_v1_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function fetchVehicleRecalls(
  make: string,
  model: string,
  year: number,
  euCurated: CuratedRecall[] = [],
): Promise<{ items: RecallItem[]; liveLoaded: boolean }> {
  const curatedItems: RecallItem[] = euCurated.map((r) => ({
    id: r.id,
    source: 'EU_CURATED',
    date: r.date,
    component: r.component,
    summary: r.summary,
    remedy: r.remedy,
  }));

  const cacheKey = `${CACHE_PREFIX}${make.toUpperCase()}_${model.toUpperCase()}_${year}`;

  try {
    const rawCache = localStorage.getItem(cacheKey);
    if (rawCache) {
      const parsed = JSON.parse(rawCache) as NhtsaCacheEntry;
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return {
          items: [...curatedItems, ...parsed.items],
          liveLoaded: true,
        };
      }
    }
  } catch {
    // Ignore storage parse failure
  }

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5500);
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(String(year))}`;

    const res = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timeout);

    if (!res.ok) {
      return { items: curatedItems, liveLoaded: false };
    }

    const data = (await res.json()) as { results?: NhtsaRecallRaw[] };
    const liveItems: RecallItem[] = (data.results ?? []).slice(0, 6).map((item, idx) => ({
      id: item.NHTSACampaignNumber ?? `nhtsa-${idx}`,
      source: 'NHTSA_LIVE',
      date: item.ReportReceivedDate ?? 'N/D',
      component: item.Component ?? 'Componente NHTSA',
      summary: item.Summary ?? 'Bollettino di sicurezza ufficiale registrato presso NHTSA.',
      remedy: item.Remedy ?? 'Verifica numero telaio (VIN) presso rete ufficiale.',
    }));

    try {
      const payload: NhtsaCacheEntry = {
        timestamp: Date.now(),
        items: liveItems,
      };
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }

    return {
      items: [...curatedItems, ...liveItems],
      liveLoaded: true,
    };
  } catch {
    return { items: curatedItems, liveLoaded: false };
  }
}
