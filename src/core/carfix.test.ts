import { describe, expect, it } from 'vitest';
import { evaluateVehicleDetections } from './carGatekeeperRules';
import {
  evaluateCategorizedMaintenance,
  evaluateMaintenanceAlerts,
} from './maintenanceEngine';
import { getRecommendedModsForVehicle } from './modAdvisor';
import { CHINESE_BRANDS_BLOCKLIST, isAllowedBrand } from './vehicleRules';
import { DEFAULT_VISUAL_MODS } from './types';
import { CATALOG, CATALOG_BY_ID } from '../data/catalog';
import { ENGINES_BY_ID, ENGINES_WIKI } from '../data/engines';
import { getEngineDeepSpecs } from '../data/engineEncyclopedia';
import { EURO_STANDARDS_GUIDE } from '../data/euroStandards';
import { MODS_BY_ID, MODS_CATALOG } from '../data/modsCatalog';
import {
  ENGINE_PART_LIST,
  SIMULATOR_SCENARIOS,
  getPartSpecsForPowertrain,
} from '../data/simulatorScenarios';
import { CURATED_SKETCHFAB_MODELS, filterSketchfabCarResults } from '../services/sketchfabApi';
import { cleanWikiExtract, computeLiveVehicleTelemetry } from '../services/vehicleWikiApi';
import { getKinematicEngineConfig } from '../components/three/RealKinematicEngine3D';

describe('CarFix Domain & Rules', () => {
  it('esclude tassativamente tutti i brand cinesi dal catalogo e dalla blocklist', () => {
    const blockedExamples = [
      'BYD',
      'MG',
      'Leapmotor',
      'DR',
      'Omoda',
      'Jaecoo',
      'Geely',
      'Chery',
      'NIO',
      'XPeng',
    ];
    for (const brand of blockedExamples) {
      expect(isAllowedBrand(brand)).toBe(false);
    }

    for (const car of CATALOG) {
      expect(isAllowedBrand(car.brand)).toBe(true);
      expect(CHINESE_BRANDS_BLOCKLIST.has(car.brand.toLowerCase())).toBe(false);
    }
  });

  it('include tutti i 9 brand VAG e tutti i 14 brand Stellantis (senza Leapmotor)', () => {
    const vagBrands = [
      'Volkswagen',
      'Audi',
      'SEAT',
      'CUPRA',
      'Škoda',
      'Porsche',
      'Lamborghini',
      'Bentley',
      'Bugatti',
    ];
    const stellantisBrands = [
      'Fiat',
      'Abarth',
      'Alfa Romeo',
      'Lancia',
      'Maserati',
      'Peugeot',
      'Citroën',
      'DS Automobiles',
      'Opel',
      'Vauxhall',
      'Jeep',
      'Dodge',
      'Chrysler',
      'RAM',
    ];

    const catalogBrands = new Set(CATALOG.map((c) => c.brand));
    for (const b of vagBrands) expect(catalogBrands.has(b)).toBe(true);
    for (const b of stellantisBrands) expect(catalogBrands.has(b)).toBe(true);
    expect(catalogBrands.has('Leapmotor')).toBe(false);
  });

  it('copre il 100% dei veicoli del catalogo con un modello 3D dedicato distinto per ogni auto', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(110);
    for (const car of CATALOG) {
      const models = CURATED_SKETCHFAB_MODELS[car.id];
      expect(models, `Manca modello 3D dedicato per ${car.id}`).toBeDefined();
      expect(models.length).toBeGreaterThan(0);
    }

    // Verifica che modelli diversi NON mostrino la stessa identica sagoma errata
    expect(CURATED_SKETCHFAB_MODELS['vw-id3-ev'][0].uid).not.toBe(
      CURATED_SKETCHFAB_MODELS['vw-golf-8-gti'][0].uid,
    );
    expect(CURATED_SKETCHFAB_MODELS['seat-leon-19-tdi'][0].uid).not.toBe(
      CURATED_SKETCHFAB_MODELS['cupra-formentor-vz'][0].uid,
    );
    expect(CURATED_SKETCHFAB_MODELS['peugeot-208-puretech'][0].uid).not.toBe(
      CURATED_SKETCHFAB_MODELS['peugeot-308-hdi'][0].uid,
    );
    expect(CURATED_SKETCHFAB_MODELS['jeep-renegade-16-mjet'][0].uid).not.toBe(
      CURATED_SKETCHFAB_MODELS['jeep-wrangler-rubicon'][0].uid,
    );
    expect(CURATED_SKETCHFAB_MODELS['audi-a4-b8-tfsi'][0].uid).not.toBe(
      CURATED_SKETCHFAB_MODELS['audi-a3-8p-tdi'][0].uid,
    );
    expect(CURATED_SKETCHFAB_MODELS['bmw-m340i-b58'][0].uid).not.toBe(
      CURATED_SKETCHFAB_MODELS['bmw-320d-f30-b47'][0].uid,
    );
    expect(CURATED_SKETCHFAB_MODELS['lancia-ypsilon-gpl'][0].uid).not.toBe(
      CURATED_SKETCHFAB_MODELS['lancia-delta-integrale'][0].uid,
    );
    expect(CURATED_SKETCHFAB_MODELS['vw-golf-6-16tdi'][0].uid).not.toBe(
      CURATED_SKETCHFAB_MODELS['vw-golf-5-tdi-bkc'][0].uid,
    );
  });

  it('collega ogni veicolo del catalogo a un motore valido nella Wiki e copre tutte le 5 alimentazioni', () => {
    const fuelTypes = new Set<string>();
    for (const car of CATALOG) {
      const eng = ENGINES_BY_ID[car.engineId];
      expect(eng, `Motore mancante ${car.engineId} per ${car.id}`).toBeDefined();
      fuelTypes.add(eng.fuelType);
    }

    expect(fuelTypes.has('Diesel')).toBe(true);
    expect(fuelTypes.has('Benzina')).toBe(true);
    expect(fuelTypes.has('Ibrido')).toBe(true);
    expect(fuelTypes.has('GPL/Metano')).toBe(true);
    expect(fuelTypes.has('Elettrico')).toBe(true);
  });

  it('fornisce scheda enciclopedica completa e 5 controlli pre-acquisto per ogni motore nella Wiki', () => {
    for (const eng of ENGINES_WIKI) {
      const deep = getEngineDeepSpecs(eng);
      expect(deep.distributionType.length).toBeGreaterThan(5);
      expect(deep.oilSpecAndCapacity.length).toBeGreaterThan(5);
      expect(deep.usedCarChecklist).toHaveLength(5);
      expect(deep.rivalsComparison.length).toBeGreaterThan(0);
    }
  });

  it('copre tutte le generazioni di VW Golf (4, 5, 6, 7, 7.5, 8/8.5) e i codici motore reali', () => {
    const ids = new Set(CATALOG.map((c) => c.id));
    for (const golfId of [
      'vw-golf-4-tdi',
      'vw-golf-4-r32',
      'vw-golf-5-tdi-bkc',
      'vw-golf-5-r32',
      'vw-golf-6-16tdi',
      'vw-golf-7-gti',
      'vw-golf-75-gti',
      'vw-golf-75-r',
      'vw-golf-8-gti',
      'vw-golf-8-gte',
    ]) {
      expect(ids.has(golfId)).toBe(true);
    }

    const allCodes = ENGINES_WIKI.flatMap((e) => e.engineCodes.map((c) => c.code));
    expect(ENGINES_WIKI.every((e) => e.engineCodes.length > 0)).toBe(true);
    for (const expected of ['BKC', 'BXE', 'BUB', 'BKD', 'CAYC', 'AGU', 'BAM', '939B1000', 'B47D20', 'M139']) {
      expect(allCodes.some((code) => code.includes(expected))).toBe(true);
    }
  });

  it('consiglia mod su misura e non propone scarico R32 Golf 5 su Tesla EV o Giulia', () => {
    expect(MODS_CATALOG.length).toBeGreaterThanOrEqual(10);
    const golf5 = CATALOG_BY_ID['vw-golf-5-tdi-bkc'];
    const tdi = ENGINES_BY_ID[golf5.engineId];
    const golfRecs = getRecommendedModsForVehicle(golf5, tdi);
    expect(golfRecs.some((r) => r.mod.id === 'scarico-r32-golf5')).toBe(true);

    const tesla = CATALOG_BY_ID['tesla-model3-perf'];
    const evEng = ENGINES_BY_ID[tesla.engineId];
    const evRecs = getRecommendedModsForVehicle(tesla, evEng);
    expect(evRecs.some((r) => r.mod.id === 'scarico-r32-golf5')).toBe(false);
    expect(evRecs.some((r) => r.mod.id === 'mappa-stage1-dsg')).toBe(false);

    const giulia = CATALOG_BY_ID['alfa-giulia-20t'];
    const giuliaEng = ENGINES_BY_ID[giulia.engineId];
    const giuliaRecs = getRecommendedModsForVehicle(giulia, giuliaEng);
    expect(giuliaRecs.some((r) => r.mod.id === 'scarico-r32-golf5')).toBe(false);
  });

  it('calcola in tempo reale CV, Nm e 0-100 km/h al variare delle mod applicate', () => {
    const gti = CATALOG_BY_ID['vw-golf-75-gti'];
    const ea888 = ENGINES_BY_ID[gti.engineId];
    const stock = computeLiveVehicleTelemetry(gti, ea888, DEFAULT_VISUAL_MODS, []);
    const tuned = computeLiveVehicleTelemetry(
      gti,
      ea888,
      { ...DEFAULT_VISUAL_MODS, exhaustStyle: 'quad', lowered: true },
      [MODS_BY_ID['mappa-stage1-dsg']],
    );

    expect(tuned.liveHp).toBeGreaterThan(stock.liveHp);
    expect(tuned.liveNm).toBeGreaterThan(stock.liveNm);
    expect(tuned.live0To100).toBeLessThan(stock.live0To100);
  });

  it('filtra correttamente pack/oggetti Sketchfab permettendo però auto SEAT', () => {
    const filtered = filterSketchfabCarResults([
      { uid: '1', name: '25 Low Poly Car Pack', likeCount: 100 },
      { uid: '2', name: 'Honda Civic EP3 Bucket Seat', likeCount: 50 },
      { uid: '3', name: '2022 SEAT Leon FR', likeCount: 80 },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].uid).toBe('3');
  });

  it('definisce Simulator multipowertrain (Benzina/Diesel/Ibrido/Elettrico) e work order Electude', () => {
    expect(ENGINE_PART_LIST).toHaveLength(8);
    expect(SIMULATOR_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    const evSpecs = getPartSpecsForPowertrain('elettrico');
    const dieselSpecs = getPartSpecsForPowertrain('diesel');
    expect(evSpecs.turbo.name).toContain('Inverter');
    expect(dieselSpecs.coils.name).toContain('Iniettori');
  });

  it('valuta le 7 categorie di manutenzione in base a carburante, cambio e storico tagliandi', () => {
    const golf5 = CATALOG_BY_ID['vw-golf-5-tdi-bkc'];
    const tdi = ENGINES_BY_ID[golf5.engineId];
    const dsgReport = evaluateCategorizedMaintenance(125000, golf5, tdi, 'DSG / Doppia Frizione', []);
    expect(dsgReport.categories).toHaveLength(7);
    expect(dsgReport.allTasks.some((t) => t.task.id === 'dsg-at-gearbox-oil')).toBe(true);

    const evCar = CATALOG_BY_ID['tesla-model3-perf'];
    const evEng = ENGINES_BY_ID[evCar.engineId];
    const evReport = evaluateCategorizedMaintenance(45000, evCar, evEng, 'Elettrico Direct', []);
    expect(evReport.allTasks.some((t) => t.task.id === 'oil-filter-service')).toBe(false);
    expect(evReport.allTasks.some((t) => t.task.id === 'ev-hv-soh-check')).toBe(true);
  });

  it('copre l’intera scala normativa da Euro 0 a Euro 7', () => {
    const ids = EURO_STANDARDS_GUIDE.map((e) => e.id);
    expect(ids).toEqual([
      'EURO_0',
      'EURO_1',
      'EURO_2',
      'EURO_3',
      'EURO_4',
      'EURO_5',
      'EURO_6',
      'EURO_7',
    ]);
  });

  it('genera alert predittivi corretti per chilometraggio su 1.9 TDI e 1.2 PureTech', () => {
    const tdi = ENGINES_BY_ID['vag-19-tdi'];
    const puretech = ENGINES_BY_ID['stellantis-12-puretech'];

    expect(evaluateMaintenanceAlerts(30000, tdi).status).toBe('ok');
    expect(evaluateMaintenanceAlerts(125000, tdi).status).toBe('critical');
    expect(evaluateMaintenanceAlerts(62000, puretech).status).toBe('critical');
  });

  it('include varianti codici potenza storici (TDI 90 CV, 1.3 MJT 75 CV) e nuove famiglie motori', () => {
    const tdi = ENGINES_BY_ID['vag-19-tdi'];
    expect(tdi.engineCodes.some((c) => c.powerHp.includes('90'))).toBe(true);
    expect(tdi.engineCodes.every((c) => Boolean(c.models))).toBe(true);

    const mjet = ENGINES_BY_ID['fiat-13-mjet'];
    expect(mjet.engineCodes.some((c) => c.powerHp.includes('75'))).toBe(true);
    expect(mjet.engineCodes.every((c) => Boolean(c.models))).toBe(true);

    for (const id of [
      'fiat-14-fire-starjet',
      'vag-14-tdi',
      'psa-20-hdi',
      'renault-k4m-f4r',
      'ford-tdci-duratorq',
      'honda-ivtec-idtec',
    ]) {
      expect(ENGINES_BY_ID[id]).toBeDefined();
    }
  });

  it('seleziona architettura cinematica 3D reale distinta per ogni tipologia di motore e pulisce estratti Wiki', () => {
    const golf5 = CATALOG_BY_ID['vw-golf-5-tdi-bkc'];
    const r32 = CATALOG_BY_ID['vw-golf-5-r32'];
    const tesla = CATALOG_BY_ID['tesla-model3-perf'];
    const rs3 = CATALOG_BY_ID['audi-rs3-daza'];
    const subaru = CATALOG_BY_ID['subaru-impreza-sti'];
    const ferrari = CATALOG_BY_ID['ferrari-458-italia'];

    expect(getKinematicEngineConfig(golf5, ENGINES_BY_ID[golf5.engineId], 'diesel').kind).toBe('inline_4');
    expect(getKinematicEngineConfig(r32, ENGINES_BY_ID[r32.engineId], 'benzina').kind).toBe('vr6_v6');
    expect(getKinematicEngineConfig(tesla, ENGINES_BY_ID[tesla.engineId], 'elettrico').kind).toBe('ev_pmsm');
    expect(getKinematicEngineConfig(rs3, ENGINES_BY_ID[rs3.engineId], 'benzina').kind).toBe('inline_5');
    expect(getKinematicEngineConfig(subaru, ENGINES_BY_ID[subaru.engineId], 'benzina').kind).toBe('boxer');
    expect(getKinematicEngineConfig(ferrari, ENGINES_BY_ID[ferrari.engineId], 'benzina').kind).toBe('v8_v10_v12');

    expect(cleanWikiExtract('Testo\n== Contesto ==\nAltro')).toBe('Testo Contesto: Altro');
  });

  it('AI Gatekeeper approva auto/veicoli e blocca selfie e gatti', () => {
    expect(evaluateVehicleDetections([{ class: 'car', score: 0.91 }]).approved).toBe(true);
    expect(evaluateVehicleDetections([{ class: 'person', score: 0.95 }]).approved).toBe(false);
    expect(evaluateVehicleDetections([{ class: 'cat', score: 0.88 }]).approved).toBe(false);
  });
});
