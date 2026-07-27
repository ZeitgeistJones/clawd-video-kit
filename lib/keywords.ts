import { generateText } from '@/lib/llm'
import { extractJson } from '@/lib/parse-json'

export type KeywordExtractionResult = {
  keywords: string[]
}

const SYSTEM = `You extract visual search keywords for stock footage (Pexels/Pixabay) used in faceless YouTube B-roll.
Return ONLY valid JSON with this exact shape: {"keywords":["phrase one","phrase two"]}
Rules:
- 5 to 12 keywords
- concrete, filmable, visual (objects, places, actions, textures) — not abstract jargon
- good as stock search queries (2-4 words each)
- avoid brand names, token tickers, and crypto slang unless visually filmable
- never spell "clawd" as "claude"
- no markdown, no commentary`

/** Cheap fallback if the model returns garbage — still enough to search stock. */
function heuristicKeywords(text: string): string[] {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'you',
    'are', 'was', 'were', 'have', 'has', 'been', 'not', 'but', 'its', 'they',
    'them', 'their', 'about', 'just', 'like', 'also', 'when', 'what', 'which',
    'will', 'can', 'repo', 'code', 'build', 'built', 'clawd', 'claude', 'video',
    'channel', 'youtube', 'notebooklm', 'disclaimer', 'financial', 'advice',
  ])
  const counts = new Map<string, number>()
  for (const raw of text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || []) {
    const w = raw.replace(/-+/g, ' ').trim()
    if (!w || stop.has(w) || /^\d+$/.test(w)) continue
    counts.set(w, (counts.get(w) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w)
}

/**
 * Extract 5–12 visual stock-search terms from script / notebook doc text.
 * Uses Gemini (shared text stack), with a local fallback if JSON is messy.
 */
export async function extractKeywords(text: string): Promise<string[]> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('text is required for keyword extraction')

  try {
    const raw = await generateText({
      system: SYSTEM,
      prompt:
        'Extract visual stock-footage search keywords from this narration / source document.\n' +
        'Respond with JSON only.\n\n' +
        trimmed.slice(0, 12000),
      maxOutputTokens: 800,
      json: true,
    })

    const parsed = extractJson<KeywordExtractionResult | string[]>(raw)
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.keywords)
        ? parsed.keywords
        : []

    const keywords = list
      .map((k) => String(k).trim())
      .filter(Boolean)
      .slice(0, 12)

    if (keywords.length >= 3) return keywords
  } catch {
    // fall through to heuristic
  }

  const fallback = heuristicKeywords(trimmed)
  if (fallback.length < 3) {
    throw new Error('Failed to extract visual keywords from text')
  }
  return fallback
}
