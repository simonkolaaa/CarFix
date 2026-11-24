export interface DetectionItem {
  class: string;
  score: number;
}

export interface GatekeeperVerdict {
  approved: boolean;
  confidence: number;
  detectedLabel: string;
  message: string;
}

const VEHICLE_CLASSES = new Set(['car', 'truck', 'bus', 'motorcycle']);
const MIN_VEHICLE_SCORE = 0.42;

const ROAST_BY_CLASS: Record<string, string> = {
  person:
    'Bel selfie, ma CarFix non fa tagliandi agli esseri umani. Inquadra l’auto, non il pilota.',
  cat: 'Un gatto molto aerodinamico, ma qui accettiamo solo cavalli vapore veri (non miagolii a freddo).',
  dog: 'Ottimo copilota da sedile posteriore, ma ci serve la carrozzeria dell’auto!',
  'cell phone':
    'Foto allo schermo o telefono? Niente trucchi da annuncio sospetto: carica uno scatto reale della vettura.',
  laptop:
    'Quello è un computer, non una centralina rimappata. Carica una foto della tua auto!',
  pizza:
    'Apprezziamo il carburante per il meccanico, ma l’AI cerca lamiere e cerchi in lega.',
  bottle:
    'Sembra una bottiglia: speriamo non sia l’olio rabboccato ogni 500 km sul PureTech. Serve la foto dell’auto!',
  bicycle:
    'Due ruote a pedali? Zero bollo, zero ZTL, ma qui siamo su CarFix: servono almeno due pistoni (o un motore elettrico).',
};

export function evaluateVehicleDetections(detections: DetectionItem[]): GatekeeperVerdict {
  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const bestVehicle = sorted.find(
    (d) => VEHICLE_CLASSES.has(d.class.toLowerCase()) && d.score >= MIN_VEHICLE_SCORE,
  );

  if (bestVehicle) {
    const pct = Math.round(bestVehicle.score * 100);
    return {
      approved: true,
      confidence: bestVehicle.score,
      detectedLabel: bestVehicle.class,
      message: `Veicolo riconosciuto con confidenza ${pct}% (${bestVehicle.class}). Accesso al Garage approvato!`,
    };
  }

  const topOther = sorted[0];
  if (topOther) {
    const key = topOther.class.toLowerCase();
    const customRoast = ROAST_BY_CLASS[key];
    return {
      approved: false,
      confidence: topOther.score,
      detectedLabel: topOther.class,
      message:
        customRoast ??
        `L'AI ha rilevato "${topOther.class}" (${Math.round(topOther.score * 100)}%) ma nessuna automobile. Riprova con un'inquadratura chiara dell'auto!`,
    };
  }

  return {
    approved: false,
    confidence: 0,
    detectedLabel: 'none',
    message:
      'Nessun veicolo rilevato nell’immagine. Scatta in buona luce mostrando almeno tre quarti dell’auto (no meme o sfondi vuoti).',
  };
}
