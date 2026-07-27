import { generateText } from '@/lib/llm'

export type KeywordExtractionResult = {
  keywords: string[]
}

const SYSTEM = `You extract visual search keywords for stock footage (Pexels/Pixabay) used in faceless YouTube B-roll.
Return ONLY valid JSON: {"keywords":["..."]}
Rules:
- 5 to 12 keywords
- concrete, filmable, visual (objects, places, actions, textures) — not abstract jargon
- good as stock search queries (2-4 words each)
- avoid brand names, token tickers, and crypto slang unless visually filmable
- never spell "clawd" as "claude"`

/**
 * Extract 5–12 visual stock-search terms from script / notebook doc text.
 * Uses Gemini (shared text stack).
 */
export async function extractKeywords(text: string): Promise<string[]> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('text is required for keyword extraction')

  const raw = await generateText({
    system: SYSTEM,
    prompt:
      'Extract visual stock-footage search keywords from this narration / source document:\n\n' +
      trimmed.slice(0, 12000),
    maxOutputTokens: 800,
  })

  const cleaned = raw.replace(/```json|```/g, '').trim()
  let parsed: KeywordExtractionResult
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Failed to parse keyword extraction JSON')
  }

  const keywords = (parsed.keywords || [])
    .map((k) => String(k).trim())
    .filter(Boolean)
    .slice(0, 12)

  if (keywords.length < 3) {
    throw new Error('Keyword extraction returned too few terms')
  }

  return keywords
}
