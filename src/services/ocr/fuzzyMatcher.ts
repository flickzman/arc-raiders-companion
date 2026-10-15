import Fuse from 'fuse.js';
import { allQuests } from '../../data/db';
import { type Quest } from '../../data/schemas';

export interface MatchResult {
  quest: Quest;
  confidence: number; // 0 a 100
  matchedText: string;
}

export function matchQuestsFromText(
  extractedText: string,
  extraQuests: Quest[] = []
): MatchResult[] {
  if (!extractedText.trim()) return [];

  const pool = [...extraQuests, ...allQuests];

  // Función auxiliar para normalizar sustituciones típicas de OCR (ej: 0 por o, 3 por e, 1 por i)
  const cleanOcrNoise = (str: string) =>
    str
      .replace(/0/g, 'o')
      .replace(/[1|!]/g, 'i')
      .replace(/3/g, 'e')
      .replace(/@/g, 'a')
      .replace(/5/g, 's');

  // Configurar Fuse.js para buscar en títulos (inglés y español) y objetivos
  const fuse = new Fuse(pool, {
    keys: [
      { name: 'title.en', weight: 0.6 },
      { name: 'title.es', weight: 0.6 },
      { name: 'vendor', weight: 0.2 },
      { name: 'objectives.description.en', weight: 0.3 },
      { name: 'objectives.description.es', weight: 0.3 },
    ],
    includeScore: true,
    threshold: 0.5, // Tolerancia calibrada para OCR
    minMatchCharLength: 3,
  });

  const lines = extractedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 4);

  const matchedQuestsMap = new Map<string, MatchResult>();

  // 1. Probar línea por línea con el texto original y con normalización de ruido OCR
  for (const line of lines) {
    const candidates = [line, cleanOcrNoise(line)];
    for (const cand of candidates) {
      const results = fuse.search(cand);
      if (results.length > 0) {
        const topMatch = results[0];
        const score = topMatch.score ?? 1;
        const confidence = Math.round((1 - score) * 100);

        if (confidence >= 50) {
          const existing = matchedQuestsMap.get(topMatch.item.id);
          if (!existing || existing.confidence < confidence) {
            matchedQuestsMap.set(topMatch.item.id, {
              quest: topMatch.item,
              confidence,
              matchedText: line,
            });
          }
        }
      }
    }
  }

  // 2. Si hay pocas coincidencias, probar con ventanas de texto o búsqueda global
  if (matchedQuestsMap.size === 0) {
    for (const quest of pool) {
      const enTitle = quest.title.en.toLowerCase();
      const esTitle = quest.title.es?.toLowerCase();
      const lowerExtracted = extractedText.toLowerCase();

      if (lowerExtracted.includes(enTitle) || (esTitle && lowerExtracted.includes(esTitle))) {
        matchedQuestsMap.set(quest.id, {
          quest,
          confidence: 95,
          matchedText: enTitle,
        });
      }
    }
  }

  // Devolver ordenados por mayor confianza
  return Array.from(matchedQuestsMap.values()).sort((a, b) => b.confidence - a.confidence);
}
