import type { FuelType } from '../core/types';

export type PowertrainLayout = 'benzina' | 'diesel' | 'ibrido' | 'elettrico';

export function getPowertrainLayoutFromFuel(fuel: FuelType): PowertrainLayout {
  if (fuel === 'Diesel') return 'diesel';
  if (fuel === 'Ibrido') return 'ibrido';
  if (fuel === 'Elettrico') return 'elettrico';
  return 'benzina';
}

export type EnginePartId =
  | 'block'
  | 'timing'
  | 'turbo'
  | 'intake_maf'
  | 'intercooler'
  | 'coils'
  | 'egr_downpipe'
  | 'battery';

export interface EnginePartSpec {
  id: EnginePartId;
  name: string;
  shortLabel: string;
  system: string;
  description: string;
  healthyVoltage: string;
  healthyOhms: string;
  faultDtc: string;
  faultTitle: string;
  faultVoltage: string;
  faultOhms: string;
  oemRepairAction: string;
  upgradeName: string;
  upgradeSummary: string;
  hpDelta: number;
  nmDelta: number;
  boostDeltaBar: number;
  iatDeltaC: number;
}

export interface SimulatorScenario {
  id: string;
  badge: string;
  title: string;
  vehicleName: string;
  powertrain: PowertrainLayout;
  baseHp: number;
  baseNm: number;
  customerComplaint: string;
  hint: string;
  initialFaults: Partial<Record<EnginePartId, boolean>>;
}

export const ENGINE_PARTS_SPECS: Record<EnginePartId, EnginePartSpec> = {
  block: {
    id: 'block',
    name: 'Monoblocco & Testata 4 Cilindri',
    shortLabel: 'Monoblocco',
    system: 'Meccanica Base',
    description:
      'Basamento in ghisa/alluminio con 4 cilindri, albero motore, coppa olio e coperchio punterie.',
    healthyVoltage: '14.2 V (massa motore OK)',
    healthyOhms: '0.2 Ω (continuità massa)',
    faultDtc: 'P0300',
    faultTitle: 'Perdita compressione / Anomalia meccanica base',
    faultVoltage: '12.4 V',
    faultOhms: '0.4 Ω',
    oemRepairAction: 'Controllo compressione & guarnizione testata',
    upgradeName: 'Pistoni & Bielle Forgiate H-Beam',
    upgradeSummary: 'Rinforza il manovellismo per reggere fino a 2.2 bar di boost in sicurezza.',
    hpDelta: 15,
    nmDelta: 25,
    boostDeltaBar: 0.15,
    iatDeltaC: 0,
  },
  timing: {
    id: 'timing',
    name: 'Distribuzione (Cinghia / Catena & Pompa Olio)',
    shortLabel: 'Distribuzione',
    system: 'Fasatura & Lubrificazione',
    description:
      'Sincronizza albero motore e alberi a camme tramite pulegge dentate e tenditore; nei motori EB2 comanda anche l’immersione in olio.',
    healthyVoltage: '5.0 V (sensore fase Hall)',
    healthyOhms: '480 Ω (attuatore VVT)',
    faultDtc: 'P0524 / P0016',
    faultTitle: 'Cinghia sfaldata / Pressione olio insufficiente o fuori fase',
    faultVoltage: '0.8 V (segnale fuori soglia)',
    faultOhms: '∞ Ω (circuito / sensore bloccato)',
    oemRepairAction: 'Sostituzione Kit Distribuzione + Pulizia Succhieruola',
    upgradeName: 'Kit Distribuzione Kevlar + Tenditore Rinforzato',
    upgradeSummary: 'Elimina lo slittamento ad alti giri e stabilizza la pressione olio a caldo.',
    hpDelta: 4,
    nmDelta: 5,
    boostDeltaBar: 0,
    iatDeltaC: 0,
  },
  turbo: {
    id: 'turbo',
    name: 'Turbocompressore (VNT / WasteGate)',
    shortLabel: 'Turbina',
    system: 'Sovralimentazione',
    description:
      'Sfrutta l’energia dei gas di scarico per comprimere l’aria aspirata tramite girante fredda in alluminio e chiocciola calda.',
    healthyVoltage: '12.1 V (attuatore N75 / VNT)',
    healthyOhms: '16.5 Ω (elettrovalvola comando)',
    faultDtc: 'P0234 / P0299',
    faultTitle: 'Geometria Variabile (VNT) bloccata — Overboost Recovery',
    faultVoltage: '3.2 V (bloccata)',
    faultOhms: '94.0 Ω (avvolgimento ossidato)',
    oemRepairAction: 'Pulizia palette VNT + Sostituzione valvola N75',
    upgradeName: 'Turbina Maggiorata Billet (GT1749VB / IS38)',
    upgradeSummary: 'Girante fresata dal pieno + mappa Stage 2: spinta violenta fino a limitatore!',
    hpDelta: 58,
    nmDelta: 95,
    boostDeltaBar: 0.55,
    iatDeltaC: 6,
  },
  intake_maf: {
    id: 'intake_maf',
    name: 'Aspirazione & Debimetro (MAF)',
    shortLabel: 'Aspirazione / MAF',
    system: 'Aria & Sensori',
    description:
      'Convoglia aria filtrata verso il compressore e misura esattamente i grammi/secondo di massa aria aspirata.',
    healthyVoltage: '1.25 – 4.40 V (segnale MAF)',
    healthyOhms: '2.4 kΩ (sensore temp. aria)',
    faultDtc: 'P0101',
    faultTitle: 'Segnale Debimetro (MAF) starato / sporco d’olio',
    faultVoltage: '0.35 V (piatto / contaminato)',
    faultOhms: '98.0 kΩ (filo caldo incrostato)',
    oemRepairAction: 'Pulizia o Sostituzione Debimetro Bosch OEM',
    upgradeName: 'Cold Air Intake Conico + Tubo Siliconico',
    upgradeSummary: 'Riduce perdite di carico in aspirazione e sblocca il suono turbo ("stututu").',
    hpDelta: 12,
    nmDelta: 18,
    boostDeltaBar: 0.05,
    iatDeltaC: -4,
  },
  intercooler: {
    id: 'intercooler',
    name: 'Intercooler Aria-Aria + Manicotti',
    shortLabel: 'Intercooler',
    system: 'Raffreddamento Carica',
    description:
      'Abbassa la temperatura dell’aria compressa dalla turbina rendendola più densa di ossigeno prima che entri nei cilindri.',
    healthyVoltage: '2.5 V (sensore MAP integrato)',
    healthyOhms: '1.8 kΩ',
    faultDtc: 'P0299',
    faultTitle: 'Manicotto fessurato / Perdita pressione boost',
    faultVoltage: '0.9 V (pressione insufficiente)',
    faultOhms: '1.8 kΩ',
    oemRepairAction: 'Sostituzione manicotto intercooler & fascette',
    upgradeName: 'Intercooler Frontale Maggiorato Alluminio (S3/Forge)',
    upgradeSummary: 'Crollo drastico della temperatura aria aspirata (-22°C IAT) sotto carico.',
    hpDelta: 16,
    nmDelta: 24,
    boostDeltaBar: 0.06,
    iatDeltaC: -22,
  },
  coils: {
    id: 'coils',
    name: 'Bobine Accensione & Iniezione Diretta',
    shortLabel: 'Bobine / Iniettori',
    system: 'Accensione & Carburante',
    description:
      '4 bobine individuali ad alta tensione (o iniettori ad alta pressione sui diesel) sopra i rispettivi cilindri.',
    healthyVoltage: '12.0 V + impulso ECU 5 V',
    healthyOhms: '1.2 Ω (primario bobina)',
    faultDtc: 'P0302',
    faultTitle: 'Mancata accensione Cilindro #2 (Misfire a 3 cilindri)',
    faultVoltage: '12.0 V (nessun impulso secondario)',
    faultOhms: '∞ Ω (circuito aperto)',
    oemRepairAction: 'Sostituzione Bobina Cilindro #2 + Candele',
    upgradeName: 'Bobine Red-Top Racing + Candele Iridium Fredde',
    upgradeSummary: 'Scintilla ad alta energia garantita anche a oltre 1.8 bar di sovralimentazione.',
    hpDelta: 8,
    nmDelta: 12,
    boostDeltaBar: 0,
    iatDeltaC: 0,
  },
  egr_downpipe: {
    id: 'egr_downpipe',
    name: 'Collettore Scarico, EGR & Downpipe',
    shortLabel: 'Scarico / EGR',
    system: 'Gas di Scarico',
    description:
      'Raccoglie i gas caldi verso il catalizzatore/DPF; la valvola EGR ricircola parte dei gas per contenere gli NOx.',
    healthyVoltage: '5.0 V (potenziometro EGR)',
    healthyOhms: '8.5 Ω (solenoide EGR)',
    faultDtc: 'P0401',
    faultTitle: 'Valvola EGR bloccata da fuliggine',
    faultVoltage: '4.9 V (bloccata chiusa/aperta)',
    faultOhms: '45.0 Ω',
    oemRepairAction: 'Pulizia / Sostituzione Valvola EGR',
    upgradeName: 'Downpipe Sportivo Inox 200 Celle + Scarico R32',
    upgradeSummary: 'Abbassa contropressione e temperature allo scarico liberando sound e coppia.',
    hpDelta: 24,
    nmDelta: 38,
    boostDeltaBar: 0.1,
    iatDeltaC: 0,
  },
  battery: {
    id: 'battery',
    name: 'Batteria 12V AGM & Cablaggio ECU',
    shortLabel: 'Batteria 12V',
    system: 'Alimentazione Elettrica',
    description:
      'Fornisce tensione stabile a motorino d’avviamento, centralina motore, relè e sensori di bordo.',
    healthyVoltage: '12.7 V (spenta) / 14.3 V (accesa)',
    healthyOhms: '0.01 Ω (resistenza interna bassa)',
    faultDtc: 'U0100 / P0562',
    faultTitle: 'Tensione batteria critica (10.8 V) — Spie casuali CAN-Bus',
    faultVoltage: '10.8 V (cella in solfatazione)',
    faultOhms: '0.18 Ω (alta resistenza interna)',
    oemRepairAction: 'Sostituzione Batteria 12V AGM + Reset Relè',
    upgradeName: 'Batteria Leggera LiFePO4 Motorsport (-12 kg)',
    upgradeSummary: 'Tensione granitica a 13.4 V e 12 kg in meno sull’avantreno.',
    hpDelta: 2,
    nmDelta: 0,
    boostDeltaBar: 0,
    iatDeltaC: 0,
  },
};

export const ENGINE_PART_LIST: EnginePartSpec[] = Object.values(ENGINE_PARTS_SPECS);

export function getPartSpecsForPowertrain(
  layout: PowertrainLayout,
): Record<EnginePartId, EnginePartSpec> {
  if (layout === 'elettrico') {
    return {
      ...ENGINE_PARTS_SPECS,
      block: {
        ...ENGINE_PARTS_SPECS.block,
        name: 'Drive Unit / Motore Elettrico Sincrono (PMSM)',
        shortLabel: 'Motore EV',
        system: 'Trazione Elettrica',
        description:
          'Motore sincrono a magneti permanenti raffreddato a glicole: eroga coppia istantanea fino a 14.000 giri.',
        healthyVoltage: '398 V AC trifase',
        healthyOhms: '0.08 Ω (avvolgimenti statore)',
        faultDtc: 'P0A7A',
        faultTitle: 'Squilibrio isolamento statore / Surriscaldamento Drive Unit',
        oemRepairAction: 'Lavaggio circuito raffreddamento + verifica isolamento HV',
        upgradeName: 'Mappa Coppia Inverter Performance + Cuscinetti Ceramici',
        hpDelta: 45,
        nmDelta: 85,
        boostDeltaBar: 0,
        iatDeltaC: 0,
      },
      timing: {
        ...ENGINE_PARTS_SPECS.timing,
        name: 'Riduttore Monomarcia & Differenziale EV',
        shortLabel: 'Riduttore EV',
        system: 'Trasmissione Diretta',
        description: 'Ingranaggeria a rapporto fisso in bagno d’olio (niente cinghie né frizioni!).',
        healthyVoltage: '5.0 V (resolver angolare)',
        healthyOhms: '24 Ω',
        faultDtc: 'P0700',
        faultTitle: 'Sensore resolver fuori calibrazione / Olio riduttore esausto',
        oemRepairAction: 'Calibrazione Resolver + Cambio Olio Riduttore',
        upgradeName: 'Differenziale Autobloccante Torsen EV',
        hpDelta: 0,
        nmDelta: 20,
      },
      turbo: {
        ...ENGINE_PARTS_SPECS.turbo,
        name: 'Inverter SiC Alta Tensione (400/800V)',
        shortLabel: 'Inverter SiC',
        system: 'Elettronica di Potenza',
        description: 'Converte la corrente continua della batteria HV in trifase per il motore elettrico.',
        healthyVoltage: '400 V DC Bus',
        healthyOhms: '> 500 MΩ (isolamento)',
        faultDtc: 'P0A94',
        faultTitle: 'Derating termico / Modulo IGBT-SiC fuori soglia',
        oemRepairAction: 'Spurgo circuito inverter & sostituzione sensore NTC',
        upgradeName: 'Modulo SiC Unlock Track Mode',
        hpDelta: 55,
        nmDelta: 90,
        boostDeltaBar: 0,
      },
      intake_maf: {
        ...ENGINE_PARTS_SPECS.intake_maf,
        name: 'On-Board Charger (OBC 11/22 kW)',
        shortLabel: 'OBC Charger',
        system: 'Ricarica AC',
        description: 'Raddrizzatore integrato che gestisce la ricarica dalle colonnine in corrente alternata.',
        healthyVoltage: '230 V / 400 V AC in ingresso',
        healthyOhms: '680 Ω (Resistenza PP Tipo 2)',
        faultDtc: 'U029A',
        faultTitle: 'Fase OBC bloccata — Ricarica lenta a 3.7 kW',
        oemRepairAction: 'Sostituzione modulo filtro/relè OBC',
        upgradeName: 'Modulo Upgrade Ricarica Trifase 22 kW',
        hpDelta: 0,
        nmDelta: 0,
      },
      intercooler: {
        ...ENGINE_PARTS_SPECS.intercooler,
        name: 'Pompa di Calore & Scambiatore Batteria HV',
        shortLabel: 'Pompa Calore',
        system: 'Gestione Termica HV',
        description: 'Mantiene pacco batteria e inverter nella finestra ottimale 20–35°C.',
        upgradeName: 'Valvola Octovalve ad Alta Portata + Glicole Low-Conductivity',
        hpDelta: 5,
        nmDelta: 0,
        iatDeltaC: -18,
      },
      coils: {
        ...ENGINE_PARTS_SPECS.coils,
        name: 'Cablaggio Busbar HV Arancione & Sezionatore',
        shortLabel: 'Busbar HV',
        system: 'Alta Tensione',
        description: 'Linee corazzate arancioni 400V con circuito di sicurezza Interlock Loop (HVIL).',
        healthyVoltage: '12.0 V loop HVIL chiuso',
        healthyOhms: '< 2.0 Ω (continuità HVIL)',
        faultDtc: 'P0A0D',
        faultTitle: 'Circuito Interlock Alta Tensione (HVIL) aperto',
        oemRepairAction: 'Inserimento corretto Service Plug HV + reset BMS',
        upgradeName: 'Busbar Rame Rivestito Argento Bassa Resistenza',
        hpDelta: 6,
        nmDelta: 10,
      },
      egr_downpipe: {
        ...ENGINE_PARTS_SPECS.egr_downpipe,
        name: 'Convertitore DC-DC (400V → 12V)',
        shortLabel: 'DC-DC Converter',
        system: 'Alimentazione Bordo',
        description: 'Sostituisce l’alternatore tradizionale ricaricando la batteria servizi 12V dalla batteria HV.',
        healthyVoltage: '14.4 V DC uscita servizi',
        faultDtc: 'P0A09',
        faultTitle: 'Convertitore DC-DC in protezione — Batteria 12V non ricarica',
        oemRepairAction: 'Sostituzione fusibile pirotecnico / DC-DC',
        upgradeName: 'DC-DC Raffreddato ad Alta Efficienza',
        hpDelta: 0,
        nmDelta: 0,
      },
      battery: {
        ...ENGINE_PARTS_SPECS.battery,
        name: 'Batteria Ausiliaria 12V & Centralina BMS',
        shortLabel: 'Batteria 12V / BMS',
        system: 'Logica & Risveglio Contattori',
        description: 'Senza 12V sana i contattori HV non chiudono e l’EV resta immobile anche con 100% di carica!',
      },
    };
  }

  if (layout === 'diesel') {
    return {
      ...ENGINE_PARTS_SPECS,
      coils: {
        ...ENGINE_PARTS_SPECS.coils,
        name: 'Iniettori Common Rail / PDE + Candelette Preriscaldo',
        shortLabel: 'Iniettori / Candelette',
        system: 'Iniezione Alta Pressione',
        description:
          'Iniettori ad alta pressione (1.600–2.500 bar) e candelette per avviamenti a freddo e rigenerazione.',
        healthyVoltage: '12 V (candelette) / 70 V picco piezo',
        healthyOhms: '0.8 Ω (candeletta sana)',
        faultDtc: 'P0202 / P0672',
        faultTitle: 'Iniettore Cilindro #2 fuori correzione / Candeletta bruciata',
        oemRepairAction: 'Revisione Iniettore / Cablaggio Testata PDE + Candeletta',
        upgradeName: 'Punte Polverizzatori Maggiorate +80% (+Stage 2)',
        hpDelta: 22,
        nmDelta: 48,
      },
      egr_downpipe: {
        ...ENGINE_PARTS_SPECS.egr_downpipe,
        name: 'Valvola EGR, Scambiatore & Filtro Antiparticolato DPF',
        shortLabel: 'EGR / DPF',
        system: 'Abbattimento NOx / PM',
        description: 'Gestisce ricircolo gas e cattura particolato PM10 sui motori Euro 4/5/6 diesel.',
        faultDtc: 'P0401 / P2463',
        faultTitle: 'EGR incrostata / Intasamento DPF critico',
      },
    };
  }

  if (layout === 'ibrido') {
    return {
      ...ENGINE_PARTS_SPECS,
      turbo: {
        ...ENGINE_PARTS_SPECS.turbo,
        name: 'Inverter PCU Ibrido + Modulo Sovralimentazione',
        shortLabel: 'PCU Ibrida / HV',
        system: 'Sistema Ibrido Combinato',
        description: 'Coordina motore termico a ciclo Atkinson/Miller e motore elettrico di trazione.',
        hpDelta: 25,
        nmDelta: 45,
      },
    };
  }

  return ENGINE_PARTS_SPECS;
}

export const SIMULATOR_SCENARIOS: SimulatorScenario[] = [
  {
    id: 'free-dyno',
    badge: 'MODSNATION LAB',
    title: 'Banco Prova & Auto Catalogo (Libero)',
    vehicleName: 'VW Golf V GTI 2.0 TFSI',
    powertrain: 'benzina',
    baseHp: 200,
    baseNm: 280,
    customerComplaint:
      'Scegli qualsiasi auto dal menu qui sotto (Benzina, Diesel, Ibrida o Elettrica) per vedere il vano motore cambiare architettura reale, colore ed esploso!',
    hint: 'Passa dalla Vista Electude dall’alto alla Vista 3D o accendi il Multimetro per vedere i puntali sul componente.',
    initialFaults: {},
  },
  {
    id: 'electude-bkc-turbo',
    badge: 'ELECTUDE WORK ORDER #01',
    title: 'Golf V 1.9 TDI BKC — Recovery Diesel',
    vehicleName: 'Volkswagen Golf V 1.9 TDI (BKC · Diesel)',
    powertrain: 'diesel',
    baseHp: 105,
    baseNm: 250,
    customerComplaint:
      '"In autostrada in salita supero i 3.000 giri e l’auto taglia potenza di colpo finché non spengo e riaccendo il quadro."',
    hint: 'Usa lo Scanner OBD-II e il Multimetro su Turbina e Aspirazione/MAF per scovare i due guasti e ripararli!',
    initialFaults: { turbo: true, intake_maf: true },
  },
  {
    id: 'electude-puretech-oil',
    badge: 'ELECTUDE WORK ORDER #02',
    title: 'Peugeot 208 1.2 PureTech — Spia Olio',
    vehicleName: 'Peugeot 208 1.2 PureTech (EB2 · Benzina)',
    powertrain: 'benzina',
    baseHp: 101,
    baseNm: 205,
    customerComplaint:
      '"Al minimo al semaforo si accende la spia rossa della pressione olio e il pedale freno è diventato duro."',
    hint: 'Ispeziona la Distribuzione a bagno d’olio e controlla i valori del sensore fase con il Multimetro.',
    initialFaults: { timing: true },
  },
  {
    id: 'electude-gti-misfire',
    badge: 'ELECTUDE WORK ORDER #03',
    title: 'Golf GTI 2.0 TSI — Motore a 3 Cilindri',
    vehicleName: 'Volkswagen Golf GTI 2.0 TFSI (BWA · Benzina)',
    powertrain: 'benzina',
    baseHp: 200,
    baseNm: 280,
    customerComplaint:
      '"Il motore traballa forte al minimo e la spia gialla lampeggia appena sfioro l’acceleratore."',
    hint: 'Leggi il codice P030x sullo Scanner OBD-II, poi misura la resistenza in Ohm sulle Bobine!',
    initialFaults: { coils: true },
  },
  {
    id: 'electude-ev-hv',
    badge: 'ELECTUDE WORK ORDER #04',
    title: 'Tesla Model 3 / VW ID.3 — Blocco HVIL EV',
    vehicleName: 'Piattaforma Elettrica 400V (Drive Unit + Inverter SiC)',
    powertrain: 'elettrico',
    baseHp: 283,
    baseNm: 420,
    customerComplaint:
      '"Dopo aver chiuso il cofano appare l’errore Alta Tensione (HVIL) e il cambio resta bloccato in P."',
    hint: 'Controlla con il Multimetro il cablaggio arancione Busbar HV (pin 6) e ripristina l’interlock!',
    initialFaults: { coils: true },
  },
];
