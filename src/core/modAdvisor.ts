import type { EngineWiki, RealModSpec, VehicleModel } from '../core/types';
import { MODS_CATALOG } from '../data/modsCatalog';

export interface RecommendedModItem {
  mod: RealModSpec;
  matchScore: number; // 0-100
  isTopPick: boolean;
  tailoredReason: string;
  safetyNote?: string;
  estimatedHpGainAvg: number;
  estimatedNmGainAvg: number;
}

export function getRecommendedModsForVehicle(
  vehicle: VehicleModel,
  engine: EngineWiki,
): RecommendedModItem[] {
  const results: RecommendedModItem[] = [];

  for (const mod of MODS_CATALOG) {
    if (!mod.compatibleFuels.includes(engine.fuelType)) continue;
    if (!mod.compatibleGroups.includes(vehicle.group)) continue;
    if (
      mod.id === 'scarico-r32-golf5' &&
      !vehicle.model.toLowerCase().includes('golf') &&
      !vehicle.model.toLowerCase().includes('a3')
    ) {
      continue;
    }

    let score = 50;
    let tailoredReason = `Compatibile con ${vehicle.brand} ${vehicle.model} (${engine.fuelType}).`;
    let safetyNote: string | undefined;

    if (mod.recommendedEngineIds?.includes(engine.id)) {
      score += 32;
    }
    if (mod.compatibleGroups.includes(vehicle.group)) {
      score += 12;
    }

    // Adattamento specifico per modello & codice motore reale!
    const modelLower = vehicle.model.toLowerCase();
    const isGolfV = vehicle.id.startsWith('vw-golf-5');
    const isGolf = modelLower.includes('golf') || modelLower.includes('a3');

    if (mod.id === 'scarico-r32-golf5') {
      if (isGolfV) {
        score = 99;
        tailoredReason = `Match perfetto per ${vehicle.model}: il diffusore R32 plug & play trasforma il posteriore con doppio scarico centrale da 100 mm.`;
      } else if (isGolf) {
        score = 78;
        tailoredReason = `Look centrale ispirato R32 adatto alla tua ${vehicle.generation} con terminale omologato.`;
      } else {
        score -= 20;
      }
    }

    if (mod.id === 'kit-bronzine-sputter') {
      if (engine.id === 'vag-19-tdi' || engine.id === 'renault-15-dci-early') {
        score = 98;
        tailoredReason = `Consiglio d'oro per ${engine.code}: se il tuo basamento è BXE/BLS o K9K, protegge il motore prima di qualsiasi rimappa!`;
      } else {
        continue; // non pertinente ad altri motori
      }
    }

    if (mod.id === 'slamellamento-swirl') {
      if (
        engine.id === 'bmw-m57' ||
        engine.id === 'bmw-n47' ||
        engine.id === 'fiat-19-jtd' ||
        engine.id === 'vag-30-v6-tdi'
      ) {
        score = 97;
        tailoredReason = `Modifica salva-motore raccomandata su ${engine.code}: elimina per sempre il rischio distacco farfalle aspirazione.`;
      } else {
        continue;
      }
    }

    if (mod.id === 'mappa-stage1-dsg') {
      if (engine.id === 'stellantis-12-puretech') {
        score = 45;
        safetyNote =
          'ATTENZIONE sul 1.2 PureTech: prima controlla spessore cinghia a bagno d’olio e succhieruola!';
        tailoredReason = 'Guadagno modesto (+15/20 CV) ma prioritario fare manutenzione preventiva prima.';
      } else if (engine.fuelType === 'Diesel' || engine.id.includes('ea888') || engine.id.includes('tjet') || engine.id.includes('20-turbo')) {
        score = 96;
        tailoredReason = `Miglior rapporto € / cavalli per ${vehicle.brand} ${vehicle.model}: +${mod.hpGainMin}–${mod.hpGainMax} CV e +${mod.nmGainMin}–${mod.nmGainMax} Nm reali.`;
      }
    }

    if (mod.id === 'turbina-arl-is38') {
      if (engine.id === 'vag-19-tdi') {
        score = 93;
        tailoredReason = 'Sulle Golf/A3 1.9 TDI la turbina GT1749VB (del 150 CV ARL) monta plug & play portandoti a ~175–185 CV.';
        safetyNote = 'Verifica prima stato volano bimassa, frizione e bronzine (se BXE).';
      } else if (engine.id === 'vag-ea888-gen3' || engine.id === 'fiat-abarth-tjet') {
        score = 92;
        tailoredReason = `Upgrade OEM+ per ${engine.code}: IS38 (VAG) o GT1446 (T-Jet) sbloccano spinta fino a limitatore.`;
      } else {
        continue;
      }
    }

    if (mod.id === 'cerchi-forgiati') {
      score += engine.fuelType === 'Elettrico' ? 28 : 10;
      tailoredReason =
        engine.fuelType === 'Elettrico'
          ? 'Sulle auto elettriche i cerchi flow-formed leggeri migliorano subito inserimento e autonomia reale!'
          : `Toglie fino a 16 kg di masse rotazionali su ${vehicle.model}: sterzo e accelerazione più pronti.`;
    }

    if (mod.id === 'freni-312-brembo' && isGolfV) {
      score += 18;
      tailoredReason = 'Su Golf V TDI/GTI l’upgrade ai dischi da 312 mm (o Brembo) si fa con portapinza OEM senza tagli.';
    }

    results.push({
      mod,
      matchScore: Math.min(100, Math.max(10, score)),
      isTopPick: score >= 85,
      tailoredReason,
      safetyNote,
      estimatedHpGainAvg: Math.round((mod.hpGainMin + mod.hpGainMax) / 2),
      estimatedNmGainAvg: Math.round((mod.nmGainMin + mod.nmGainMax) / 2),
    });
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}
