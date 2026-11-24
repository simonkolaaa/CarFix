import type { EngineWiki } from '../core/types';

export interface EngineDeepSpecs {
  distributionType: string;
  oilSpecAndCapacity: string;
  realFuelConsumption: string;
  injectionAndTurbo: string;
  typicalServiceCostEur: string;
  typicalTimingCostEur: string;
  usedCarChecklist: string[];
  rivalsComparison: string[];
}

function estimatePeakHp(engine: EngineWiki): number {
  let maxHp = 130;
  for (const variant of engine.engineCodes) {
    const matches = variant.powerHp.match(/\d+/g);
    if (matches) {
      for (const m of matches) {
        const val = Number(m);
        if (val > maxHp && val < 2000) maxHp = val;
      }
    }
  }
  return maxHp;
}

export function getEngineDeepSpecs(engine: EngineWiki): EngineDeepSpecs {
  const peakHp = estimatePeakHp(engine);
  if (engine.fuelType === 'Elettrico') {
    return {
      distributionType: 'Nessuna cinghia né catena (Riduttore monomarcia a ingranaggi in bagno d’olio)',
      oilSpecAndCapacity: '0.9 – 1.8 L olio specifico riduttore/drive unit (cambio ogni 100.000 km)',
      realFuelConsumption: '14.5 – 19.5 kWh / 100 km reali (330 – 520 km autonomia mista)',
      injectionAndTurbo: 'Motore sincrono PMSM + Inverter SiC 400V / 800V con frenata rigenerativa',
      typicalServiceCostEur: '80 – 150 € (filtro abitacolo + controllo freni/glicole + check 12V)',
      typicalTimingCostEur: '0 € (nessuna distribuzione da fare!)',
      usedCarChecklist: [
        'Richiedi certificato SOH (State of Health) batteria HV via OBD (idealmente > 88–90%).',
        'Controlla batteria ausiliaria 12V: se è scarica blocca la chiusura dei contattori HV!',
        'Verifica dischi freno: spesso si arrugginiscono per il poco uso dovuto alla rigenerazione.',
        'Testa ricarica sia in AC (11 kW trifase) sia in DC Fast per escludere guasti a OBC o pompa di calore.',
        'Controlla braccetti e silent-block anteriori: la coppia istantanea EV li sollecita di più.',
      ],
      rivalsComparison: [
        'Vs Termico turbo: zero tagliandi olio/distribuzione e costi kWh ridotti a casa.',
        'Vs Ibrido Full: scatto 0–100 fulmineo ma richiede pianificazione su lunghi viaggi autostradali.',
      ],
    };
  }

  if (engine.fuelType === 'Diesel') {
    const isPde = engine.id === 'vag-19-tdi';
    const isChainBmw = engine.id === 'bmw-n47' || engine.id === 'bmw-m57' || engine.id === 'bmw-m54-b47';
    return {
      distributionType: isPde
        ? 'Cinghia dentata a secco + pompa acqua esterna (ogni 120.000 km / 6 anni)'
        : isChainBmw
          ? 'Catena di distribuzione (lato cambio su N47/B47 — verifica rumore a freddo!)'
          : 'Cinghia / Catena rinforzata in base all’anno (controllare tenditore idraulico)',
      oilSpecAndCapacity: isPde
        ? '5W-40 VW 505.01 (obbligatorio su iniettore-pompa PDE) · 4.3 L'
        : engine.group === 'STELLANTIS'
          ? '0W-30 / 5W-30 ACEA C2/C3 Low SAPS (protegge DPF) · 3.8 – 4.8 L'
          : '5W-30 LongLife ACEA C3 / VW 507.00 · 4.5 – 6.5 L',
      realFuelConsumption: peakHp > 200
        ? '13 – 16.5 km/l reali (spinge forte anche a pieno carico)'
        : '18.5 – 23.5 km/l reali (ideale sopra 20.000 km/anno)',
      injectionAndTurbo: isPde
        ? 'Iniettore-Pompa PDE ad alta pressione (2.050 bar) + Turbo VNT Garrett/KKK'
        : 'Common Rail 1.800–2.500 bar + Turbocompressore a geometria variabile (VNT)',
      typicalServiceCostEur: '150 – 260 € (olio sintetico Low-SAPS + 4 filtri ogni 15.000 km)',
      typicalTimingCostEur: isChainBmw ? '900 – 1.850 € (catena lato volano)' : '450 – 750 € (kit completo)',
      usedCarChecklist: [
        `Controlla sigla esatta sul libretto (voce P.5): evita codici critici e preferisci i consigliati del ${engine.code}.`,
        'Avvia il motore rigorosamente a freddo: ascolta eventuali tintinnii di catena/punterie nei primi 3 secondi.',
        'Verifica rigenerazioni DPF/FAP e controllo livello olio (se sale sopra MAX c’è gasolio diluito da rigenerazioni fallite!).',
        'Schiaccia la frizione a metà corsa e spegni senza frizione: colpi secchi indicano volano bimassa usurato.',
        'Collega diagnosi OBD per leggere correzione iniettori al minimo (idealmente entro ±1.0 mg/str).',
      ],
      rivalsComparison: [
        'Vs Benzina equivalente: +30% coppia ai bassi e consumi imbattibili in extraurbano/autostrada.',
        'Sconsigliato se fai solo tragitti cittadini da 3–5 km (rischio intasamento EGR/DPF).',
      ],
    };
  }

  if (engine.fuelType === 'Ibrido') {
    return {
      distributionType: 'Catena di distribuzione silenziosa (su Toyota e-CVT eterna) o cinghia su sistemi PHEV',
      oilSpecAndCapacity: '0W-20 / 0W-16 sintetico a bassissima viscosità API SP / ILSAC GF-6 · 4.2 L',
      realFuelConsumption: '20 – 27 km/l reali in città ed extraurbano (ottima in ZTL)',
      injectionAndTurbo: 'Ciclo Atkinson/Miller + Motore elettrico di trazione (Zero frizione su e-CVT!)',
      typicalServiceCostEur: '160 – 250 € (incluso controllo griglia raffreddamento batteria HV)',
      typicalTimingCostEur: 'Virtualmente a vita sulle Full Hybrid a catena ben lubrificate',
      usedCarChecklist: [
        'Verifica tramite OBD il bilanciamento dei blocchi batteria ibrida (delta tensione < 0.2 V).',
        'Controlla che la ventolina sotto il sedile posteriore non sia ostruita da polvere o peli di animali.',
        'Accertati che tutti i tagliandi siano stati fatti con olio 0W-20 originale (prolunga garanzia batteria fino a 10-15 anni).',
        'Verifica stato dischi freno posteriori spesso ossidati per l’uso prevalente della frenata rigenerativa.',
        'Su versioni Plug-In (GTE/e-Hybrid) verifica storico olio cambio DSG a bagno d’olio.',
      ],
      rivalsComparison: [
        'Vs Diesel: zero problemi FAP/AdBlue in città, manutenzione freni dimezzata.',
        'Vs Elettrico puro: autonomia illimitata nei viaggi lunghi senza soste alle colonnine.',
      ],
    };
  }

  if (engine.fuelType === 'GPL/Metano') {
    return {
      distributionType: 'Cinghia a secco economica e facile da sostituire (ogni 90.000–120.000 km)',
      oilSpecAndCapacity: '5W-40 / 5W-30 specifica anti-usura per doppia alimentazione · 2.8 – 4.0 L',
      realFuelConsumption: '12 – 15 km/l a GPL (~0,70 €/L = costo al km imbattibile!) · 22–28 km/kg a Metano',
      injectionAndTurbo: 'Aspirato o Piccolo Turbo TCe/TGI con iniettori gas dedicati + riduttore pressione',
      typicalServiceCostEur: '120 – 190 € + 35 € filtro GPL fase gassosa/liquida',
      typicalTimingCostEur: '320 – 520 € (tra i più economici sul mercato)',
      usedCarChecklist: [
        'CONTROLLO TASSATIVO: verifica data scadenza decennale bombole GPL (o quadriennale revisione CNG Metano)!',
        'Passa da benzina a GPL al minimo a caldo: non devono esserci strattoni o spegnimenti.',
        'Ascolta gli iniettori GPL (un leggero ticchettio è normale, irregolarità indica sporco da GPL economico).',
        'Controlla che le candele siano cambiate ogni 30.000 km per prevenire mancate accensioni.',
        'Sui vecchi motori senza punterie idrauliche verifica storico registrazione gioco valvole.',
      ],
      rivalsComparison: [
        'Vs Diesel Euro 6: costa ancora meno al km senza limiti ZTL, FAP o AdBlue.',
        'Vs Ibrido: prestazioni semplici e costi ricambi rasoterra.',
      ],
    };
  }

  // Benzina (Aspirati & Turbo)
  const isWetBeltPuretech = engine.id === 'stellantis-12-puretech';
  return {
    distributionType: isWetBeltPuretech
      ? 'ATTENZIONE: Cinghia a bagno d’olio (controllare spessore a ogni tagliando con calibro!)'
      : 'Cinghia dentata a secco o Catena di distribuzione (verifica tenditore su TSI Gen1/Gen2)',
    oilSpecAndCapacity: isWetBeltPuretech
      ? '0W-20 / 0W-30 PSA B71 2312/2010 tassativo ogni 10.000 km · 3.5 L'
      : '5W-40 / 0W-40 sintetico di alta qualità (es. Mobil1/Motul) se uso sportivo · 4.0 – 5.7 L',
    realFuelConsumption: peakHp >= 230
      ? '8.5 – 12.5 km/l reali (dipende dal piede destro!)'
      : '13.5 – 17 km/l reali in guida mista',
    injectionAndTurbo: peakHp >= 140
      ? 'Iniezione Diretta (o Doppia MPI+GDI su EA888 Gen3) + Turbo + Wastegate elettronica'
      : 'Iniezione elettronica multipoint / diretta ad alta affidabilità',
    typicalServiceCostEur: '140 – 240 € (olio premium + candele ogni 45–60.000 km)',
    typicalTimingCostEur: isWetBeltPuretech ? '650 – 1.100 € (con pulizia succhieruola)' : '450 – 850 €',
    usedCarChecklist: [
      'Avviamento a freddo a cofano aperto: zero sferragliamenti metallici di catena o variatore di fase.',
      'Controllo visivo vaso espansione e tappo olio (niente "maionese" emulsione acqua/olio).',
      isWetBeltPuretech
        ? 'Su 1.2 PureTech guarda dentro il tappo olio con la torcia: se la cinghia è sfilacciata o screpolata va fermata subito!'
        : 'Sui turbo iniezione diretta chiedi se è stata pulita aspirazione/valvole e verificato eventuale consumo olio.',
      'Prova affondo in 3ª marcia da 2.500 a 6.000 giri: erogazione fluida senza tagli né strappi da bobine.',
      'Verifica fatture tagliandi ravvicinati (10–15.000 km, non ogni 30.000 km!).',
    ],
    rivalsComparison: [
      'Vs Diesel: zero AdBlue/DPF, sound autentico e scalda subito d’inverno nei tragitti brevi.',
      'Ampio margine di elaborazione Stage 1/2 sulle versioni sovralimentate.',
    ],
  };
}
