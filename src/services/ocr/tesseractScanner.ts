import { createWorker } from 'tesseract.js';
import { matchQuestsFromText, type MatchResult } from './fuzzyMatcher';
import { type Quest } from '../../data/schemas';

export interface ScanResult {
  rawText: string;
  matches: MatchResult[];
}

export async function scanImageWithTesseract(
  imageSource: string | File | Blob,
  onProgress?: (progress: number, status: string) => void,
  extraQuests: Quest[] = []
): Promise<ScanResult> {
  onProgress?.(10, 'Iniciando motor OCR...');

  let processedImage: string | File | Blob = imageSource;

  // Preprocesar con Canvas para optimizar lectura de interfaz oscura de videojuegos
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const imageUrl =
      typeof imageSource === 'string'
        ? imageSource
        : URL.createObjectURL(imageSource);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Escalar 1.5x para dotar a las tipografías de más densidad de píxeles
    const scale = Math.max(1, Math.min(2, 1920 / Math.max(img.width, img.height, 1)));
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      // Calcular luminosidad media para saber si la UI es oscura
      let totalLum = 0;
      const step = 16; // muestreo rápido
      let samples = 0;
      for (let i = 0; i < d.length; i += 4 * step) {
        totalLum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        samples++;
      }
      const avgLum = samples > 0 ? totalLum / samples : 128;
      const isDarkBackground = avgLum < 120;

      // Procesar píxeles: escala de grises y si el fondo es oscuro, invertir (Tesseract rinde mucho mejor con texto oscuro sobre fondo blanco)
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (isDarkBackground) {
          lum = 255 - lum; // Invertir: texto blanco sobre fondo oscuro -> texto negro sobre fondo blanco
        }

        // Estirar contraste suavemente sin binarizar destructivamente
        const contrasted = Math.min(255, Math.max(0, 1.25 * (lum - 128) + 128));

        d[i] = contrasted;
        d[i + 1] = contrasted;
        d[i + 2] = contrasted;
      }

      ctx.putImageData(imgData, 0, 0);
      processedImage = canvas.toDataURL('image/png');
    }
  } catch (e) {
    console.warn('Canvas preprocessing skipped, using raw image:', e);
    processedImage = imageSource;
  }

  onProgress?.(30, 'Cargando modelos de reconocimiento...');

  const worker = await createWorker('eng');

  try {
    onProgress?.(50, 'Escaneando texto de pantalla...');

    const ret = await worker.recognize(processedImage);
    const rawText = ret.data.text || '';

    onProgress?.(85, 'Asociando con catálogo de misiones...');
    const matches = matchQuestsFromText(rawText, extraQuests);

    onProgress?.(100, 'Completado');
    return { rawText, matches };
  } finally {
    await worker.terminate();
  }
}

