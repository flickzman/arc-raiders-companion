import { allQuests } from '../../data/db';
import { type MatchResult } from './fuzzyMatcher';

export async function scanImageWithGeminiVision(
  imageSource: File | Blob | string,
  apiKey: string
): Promise<MatchResult[]> {
  if (!apiKey.trim()) {
    throw new Error('Debes configurar una API Key de Gemini en Ajustes para usar Visión por IA.');
  }

  // 1. Convertir la imagen a Base64 puro
  let base64Data = '';
  let mimeType = 'image/jpeg';

  if (typeof imageSource === 'string') {
    if (imageSource.startsWith('data:')) {
      const parts = imageSource.split(',');
      mimeType = parts[0].split(':')[1].split(';')[0];
      base64Data = parts[1];
    } else {
      throw new Error('Formato de imagen no soportado');
    }
  } else {
    mimeType = imageSource.type || 'image/jpeg';
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const b64 = res.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    });
  }

  // 2. Preparar el listado de misiones conocidas para guiar al modelo
  const questManifest = allQuests.map((q) => ({
    id: q.id,
    title_en: q.title.en,
    title_es: q.title.es,
    vendor: q.vendor,
  }));

  const prompt = `You are an expert OCR and game assistant for ARC Raiders.
Analyze this photo/screenshot taken from a player's screen showing their quests/missions log.
Match the visible quests against this database:
${JSON.stringify(questManifest)}

Respond ONLY with a JSON object in this exact schema without any markdown formatting or codeblocks:
{
  "detectedQuestIds": ["quest_id_1", "quest_id_2"],
  "confidenceNotes": "brief note"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      apiKey.trim()
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error en API de Gemini (${response.status}): ${errorBody}`);
  }

  const json = await response.json();
  const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResponse) {
    return [];
  }

  try {
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const detectedIds: string[] = parsed.detectedQuestIds || [];

    const matches: MatchResult[] = [];
    detectedIds.forEach((id) => {
      const q = allQuests.find((quest) => quest.id === id);
      if (q) {
        matches.push({
          quest: q,
          confidence: 98,
          matchedText: q.title.en,
        });
      }
    });

    return matches;
  } catch (err) {
    console.error('Error parseando JSON de Gemini Vision:', err);
    return [];
  }
}
