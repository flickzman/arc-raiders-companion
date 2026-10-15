import { createWorker } from 'tesseract.js';
import { matchQuestsFromText, type MatchResult } from './fuzzyMatcher';

export interface ScanResult {
  rawText: string;
  matches: MatchResult[];
}

export async function scanImageWithTesseract(
  imageSource: string | File | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<ScanResult> {
  onProgress?.(10, 'Iniciando motor OCR...');

  let processedImage: string | File | Blob = imageSource;

  // Si es un Blob/File o string, preprocesar en un canvas para mayor nitidez
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

    canvas.width = img.width;
    canvas.height = img.height;

    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      // Filtro táctico: Binarización adaptativa ligera para fuentes claras sobre fondo oscuro
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        // Luminosidad
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        // Aumentar contraste
        const factor = 1.3;
        const contrast = Math.min(255, Math.max(0, factor * (lum - 128) + 128));
        d[i] = contrast;
        d[i + 1] = contrast;
        d[i + 2] = contrast;
      }
      ctx.putImageData(imgData, 0, 0);
      processedImage = canvas.toDataURL('image/png');
    }
  } catch {
    // Si falla el canvas, usar la imagen original directamente
    processedImage = imageSource;
  }

  onProgress?.(30, 'Cargando modelos de reconocimiento...');

  const worker = await createWorker('eng');

  try {
    onProgress?.(50, 'Escaneando texto de pantalla...');

    const ret = await worker.recognize(processedImage);
    const rawText = ret.data.text || '';

    onProgress?.(85, 'Asociando con catálogo de misiones...');
    const matches = matchQuestsFromText(rawText);

    onProgress?.(100, 'Completado');
    return { rawText, matches };
  } finally {
    await worker.terminate();
  }
}
