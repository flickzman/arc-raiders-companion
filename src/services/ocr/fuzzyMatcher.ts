import Fuse from 'fuse.js';
import { allQuests } from '../../data/db';
import { type Quest } from '../../data/schemas';

export interface MatchResult {
  quest: Quest;
  confidence: number; // 0 a 100
  matchedText: string;
}

// Limpia artefactos comunes de la interfaz de usuario de juegos (checkboxes, viñetas, contadores como 0/1)
function cleanUiNoise(text: string): string {
  return text
    // Quitar cajas de selección [ ], [x], ( ), etc.
    .replace(/^[\s\-_*•>#|[\](){}]*/g, '')
    // Quitar numeración de inicio tipo "1.", "01 - ", etc.
    .replace(/^\d+[\s.:)\-]+\s*/, '')
    // Quitar contadores al final tipo "(0/1)", "0/3", "1/1", "[COMPLETED]"
    .replace(/[\(\[\{]?\s*\d+\s*\/\s*\d+\s*[\)\]\}]?$/g, '')
    // Quitar etiquetas comunes de estado
    .replace(/\b(COMPLETED|TRACKED|ACTIVE|PENDING|LOCKED)\b/gi, '')
    .trim();
}

// Normalización suave de sustituciones comunes de OCR sin destruir dígitos necesarios
function generateOcrVariants(text: string): string[] {
  const variants = [text];
  
  // Variante convirtiendo símbolos típicos
  const softNormalized = text
    .replace(/0/g, 'O')
    .replace(/3/g, 'E')
    .replace(/@/g, 'A')
    .replace(/[$§]/g, 'S')
    .replace(/[|!]/g, 'I');
    
  if (softNormalized.toLowerCase() !== text.toLowerCase()) {
    variants.push(softNormalized);
  }

  // Variante quitando puntuación redundante
  const stripped = text.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (stripped && !variants.includes(stripped)) {
    variants.push(stripped);
  }

  return variants;
}

export function matchQuestsFromText(
  extractedText: string,
  extraQuests: Quest[] = []
): MatchResult[] {
  if (!extractedText.trim()) return [];

  const pool = [...extraQuests, ...allQuests];

  // Configurar Fuse.js enfocado principalmente en títulos
  const fuse = new Fuse(pool, {
    keys: [
      { name: 'title.en', weight: 0.7 },
      { name: 'title.es', weight: 0.7 },
      { name: 'vendor', weight: 0.2 },
    ],
    includeScore: true,
    threshold: 0.45,
    minMatchCharLength: 3,
    ignoreLocation: true,
  });

  const rawLines = extractedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);

  const matchedQuestsMap = new Map<string, MatchResult>();

  // 1. Probar línea por línea con limpieza de UI y variantes OCR
  for (const rawLine of rawLines) {
    const cleanedLine = cleanUiNoise(rawLine);
    if (cleanedLine.length < 3) continue;

    const candidates = [cleanedLine, ...generateOcrVariants(cleanedLine)];

    for (const cand of candidates) {
      const results = fuse.search(cand);
      if (results.length > 0) {
        const topMatch = results[0];
        const score = topMatch.score ?? 1;
        const confidence = Math.round((1 - score) * 100);

        if (confidence >= 55) {
          const existing = matchedQuestsMap.get(topMatch.item.id);
          if (!existing || existing.confidence < confidence) {
            matchedQuestsMap.set(topMatch.item.id, {
              quest: topMatch.item,
              confidence,
              matchedText: rawLine,
            });
          }
        }
      }
    }
  }

  // 2. Substring matching directo para atrapar misiones embebidas en bloques de texto
  const lowerExtracted = extractedText.toLowerCase();
  for (const quest of pool) {
    if (matchedQuestsMap.has(quest.id)) continue;

    const enTitle = quest.title.en.toLowerCase();
    const esTitle = quest.title.es?.toLowerCase();

    // Comprobación de título exacto contenido
    if (enTitle.length >= 4 && lowerExtracted.includes(enTitle)) {
      matchedQuestsMap.set(quest.id, {
        quest,
        confidence: 95,
        matchedText: quest.title.en,
      });
      continue;
    }

    if (esTitle && esTitle.length >= 4 && lowerExtracted.includes(esTitle)) {
      matchedQuestsMap.set(quest.id, {
        quest,
        confidence: 95,
        matchedText: quest.title.es || quest.title.en,
      });
    }
  }

  // Devolver ordenados por mayor confianza
  return Array.from(matchedQuestsMap.values()).sort((a, b) => b.confidence - a.confidence);
}

