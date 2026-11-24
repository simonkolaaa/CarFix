import type { CategoryMaintenanceTask, MaintenanceCategory } from '../core/types';

export const MAINTENANCE_CATEGORIES: Array<{
  id: MaintenanceCategory;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: 'engine_timing',
    label: 'Motore, Olio & Distribuzione',
    shortLabel: 'Motore',
    description: 'Lubrificazione, filtri carburante/aria, cinghia o catena e candele/candelette.',
  },
  {
    id: 'transmission',
    label: 'Cambio, Frizione & Differenziale',
    shortLabel: 'Trasmissione',
    description: 'Olio cambio manuale/DSG, volano bimassa, Haldex e differenziali.',
  },
  {
    id: 'brakes',
    label: 'Impianto Frenante & Sicurezza',
    shortLabel: 'Freni',
    description: 'Pastiglie, dischi, spurgo olio DOT 4 e tubazioni freno.',
  },
  {
    id: 'suspension_tires',
    label: 'Assetto, Sterzo & Pneumatici',
    shortLabel: 'Assetto & Gomme',
    description: 'Inversione gomme, convergenza, braccetti, silent-block e ammortizzatori.',
  },
  {
    id: 'cooling_ac',
    label: 'Raffreddamento & Climatizzazione',
    shortLabel: 'Clima & Acqua',
    description: 'Liquido radiatore G12/G13, filtro abitacolo, termostato e ricarica clima.',
  },
  {
    id: 'electrical',
    label: 'Elettrico, Batteria & Sensori',
    shortLabel: 'Elettrico',
    description: 'Batteria 12V/AGM, alternatore, sonde Lambda/MAF e Check Batteria HV.',
  },
  {
    id: 'legal_body',
    label: 'Revisione, Luci & Carrozzeria',
    shortLabel: 'Revisione & Varie',
    description: 'Scadenze revisione, spazzole tergi, scoli acqua e lucidatura fari.',
  },
];

export const BASE_MAINTENANCE_TASKS: CategoryMaintenanceTask[] = [
  // ---- 1. MOTORE & DISTRIBUZIONE ----
  {
    id: 'oil-filter-service',
    category: 'engine_timing',
    title: 'Tagliando Olio Motore + Filtro Olio',
    intervalKm: 15000,
    intervalMonths: 12,
    severity: 'critical',
    whatItIs:
      'Sostituzione olio sintetico specifico (es. VW 504/507 o 505.01 su PDE) e cartuccia filtrante. I tagliandi "LongLife" da 30.000 km spesso rovinano turbine e bronzine.',
    symptoms: 'Rumorosità punterie a freddo, olio nero denso o consumo anomalo tra un rabbocco e l’altro.',
    ifIgnored: 'Usura accelerata di turbocompressore, bronzine di biella e albero a camme.',
    estimatedCostEur: '130 – 240 €',
    preventionTip: 'Anticipa sempre a 12.000–15.000 km o 1 volta l’anno, specie se fai tragitti brevi.',
    appliesToFuels: ['Diesel', 'Benzina', 'Ibrido', 'GPL/Metano'],
  },
  {
    id: 'air-fuel-filter',
    category: 'engine_timing',
    title: 'Filtro Aria Motore + Filtro Carburante (Gasolio/GPL)',
    intervalKm: 30000,
    severity: 'warning',
    whatItIs:
      'Mantiene pulito il flusso d’aria verso debimetro/turbina e ferma acqua e impurità del gasolio o del GPL prima degli iniettori.',
    symptoms: 'Vuoti in accelerazione, fumo nero dai TDI, consumi saliti del 10-15%.',
    ifIgnored: 'Grippaggio pompa alta pressione o iniettori intasati (spesa pesante sui diesel Common Rail).',
    estimatedCostEur: '80 – 170 €',
    preventionTip: 'Sui diesel italiani non superare mai i 30.000 km per il filtro gasolio.',
    appliesToFuels: ['Diesel', 'Benzina', 'Ibrido', 'GPL/Metano'],
  },
  {
    id: 'spark-glow-plugs',
    category: 'engine_timing',
    title: 'Candele Accensione (Benzina/GPL) o Candelette (Diesel)',
    intervalKm: 50000,
    severity: 'warning',
    whatItIs:
      'Sui benzina scoccano la scintilla (Iridium/Platino); sui diesel preriscaldano la camera a freddo e aiutano la rigenerazione DPF.',
    symptoms: 'Strappi sotto carico (misfire) o avviamento lungo e zoppicante nelle mattine fredde.',
    ifIgnored: 'Bobine bruciate, catalizzatore danneggiato da benzina incombusta o candelette grippate in testata.',
    estimatedCostEur: '110 – 260 €',
    preventionTip: 'Su motori GPL/Metano dimezza l’intervallo delle candele a 30.000 km!',
    appliesToFuels: ['Diesel', 'Benzina', 'Ibrido', 'GPL/Metano'],
  },
  {
    id: 'pcv-throttle-cleaning',
    category: 'engine_timing',
    title: 'Pulizia Corpo Farfallato / EGR & Valvola PCV Vapori Olio',
    intervalKm: 75000,
    severity: 'info',
    whatItIs:
      'Rimuove le morchie carboniose dai condotti di ricircolo vapori olio e dall’EGR ripristinando il minimo regolare.',
    symptoms: 'Minimo ballerino al semaforo, fischio da membrana PCV rotta o piccolo singhiozzo in rilascio.',
    ifIgnored: 'Consumo d’olio elevato, imbrattamento valvole sui motori iniezione diretta e spia motore P0401.',
    estimatedCostEur: '90 – 220 €',
    preventionTip: 'Su TSI/TFSI valuta una Oil Catch Can o cambia membrana PCV prima dei 100.000 km.',
    appliesToFuels: ['Diesel', 'Benzina', 'Ibrido', 'GPL/Metano'],
  },

  // ---- 2. TRASMISSIONE & FRIZIONE ----
  {
    id: 'dsg-at-gearbox-oil',
    category: 'transmission',
    title: 'Tagliando Olio Cambio Automatico (DSG bagnato / ZF AT)',
    intervalKm: 60000,
    severity: 'critical',
    whatItIs:
      'Sostituzione olio idraulico e filtro esterno/interno della meccatronica e delle frizioni a bagno d’olio.',
    symptoms: 'Cambiate secche, ritardo nell’innesto D/R o piccoli colpi in scalata 3ª→2ª.',
    ifIgnored: 'Usura pacco frizioni o guasto meccatronica (riparazioni da 1.800–3.500 €).',
    estimatedCostEur: '260 – 450 €',
    preventionTip: 'Non credere mai a "olio cambio a vita": cambialo ogni 60.000 km tassativi!',
    appliesToTransmissions: ['Automatico', 'DSG / Doppia Frizione', 'Automatico AT', 'CVT / e-CVT'],
  },
  {
    id: 'manual-gearbox-oil',
    category: 'transmission',
    title: 'Cambio Olio Cambio Manuale & Controllo Giunti/Leveraggi',
    intervalKm: 90000,
    severity: 'info',
    whatItIs:
      'Rinnovo olio GL-4/GL-5 degli ingranaggi e sincronizzatori per mantenere gli innesti morbidi anche a freddo.',
    symptoms: 'Seconda marcia dura a freddo o leggero ronzio in quinta/sesta marcia.',
    ifIgnored: 'Usura prematura dei sincronizzatori 2ª e 3ª e cuscinetti albero primario.',
    estimatedCostEur: '90 – 160 €',
    preventionTip: 'Un cambio olio cambio da 100 € fa sembrare nuovo anche un 6 marce VAG da 250.000 km.',
    appliesToTransmissions: ['Manuale'],
  },
  {
    id: 'clutch-flywheel-check',
    category: 'transmission',
    title: 'Verifica Kit Frizione + Volano Bimassa (o Riduttore EV)',
    intervalKm: 140000,
    severity: 'warning',
    whatItIs:
      'Sui motori coppia alta (TDI / Turbo) il volano bimassa assorbe le vibrazioni torsionali prima del cambio.',
    symptoms: 'Tintinnio metallico a caldo a frizione premuta/rilasciata, pedale duro o slittamento in 4ª/5ª.',
    ifIgnored: 'Rottura molle parastrappi con possibile danneggiamento campana cambio.',
    estimatedCostEur: '650 – 1.250 € (EV olio riduttore: 140 €)',
    preventionTip: 'Non riprendere a pieno gas da 1.100 giri in 5ª/6ª: salva il volano!',
  },

  // ---- 3. FRENI & SICUREZZA ----
  {
    id: 'brake-fluid-dot4',
    category: 'brakes',
    title: 'Spurgo & Cambio Olio Freni DOT 4 / DOT 4 LV',
    intervalKm: 40000,
    intervalMonths: 24,
    severity: 'warning',
    whatItIs:
      'L’olio freni è igroscopico (assorbe umidità): dopo 2 anni bolle prima in discesa e arrugginisce pompa ABS.',
    symptoms: 'Pedale spugnoso dopo poche frenate intense o colore liquido ambrato scuro/marrone in vaschetta.',
    ifIgnored: 'Fading improvviso (pedale va a fondo) in discesa e grippaggio pistoncini pinze.',
    estimatedCostEur: '55 – 95 €',
    preventionTip: 'Fallo ogni 2 anni insieme alla revisione ministeriale.',
  },
  {
    id: 'brake-pads-check',
    category: 'brakes',
    title: 'Ispezione / Sostituzione Pastiglie Freno Anteriori & Posteriori',
    intervalKm: 45000,
    severity: 'warning',
    whatItIs:
      'Controllo spessore ferodo (minimo 3 mm), scorrimento perni flottanti e usura uniforme interno/esterno.',
    symptoms: 'Fischio metallico in frenata, vibrazione o spia usura pastiglie sul quadro.',
    ifIgnored: 'Ferro contro ferro: riga subito i dischi raddoppiando la spesa.',
    estimatedCostEur: '120 – 260 € ad asse',
    preventionTip: 'Sulle EV/Ibride pulisci i dischi con una frenata decisa ogni tanto: si ossidano per il recupero energia.',
  },
  {
    id: 'brake-discs-hoses',
    category: 'brakes',
    title: 'Dischi Freno + Controllo Tubi Flessibili in Gomma',
    intervalKm: 90000,
    severity: 'critical',
    whatItIs:
      'Misurazione spessore minimo disco (scalino sul bordo) e controllo screpolature sui tubi vicino alle ruote.',
    symptoms: 'Volante che trema in frenata da 110 km/h (dischi ovalizzati) o frenata tirata da un lato.',
    ifIgnored: 'Rischio cricche termiche sui dischi o perdita di pressione idraulica.',
    estimatedCostEur: '240 – 520 €',
    preventionTip: 'Quando cambi i dischi è il momento migliore per passare ai tubi in treccia aeronautica.',
  },

  // ---- 4. SOSPENSIONI, STERZO & GOMME ----
  {
    id: 'tires-rotation-alignment',
    category: 'suspension_tires',
    title: 'Inversione Gomme + Equilibratura & Convergenza',
    intervalKm: 15000,
    severity: 'info',
    whatItIs:
      'Spostamento pneumatici tra asse anteriore e posteriore + controllo angoli di campanatura e convergenza.',
    symptoms: 'Auto che tira a destra/sinistra, volante leggermente storto o spalle gomme mangiate.',
    ifIgnored: 'Butti un treno di gomme da 500 € a metà vita e affatichi cuscinetti mozzo.',
    estimatedCostEur: '45 – 90 €',
    preventionTip: 'Controlla la pressione a freddo ogni 30 giorni: salva consumo, tenuta sul bagnato e spalla.',
  },
  {
    id: 'shock-absorbers-silentblock',
    category: 'suspension_tires',
    title: 'Ammortizzatori, Tamponi, Biellette & Silent-Block Bracci',
    intervalKm: 95000,
    severity: 'warning',
    whatItIs:
      'Elementi elastici e idraulici che mantengono la gomma incollata all’asfalto sulle buche.',
    symptoms: '"Toc-toc" sordo sullo sconnesso, ondeggiamento dopo un dosso o sterzo vago.',
    ifIgnored: 'Spazi d’arresto più lunghi anche del 15-20% sul bagnato e consumo gomme a scalino.',
    estimatedCostEur: '380 – 850 €',
    preventionTip: 'Sulle piattaforme Golf V / A3 8P i silent-block posteriori dei bracci anteriori (versione piena S3/RS3) durano il doppio!',
  },

  // ---- 5. RAFFREDDAMENTO & CLIMATIZZAZIONE ----
  {
    id: 'cabin-filter-ac-check',
    category: 'cooling_ac',
    title: 'Filtro Abitacolo Carboni Attivi + Igienizzazione Clima A/C',
    intervalKm: 20000,
    intervalMonths: 12,
    severity: 'info',
    whatItIs:
      'Filtra pollini, PM2.5 e gas di scarico prima che entrino in abitacolo e lubrifica il compressore A/C.',
    symptoms: 'Vetri che si appannano subito, cattivo odore di muffa all’accensione o getto d’aria debole.',
    ifIgnored: 'Sovraccarico ventola abitacolo e perdita efficienza compressore A/C.',
    estimatedCostEur: '45 – 110 €',
    preventionTip: 'Accendi il climatizzatore almeno 10 minuti al mese anche in inverno per lubrificare le guarnizioni.',
  },
  {
    id: 'coolant-flush-thermostat',
    category: 'cooling_ac',
    title: 'Cambio Liquido Radiatore (G12/G13) & Test Termostato/Tappo',
    intervalKm: 80000,
    severity: 'warning',
    whatItIs:
      'Sostituzione antigelo anticorrosione; nei circuiti moderni VAG attenzione ai sacchetti silicato nel vaso d’espansione G13.',
    symptoms: 'Lancetta temperatura che scende a 70°C in discesa (termostato aperto) o liquido torbido color ruggine.',
    ifIgnored: 'Ostruzione radiatorino riscaldamento interno e rischio surriscaldamento in coda estiva.',
    estimatedCostEur: '85 – 190 €',
    preventionTip: 'Passa da G13 a G12evo (senza sacchetto silicato) se hai una VAG 2013–2020!',
  },

  // ---- 6. IMPIANTO ELETTRICO & BATTERIA ----
  {
    id: 'battery-12v-alternator',
    category: 'electrical',
    title: 'Test Batteria 12V (EFB/AGM) + Ricarica Alternatore/DC-DC',
    intervalKm: 45000,
    intervalMonths: 36,
    severity: 'warning',
    whatItIs:
      'Verifica spunto CCA a freddo e tensione di ricarica (13.8–14.5 V) per evitare alberi di Natale su centraline CAN-Bus.',
    symptoms: 'Start&Stop che smette di funzionare, motorino d’avviamento lento o spie ABS/ESP casuali al mattino.',
    ifIgnored: 'Resti a piedi all’improvviso (specie al primo freddo di novembre o primo caldo estivo).',
    estimatedCostEur: '130 – 240 € (con codifica BMS)',
    preventionTip: 'Sulle auto con Start&Stop va sempre codificata in centralina la nuova batteria AGM/EFB.',
  },
  {
    id: 'ev-hv-soh-check',
    category: 'electrical',
    title: 'Diagnosi Stato Salute (SOH) Batteria HV & Liquido Inverter',
    intervalKm: 40000,
    intervalMonths: 24,
    severity: 'warning',
    whatItIs:
      'Controllo bilanciamento celle alta tensione via OBD, isolamento connettori arancioni e raffreddamento batteria/inverter.',
    symptoms: 'Autonomia scesa bruscamente o velocità di ricarica Fast DC ridotta.',
    ifIgnored: 'Decadimento garanzia batteria o tagli di potenza termici dell’inverter.',
    estimatedCostEur: '90 – 180 €',
    preventionTip: 'Nell’uso quotidiano tieni la carica tra 20% e 80% per preservare la chimica NMC.',
    appliesToFuels: ['Elettrico', 'Ibrido'],
  },

  // ---- 7. SCADENZE LEGALI & CARROZZERIA ----
  {
    id: 'revisione-ministeriale-lights',
    category: 'legal_body',
    title: 'Revisione Ministeriale + Controllo Fari, Tergi & Scoli Acqua',
    intervalKm: 30000,
    intervalMonths: 24,
    severity: 'critical',
    whatItIs:
      'Controllo periodico obbligatorio su freni, fumi/OBD, giochi avantreno, luci e pulizia canali di scolo sotto parabrezza/tetto apribile.',
    symptoms: 'Acqua sui tappetini dopo pioggia forte, fari opachi o spazzole che rigano il vetro.',
    ifIgnored: 'Multa e fermo amministrativo alla revisione scaduta; centralina abitacolo allagata se si tappano gli scoli.',
    estimatedCostEur: '79 € (revisione) + 25 € tergi',
    preventionTip: 'Pulisci una volta l’anno le foglie nei due scoli agli angoli sotto i tergicristalli!',
  },
];
