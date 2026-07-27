import { generateText } from '@/lib/llm'
import { extractKeywords } from '@/lib/keywords'
import { unifiedSearchAssets, type Asset } from '@/lib/stock'
import { scenesToSrt } from '@/lib/srt'
import { extractJson } from '@/lib/parse-json'
import type { Duration } from '@/types/generate'
import type { StoryboardScene, StoryboardResult } from '@/types/storyboard'

export type { StoryboardScene, StoryboardResult } from '@/types/storyboard'

type RawScene = {
  title?: string
  narration?: string
  estimatedDuration?: number
  searchQueries?: string[]
}

function targetSeconds(duration?: Duration): number {
  if (duration === 'short') return 40
  if (duration === 'medium') return 150
  return 330 // full ~5.5 min
}

function normalizeDurations(scenes: RawScene[], target: number): RawScene[] {
  if (scenes.length === 0) return scenes
  const sum = scenes.reduce((acc, s) => acc + Math.max(1, Number(s.estimatedDuration) || 5), 0)
  if (sum <= 0) return scenes
  const scale = target / sum
  return scenes.map((s) => ({
    ...s,
    estimatedDuration: Math.max(2, Math.round((Number(s.estimatedDuration) || 5) * scale)),
  }))
}

const SCENE_SYSTEM = `You turn narration / NotebookLM source docs into a faceless-video storyboard.
Return ONLY valid JSON:
{"scenes":[{"title":"...","narration":"...","estimatedDuration":12,"searchQueries":["query one","query two"]}]}

Rules:
- Split into 6–14 scenes for full videos, 4–8 for medium, 3–6 for shorts
- Each scene: short title, narration excerpt (1–3 sentences from the source — do not invent claims), estimatedDuration in seconds, 1–2 visual stock searchQueries
- searchQueries must be filmable B-roll terms (not brand slogans)
- Durations should roughly sum to the target spoken length
- Never spell "clawd" as "claude"`

async function generateRawScenes(text: string, duration?: Duration): Promise<RawScene[]> {
  const target = targetSeconds(duration)
  const raw = await generateText({
    system: SCENE_SYSTEM,
    prompt:
      `Target spoken duration: ~${target} seconds (${duration || 'full'}).\n` +
      `Respond with JSON only.\n\n` +
      `Source text:\n\n${text.slice(0, 14000)}`,
    maxOutputTokens: 4000,
    json: true,
  })

  const parsed = extractJson<{ scenes?: RawScene[] }>(raw)
  const scenes = (parsed.scenes || []).filter((s) => (s.narration || s.title || '').trim())
  if (scenes.length === 0) {
    throw new Error('Storyboard generation returned no scenes')
  }

  return normalizeDurations(scenes, target)
}

async function attachAssets(scene: RawScene, index: number): Promise<StoryboardScene> {
  const queries = (scene.searchQueries || [])
    .map((q) => String(q).trim())
    .filter(Boolean)
    .slice(0, 2)

  let assets: Asset[] = []
  if (queries.length > 0) {
    assets = await unifiedSearchAssets(queries, { perQuery: 5 })
  }

  const selectedAsset = assets[0] || null
  const backupAssets = assets.slice(1, 4)

  return {
    index,
    title: (scene.title || `Scene ${index + 1}`).trim(),
    narration: (scene.narration || '').trim(),
    estimatedDuration: Math.max(2, Number(scene.estimatedDuration) || 5),
    searchQueries: queries,
    selectedAsset,
    backupAssets,
  }
}

/**
 * Build a full storyboard: keywords → scenes → stock matches → SRT.
 */
export async function buildStoryboard(
  text: string,
  opts?: { duration?: Duration },
): Promise<StoryboardResult> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('text is required for storyboard generation')

  const [keywords, rawScenes] = await Promise.all([
    extractKeywords(trimmed),
    generateRawScenes(trimmed, opts?.duration),
  ])

  // Attach assets sequentially to avoid hammering stock APIs
  const scenes: StoryboardScene[] = []
  for (let i = 0; i < rawScenes.length; i++) {
    scenes.push(await attachAssets(rawScenes[i], i))
  }

  const totalDuration = scenes.reduce((acc, s) => acc + s.estimatedDuration, 0)
  const srt = scenesToSrt(scenes)

  return { scenes, keywords, srt, totalDuration }
}
