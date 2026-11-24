import type { EuroStandardGuide } from '../core/types';

export const EURO_STANDARDS_GUIDE: EuroStandardGuide[] = [
  {
    id: 'EURO_0',
    label: 'Euro 0',
    yearIntroduced: 1988,
    ironicTagline: 'Benzina col piombo, carburatore libero e zero filtri tra te e l’atmosfera.',
    summary:
      'Tutte le vetture immatricolate prima del 31 dicembre 1992, prive di marmitta catalitica e di limiti europei armonizzati. Meccanica puramente analogica: niente centraline complesse, solo viti, getti e spinterogeno.',
    coIndex: 100,
    noxIndex: 100,
    pmIndex: 100,
    hardwareIntroduced: ['Carburatore / Iniezione meccanica', 'Scarico libero senza catalizzatore'],
    reliabilitySideEffects:
      'Nessun dispositivo anti-inquinamento che si rompe! Gli unici problemi sono ruggine, carburazione starata col freddo e guarnizioni secche.',
    ztlItalyStatus: 'Bandita tutto l’anno in quasi ogni ZTL/Area B italiana; circola solo se storica (CRS ≥ 20/40 anni ove consentito).',
    buyingAdvice: 'Solo per collezionisti, raduni o restauro storico. Non adatta all’uso pendolare in città.',
    exampleEngineIds: ['merc-om606'],
  },
  {
    id: 'EURO_1',
    label: 'Euro 1',
    yearIntroduced: 1993,
    ironicTagline: 'Arriva il catalizzatore a 3 vie e spariscono le candele imbrattate dal piombo.',
    summary:
      'Prima vera direttiva UE (91/441/CEE): obbligo di marmitta catalitica e iniezione elettronica con sonda Lambda sui motori benzina per tagliare CO e idrocarburi incombusti.',
    coIndex: 62,
    noxIndex: 76,
    pmIndex: 78,
    hardwareIntroduced: ['Catalizzatore 3 vie (Benzina)', 'Sonda Lambda', 'Iniezione elettronica'],
    reliabilitySideEffects:
      'Impatto minimo sull’affidabilità: il catalizzatore dura molto se il motore non brucia olio; qualche sonda Lambda pigra dopo 150k km.',
    ztlItalyStatus: 'Vietata in quasi tutte le grandi città e aree metropolitane del Nord/Centro Italia.',
    buyingAdvice: 'Interessante ormai solo come youngtimer anni ’90 (es. prime Clio Williams, Golf Mk3 GTI, Supra A80).',
    exampleEngineIds: ['toyota-2jz'],
  },
  {
    id: 'EURO_2',
    label: 'Euro 2',
    yearIntroduced: 1997,
    ironicTagline: 'I limiti si stringono e i primi diesel cominciano a scoprire l’iniezione diretta.',
    summary:
      'Direttiva 94/12/CE: separa per la prima volta i limiti tra benzina e diesel. È l’epoca d’oro di motori come il Mercedes OM606 e i primi TDI/JTD senza filtri allo scarico.',
    coIndex: 48,
    noxIndex: 58,
    pmIndex: 56,
    hardwareIntroduced: ['Catalizzatore ossidante (Diesel)', 'EGR pneumatica semplice'],
    reliabilitySideEffects:
      'Affidabilità ancora leggendaria: pochissima elettronica di controllo emissioni e nessuna rigenerazione forzata.',
    ztlItalyStatus: 'Bloccata in inverno/tutto l’anno in Area B Milano, Fascia Verde Roma e Pianura Padana.',
    buyingAdvice: 'Se vivi fuori dalle ZTL e vuoi un carro armato storico da tenere in garage, è la generazione più semplice da riparare.',
    exampleEngineIds: ['merc-om606', 'toyota-2jz', 'jdm-turbo-icons'],
  },
  {
    id: 'EURO_3',
    label: 'Euro 3',
    yearIntroduced: 2001,
    ironicTagline: 'Nasce la presa OBD-II e la spia gialla motore diventa tua compagna di viaggio.',
    summary:
      'Direttiva 98/69/CE: introduce l’obbligo della diagnostica di bordo (OBD) per monitorare in tempo reale i gas di scarico e una seconda sonda Lambda dopo il catalizzatore. I diesel passano in massa al Common Rail e Iniettore-Pompa.',
    coIndex: 35,
    noxIndex: 45,
    pmIndex: 38,
    hardwareIntroduced: ['Presa OBD-II diagnostica', 'Doppia Sonda Lambda', 'EGR raffreddata / elettronica'],
    reliabilitySideEffects:
      'La valvola EGR comincia a sporcarsi con la fuliggine dei diesel, ma senza DPF i motori di questa era (1.9 TDI ALH/ARL, 1.9 JTD, K20) toccano facilmente 400.000+ km.',
    ztlItalyStatus: 'Forte stretta sui diesel Euro 3 (bloccati praticamente in tutte le grandi città); benzina più tollerati in alcuni comuni.',
    buyingAdvice: 'Paradiso meccanico per gli appassionati fuori dai grandi centri urbani; occhio ai divieti regionali.',
    exampleEngineIds: ['vag-19-tdi', 'honda-k20'],
  },
  {
    id: 'EURO_4',
    label: 'Euro 4',
    yearIntroduced: 2006,
    ironicTagline: 'Taglio drastico al particolato: arrivano i primi FAP/DPF (e i primi mal di pancia in città).',
    summary:
      'Direttiva 98/69/CE B: dimezza gli NOx e il particolato (PM) sui diesel rispetto all’Euro 3. Molti costruttori introducono i primi filtri antiparticolato (DPF a secco o FAP con cerina PSA).',
    coIndex: 25,
    noxIndex: 30,
    pmIndex: 20,
    hardwareIntroduced: ['Primi DPF / FAP sui diesel', 'Sensori pressione differenziale'],
    reliabilitySideEffects:
      'Sui tragitti brevi cittadini i primi DPF faticano a rigenerare, diluendo gasolio nell’olio motore. Sui benzina invece l’Euro 4 resta semplicissimo e affidabile.',
    ztlItalyStatus: 'Diesel Euro 4 già bloccati in Area B Milano e regioni del Nord (Piemonte, Lombardia, Emilia, Veneto).',
    buyingAdvice: 'Ottimo affare su auto a benzina/GPL semplici; evita diesel Euro 4 con DPF se fai solo città.',
    exampleEngineIds: ['fiat-19-jtd', 'bmw-m57', 'subaru-ej25', 'fiat-abarth-tjet'],
  },
  {
    id: 'EURO_5',
    label: 'Euro 5 (5a / 5b)',
    yearIntroduced: 2011,
    ironicTagline: 'DPF obbligatorio per TUTTI i diesel e arrivo del downsizing turbo benzina.',
    summary:
      'Regolamento CE 715/2007: taglia dell’80% il particolato diesel rispetto all’Euro 4 rendendo obbligatorio il DPF su ogni auto a gasolio. Sui benzina esplode l’iniezione diretta turbo (TFSI/TSI/EcoBoost).',
    coIndex: 20,
    noxIndex: 22,
    pmIndex: 6,
    hardwareIntroduced: ['DPF obbligatorio (Diesel)', 'EGR ad alta e bassa pressione', 'Iniezione diretta benzina (GDI)'],
    reliabilitySideEffects:
      'Periodo critico di transizione: primi diesel soffocati in città (rigenerazioni continue) e primi benzina turbo a iniezione diretta con accumulo carbonioso sulle valvole e consumi d’olio (EA888 Gen2, 1.4 TSI EA111).',
    ztlItalyStatus: 'Diesel Euro 5 già nel mirino: bloccati a Milano Area B (salvo deroghe Move-In) e limiti progressivi nelle grandi aree urbane.',
    buyingAdvice: 'Controlla sempre i km reali e lo stato DPF sui diesel; verifica se i benzina 2009-2013 hanno subito richiami o aggiornamenti.',
    exampleEngineIds: ['bmw-n47', 'vag-ea888-gen2', 'chevy-ls3'],
  },
  {
    id: 'EURO_6',
    label: 'Euro 6 (6b / 6c / 6d-TEMP / 6e)',
    yearIntroduced: 2015,
    ironicTagline: 'Arriva l’AdBlue sui diesel e il filtro antiparticolato perfino sui benzina (GPF).',
    summary:
      'La norma più evoluta attualmente su strada: abbatte gli NOx diesel da 180 a 80 mg/km e introduce i test reali su strada (RDE) con Euro 6d-TEMP e 6d. Anche i benzina a iniezione diretta montano il GPF.',
    coIndex: 16,
    noxIndex: 10,
    pmIndex: 5,
    hardwareIntroduced: ['SCR + AdBlue (Diesel)', 'GPF / OPF (Benzina)', 'Doppia iniezione & Mild Hybrid'],
    reliabilitySideEffects:
      'I motori meccanicamente sono maturati molto (es. EA888 Gen3/4, Toyota Hybrid), ma l’impianto AdBlue (pompa/iniettore/cristallizzazione) e le cinghie a bagno d’olio (1.2 PureTech, 1.0 EcoBoost) hanno causato parecchi conti salati.',
    ztlItalyStatus: 'Euro 6d/6e benzina e ibride hanno via libera ovunque; Euro 6 diesel più recenti tollerati fino a fine decennio nella maggior parte dei comuni.',
    buyingAdvice: 'Sweet spot attuale per comprare usato recente: punta su Euro 6d-TEMP / 6d benzina, full-hybrid o diesel da autostrada con manutenzione certificata.',
    exampleEngineIds: ['vag-ea888-gen3', 'vag-20-tdi-ea288', 'toyota-18-hybrid', 'alfa-20-turbo-22-jtdm'],
  },
  {
    id: 'EURO_7',
    label: 'Euro 7',
    yearIntroduced: 2026,
    ironicTagline: 'Così severa che controlla perfino la polvere dei freni, le gomme e la batteria delle elettriche.',
    summary:
      'La nuova frontiera normativa europea (applicazione scaglionata dal 2026-2027): oltre a rendere più rigidi i test a freddo sulle emissioni allo scarico, per la prima volta tassa e misura le polveri sottili emesse da freni e pneumatici (anche su ibride ed EV) e impone requisiti minimi di durata delle batterie.',
    coIndex: 12,
    noxIndex: 7,
    pmIndex: 3,
    hardwareIntroduced: [
      'Catalizzatori riscaldati elettricamente',
      'Freni a basse emissioni / rivestiti',
      'Passaporto ambientale & Diagnostica OBD continua',
      'Garanzia minima SoH batterie EV/PHEV (80% a 5 anni / 72% a 8 anni)',
    ],
    reliabilitySideEffects:
      'Complessità software e sensoristica altissima sui termici puri (motivo per cui quasi tutte le utilitarie stanno diventando Mild Hybrid o Elettriche). Ottima notizia invece per chi compra elettrico usato grazie ai vincoli sulla salute batteria.',
    ztlItalyStatus: 'Accesso massimo garantito per almeno 10-15 anni in qualsiasi ZTL europea.',
    buyingAdvice: 'Scelta obbligata per auto nuove dal 2026+ in città; attenzione ai costi dei ricambi freni dedicati.',
    exampleEngineIds: ['vag-w8-v12-ev-hybrid'],
  },
];
