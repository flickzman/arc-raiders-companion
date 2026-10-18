import Fuse from 'fuse.js';
import { allQuests } from '../../data/db';
import { type Quest } from '../../data/schemas';

export interface MatchResult {
  quest: Quest;
  confidence: number; // 0 a 100
  matchedText: string;
}

export interface MatchAnalysis {
  matches: MatchResult[];
  unmatchedLines: string[];
}

// Limpia artefactos comunes de la interfaz de usuario de juegos y avatares de comerciantes
export function cleanUiNoise(text: string): string {
  let cleaned = text
    // Normalizar apóstrofes curvados a estándar
    .replace(/[\u2018\u2019\u201B]/g, "'")
    // Quitar contadores al final tipo "(0/1)", "0/3", "1/1", "[COMPLETED]"
    .replace(/[\(\[\{]?\s*\d+\s*\/\s*\d+\s*[\)\]\}]?$/g, '')
    // Quitar etiquetas comunes de estado
    .replace(/\b(COMPLETED|TRACKED|ACTIVE|PENDING|LOCKED)\b/gi, '')
    // Quitar símbolos de viñetas, cajas [ ], flechas >, y avatares OCR (©, €, etc)
    .replace(/^[\s>»•\-–—*#|[\]{}()©€$@%&~+!?,;:/\\0-9]*/g, '')
    .trim();

  // Si aún empieza con un artefacto ruidoso corto del icono (ej. "+r, ", "f%7 ", "{© ")
  // pero preservando palabras legítimas de inicio como "A ", "TO ", "THE "
  cleaned = cleaned.replace(/^([a-z0-9%$!?,;:+_\-]{1,4}\s+)+/i, (match) => {
    const trimmedUpper = match.trim().toUpperCase();
    if (['A', 'TO', 'THE', 'AN', 'IN', 'ON', 'OFF'].includes(trimmedUpper)) {
      return match;
    }
    return '';
  }).trim();

  return cleaned;
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

  // Si empieza por una letra suelta (ej. icono triangular de facción reconocido como "A ")
  const strippedFirstLetter = text.replace(/^[a-zA-Z]\s+/, '').trim();
  if (strippedFirstLetter.length >= 3 && !variants.includes(strippedFirstLetter)) {
    variants.push(strippedFirstLetter);
  }

  return variants;
}

const UI_HEADER_KEYWORDS = [
  'QUESTS',
  'CONTRACTS',
  'LOGBOOK',
  'CURRENT CONTRACTS',
  'ACTIVE RAIDS',
  'MISSIONS',
  'OBJECTIVES',
  'ASSIGNMENTS',
];

export function analyzeQuestsFromText(
  extractedText: string,
  extraQuests: Quest[] = []
): MatchAnalysis {
  if (!extractedText.trim()) return { matches: [], unmatchedLines: [] };

  const pool = [...extraQuests, ...allQuests];

  // Configurar Fuse.js enfocado principalmente en títulos
  const fuse = new Fuse(pool, {
    keys: [
      { name: 'title.en', weight: 0.8 },
      { name: 'title.es', weight: 0.8 },
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
  const unmatchedCandidateLines: string[] = [];

  // 1. Probar línea por línea con limpieza de UI y variantes OCR
  for (const rawLine of rawLines) {
    const cleanedLine = cleanUiNoise(rawLine);
    if (cleanedLine.length < 3) continue;

    // Ignorar encabezados evidentes de UI de juego
    if (UI_HEADER_KEYWORDS.includes(cleanedLine.toUpperCase())) {
      continue;
    }

    const candidates = [cleanedLine, ...generateOcrVariants(cleanedLine)];
    let matchedInLine = false;

    for (const cand of candidates) {
      const results = fuse.search(cand);
      if (results.length > 0) {
        const topMatch = results[0];
        const score = topMatch.score ?? 1;
        const confidence = Math.round((1 - score) * 100);

        if (confidence >= 55) {
          matchedInLine = true;
          const existing = matchedQuestsMap.get(topMatch.item.id);
          if (!existing || existing.confidence < confidence) {
            matchedQuestsMap.set(topMatch.item.id, {
              quest: topMatch.item,
              confidence,
              matchedText: cleanedLine,
            });
          }
          if (confidence >= 90) {
            break;
          }
        }
      }
    }

    // Si la línea tiene formato de título (varias palabras o letras en mayúsculas) y no se asoció a nada
    if (!matchedInLine && cleanedLine.length >= 4 && !unmatchedCandidateLines.includes(cleanedLine)) {
      unmatchedCandidateLines.push(cleanedLine);
    }
  }

  // 2. Substring matching directo para misiones que puedan estar en el texto completo
  const lowerExtracted = extractedText.toLowerCase();
  for (const quest of pool) {
    if (matchedQuestsMap.has(quest.id)) continue;

    const enTitle = quest.title.en.toLowerCase();
    const esTitle = quest.title.es?.toLowerCase();

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

  const matches = Array.from(matchedQuestsMap.values()).sort((a, b) => b.confidence - a.confidence);

  // Filtrar de las candidatas aquellas que ya fueron mapeadas
  const matchedTitles = new Set(matches.map((m) => m.quest.title.en.toLowerCase()));
  const filteredUnmatched = unmatchedCandidateLines.filter(
    (line) => !matchedTitles.has(line.toLowerCase())
  );

  return {
    matches,
    unmatchedLines: filteredUnmatched,
  };
}

export function matchQuestsFromText(
  extractedText: string,
  extraQuests: Quest[] = []
): MatchResult[] {
  return analyzeQuestsFromText(extractedText, extraQuests).matches;
}
