import { evaluateVehicleDetections, type GatekeeperVerdict } from '../core/carGatekeeperRules';
import type { RimStyleId, VisualModsConfig } from '../core/types';

export interface ValidatedPhotoResult {
  verdict: GatekeeperVerdict;
  dataUrl?: string;
  cutoutSucceeded?: boolean;
  dominantColorHex?: string;
  detectedRimFinish?: VisualModsConfig['rimFinish'];
  detectedRimStyle?: RimStyleId;
  detectedStance?: 'stock' | 'lowered';
}

interface CocoDetection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

type CocoSsdModel = {
  detect: (img: HTMLImageElement | HTMLCanvasElement) => Promise<CocoDetection[]>;
};

let modelPromise: Promise<CocoSsdModel> | null = null;

async function getDetectorModel(): Promise<CocoSsdModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      return await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    })();
  }
  return modelPromise;
}

function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossibile leggere il file immagine.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Formato immagine non valido o corrotto.'));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function analyzeWheelRegion(
  ctx: CanvasRenderingContext2D,
  outW: number,
  outH: number,
): {
  detectedRimFinish: VisualModsConfig['rimFinish'];
  detectedRimStyle: RimStyleId;
  detectedStance: 'stock' | 'lowered';
} {
  try {
    // Campiona la fascia inferiore dove tipicamente si trovano passaruota e cerchi (y: 58%-88%)
    const rx = Math.round(outW * 0.18);
    const ry = Math.round(outH * 0.58);
    const rw = Math.max(20, Math.round(outW * 0.64));
    const rh = Math.max(20, Math.round(outH * 0.28));
    const data = ctx.getImageData(rx, ry, rw, rh).data;

    let lumaSum = 0;
    let warmYellowCount = 0;
    let darkMetallicCount = 0;
    let brightSilverCount = 0;
    let contrastEdges = 0;
    let count = 0;

    for (let i = 0; i < data.length - 4; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      lumaSum += luma;
      if (r > g + 15 && g > b + 20 && luma > 90) warmYellowCount++;
      else if (luma > 155) brightSilverCount++;
      else if (luma > 35 && luma < 95) darkMetallicCount++;

      const nextLuma = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
      if (Math.abs(luma - nextLuma) > 28) contrastEdges++;
      count++;
    }

    const avgLuma = count > 0 ? lumaSum / count : 120;
    let detectedRimFinish: VisualModsConfig['rimFinish'] = 'silver';
    if (warmYellowCount > count * 0.14) {
      detectedRimFinish = avgLuma > 125 ? 'gold' : 'bronze';
    } else if (avgLuma < 65) {
      detectedRimFinish = 'black';
    } else if (darkMetallicCount > brightSilverCount * 1.4) {
      detectedRimFinish = 'anthracite';
    }

    const edgeRatio = count > 0 ? contrastEdges / count : 0.2;
    const detectedRimStyle: RimStyleId =
      edgeRatio > 0.38
        ? 'bbs_multispoke'
        : edgeRatio > 0.26
          ? 'oz_ultraleggera'
          : edgeRatio > 0.16
            ? 'detroit_gti'
            : 'oem_5spoke';

    const detectedStance: 'stock' | 'lowered' = avgLuma < 85 ? 'lowered' : 'stock';
    return { detectedRimFinish, detectedRimStyle, detectedStance };
  } catch {
    return {
      detectedRimFinish: 'silver',
      detectedRimStyle: 'oem_5spoke',
      detectedStance: 'stock',
    };
  }
}

function analyzeAndCropVehiclePhoto(
  img: HTMLImageElement,
  bbox?: [number, number, number, number],
): {
  dataUrl: string;
  dominantColorHex: string;
  detectedRimFinish: VisualModsConfig['rimFinish'];
  detectedRimStyle: RimStyleId;
  detectedStance: 'stock' | 'lowered';
} {
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (bbox && bbox[2] > 40 && bbox[3] > 40) {
    const [bx, by, bw, bh] = bbox;
    const padX = bw * 0.08;
    const padY = bh * 0.1;
    sx = Math.max(0, bx - padX);
    sy = Math.max(0, by - padY);
    sw = Math.min(img.width - sx, bw + padX * 2);
    sh = Math.min(img.height - sy, bh + padY * 2);
  }

  const maxWidth = 680;
  const scale = sw > maxWidth ? maxWidth / sw : 1;
  const outW = Math.max(300, Math.round(sw * scale));
  const outH = Math.max(190, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  let dominantColorHex = '#6b7280';
  let wheelAnalysis: ReturnType<typeof analyzeWheelRegion> = {
    detectedRimFinish: 'silver',
    detectedRimStyle: 'oem_5spoke',
    detectedStance: 'stock',
  };

  if (ctx) {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    try {
      // Campiona zona fiancata / cofano (escludendo riflessi estremi bianchi/neri)
      const sampleW = Math.max(16, Math.round(outW * 0.36));
      const sampleH = Math.max(16, Math.round(outH * 0.22));
      const sample = ctx.getImageData(
        Math.round(outW * 0.32),
        Math.round(outH * 0.44),
        sampleW,
        sampleH,
      ).data;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let count = 0;
      for (let i = 0; i < sample.length; i += 16) {
        const r = sample[i];
        const g = sample[i + 1];
        const b = sample[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luma > 25 && luma < 235) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }
      if (count > 0) {
        dominantColorHex = rgbToHex(rSum / count, gSum / count, bSum / count);
      }
      wheelAnalysis = analyzeWheelRegion(ctx, outW, outH);
    } catch {
      // Ignore pixel read error
    }
  }

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.85),
    dominantColorHex,
    ...wheelAnalysis,
  };
}

export async function validateAndProcessCarPhoto(
  file: File,
  onStageChange?: (
    stage: 'loading_ai' | 'scanning' | 'removing_bg' | 'done',
    progressPct?: number,
  ) => void,
): Promise<ValidatedPhotoResult> {
  if (!file.type.startsWith('image/')) {
    return {
      verdict: {
        approved: false,
        confidence: 0,
        detectedLabel: 'invalid-file',
        message: 'Formato non valido: carica un file immagine JPG, PNG o WebP della tua auto.',
      },
    };
  }

  const img = await readFileAsImage(file);
  onStageChange?.('loading_ai');

  try {
    const model = await getDetectorModel();
    onStageChange?.('scanning');
    const detections = await model.detect(img);
    const verdict = evaluateVehicleDetections(detections);

    if (!verdict.approved) {
      onStageChange?.('done');
      return { verdict };
    }

    const bestVehicle = [...detections]
      .sort((a, b) => b.score - a.score)
      .find((d) => ['car', 'truck', 'bus', 'motorcycle'].includes(d.class.toLowerCase()));

    const analysis = analyzeAndCropVehiclePhoto(img, bestVehicle?.bbox);
    onStageChange?.('done');

    return {
      verdict,
      dataUrl: analysis.dataUrl,
      cutoutSucceeded: true,
      dominantColorHex: analysis.dominantColorHex,
      detectedRimFinish: analysis.detectedRimFinish,
      detectedRimStyle: analysis.detectedRimStyle,
      detectedStance: analysis.detectedStance,
    };
  } catch {
    onStageChange?.('done');
    return {
      verdict: {
        approved: false,
        confidence: 0,
        detectedLabel: 'ai-load-error',
        message:
          'AI Vision temporaneamente non raggiungibile per caricare i pesi COCO-SSD. Riprova tra qualche secondo!',
      },
    };
  }
}
