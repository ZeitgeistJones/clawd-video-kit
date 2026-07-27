import { generateText } from '@/lib/llm'
import { extractJson } from '@/lib/parse-json'
import { env } from '@/lib/env'
import {
  BROLL_REVIEW_THRESHOLD,
  type Asset,
  type BrollCandidate,
  type ScoreBrollResult,
  type ScoredScene,
  type StoryboardScene,
} from '@/types/storyboard'

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3)
}

function uniqueAssets(scene: StoryboardScene): Asset[] {
  const list: Asset[] = []
  const seen = new Set<string>()
  for (const a of [scene.selectedAsset, ...(scene.backupAssets || [])]) {
    if (!a?.id || !a.url) continue
    if (seen.has(a.id)) continue
    seen.add(a.id)
    list.push(a)
  }
  return list
}

/** Normalize storyboard scenes into a consistent candidate pool per scene. */
export function normalizeStoryboardScenes(scenes: StoryboardScene[]): StoryboardScene[] {
  if (!Array.isArray(scenes)) return []
  return scenes.map((scene, i) => {
    const assets = uniqueAssets(scene)
    return {
      index: typeof scene.index === 'number' ? scene.index : i,
      title: (scene.title || `Scene ${i + 1}`).trim(),
      narration: (scene.narration || '').trim(),
      estimatedDuration: Math.max(1, Number(scene.estimatedDuration) || 5),
      searchQueries: Array.isArray(scene.searchQueries)
        ? scene.searchQueries.map((q) => String(q).trim()).filter(Boolean)
        : [],
      selectedAsset: assets[0] || null,
      backupAssets: assets.slice(1),
    }
  })
}

function mockRelevance(narration: string, searchQueries: string[], asset: Asset): {
  score: number
  reason: string
} {
  const narrTokens = new Set(tokenize(`${narration} ${searchQueries.join(' ')}`))
  const assetTokens = tokenize(`${asset.query} ${asset.kind} ${asset.creator || ''}`)
  if (narrTokens.size === 0 || assetTokens.length === 0) {
    const base = typeof asset.score === 'number' ? Math.min(1, asset.score / 12) : 0.2
    return { score: base, reason: 'weak text signal; used provider rank' }
  }

  let hits = 0
  for (const t of assetTokens) {
    if (narrTokens.has(t)) hits++
  }
  let score = hits / assetTokens.length

  if (asset.kind === 'video') score += 0.05
  if (typeof asset.score === 'number') {
    score += Math.min(0.15, asset.score / 40)
  }

  score = Math.max(0, Math.min(1, score))
  return {
    score,
    reason: hits > 0
      ? `token overlap ${hits}/${assetTokens.length}`
      : 'no token overlap; low confidence',
  }
}

function finalizeScene(scene: StoryboardScene, candidates: BrollCandidate[]): ScoredScene {
  const ranked = [...candidates].sort((a, b) => b.relevanceScore - a.relevanceScore)
  const best = ranked[0] || null
  const confidence = best?.relevanceScore ?? 0
  const needsReview = !best || confidence < BROLL_REVIEW_THRESHOLD

  const toAsset = (c: BrollCandidate): Asset => ({
    id: c.id,
    provider: c.provider,
    kind: c.kind,
    url: c.url,
    thumbUrl: c.thumbUrl,
    width: c.width,
    height: c.height,
    duration: c.duration,
    creator: c.creator,
    query: c.query,
    score: c.score,
  })

  return {
    ...scene,
    selectedAsset: best ? toAsset(best) : null,
    backupAssets: ranked.slice(1).map(toAsset),
    candidates: ranked,
    confidence,
    needsReview,
  }
}

export function scoreScenesMock(scenes: StoryboardScene[]): ScoredScene[] {
  const normalized = normalizeStoryboardScenes(scenes)
  return normalized.map((scene) => {
    const assets = uniqueAssets(scene)
    const candidates: BrollCandidate[] = assets.map((asset) => {
      const { score, reason } = mockRelevance(scene.narration, scene.searchQueries, asset)
      return { ...asset, relevanceScore: score, reason }
    })
    return finalizeScene(scene, candidates)
  })
}

type ModelScoreRow = {
  sceneIndex: number
  scores: Array<{ assetId: string; relevanceScore: number; reason?: string }>
}

export async function scoreScenesModel(scenes: StoryboardScene[]): Promise<ScoredScene[]> {
  const normalized = normalizeStoryboardScenes(scenes)

  const payload = normalized.map((scene) => ({
    index: scene.index,
    title: scene.title,
    narration: scene.narration.slice(0, 500),
    searchQueries: scene.searchQueries,
    candidates: uniqueAssets(scene).map((a) => ({
      id: a.id,
      kind: a.kind,
      query: a.query,
      provider: a.provider,
      creator: a.creator || null,
    })),
  }))

  const system =
    'You score B-roll relevance for faceless YouTube scenes. ' +
    'Return ONLY JSON: {"scores":[{"sceneIndex":0,"scores":[{"assetId":"...","relevanceScore":0.0,"reason":"..."}]}]}. ' +
    'relevanceScore is 0-1. Score how well each candidate fits the narration visually. Never spell clawd as claude.'

  const raw = await generateText({
    system,
    prompt: `Score each candidate for each scene:\n${JSON.stringify(payload)}`,
    maxOutputTokens: 4000,
    json: true,
  })

  const parsed = extractJson<{ scores?: ModelScoreRow[] }>(raw)
  const byScene = new Map<number, ModelScoreRow>()
  for (const row of parsed.scores || []) {
    byScene.set(row.sceneIndex, row)
  }

  return normalized.map((scene) => {
    const assets = uniqueAssets(scene)
    const modelRow = byScene.get(scene.index)
    const scoreMap = new Map(
      (modelRow?.scores || []).map((s) => [
        s.assetId,
        {
          relevanceScore: Math.max(0, Math.min(1, Number(s.relevanceScore) || 0)),
          reason: s.reason,
        },
      ]),
    )

    const candidates: BrollCandidate[] = assets.map((asset) => {
      const hit = scoreMap.get(asset.id)
      if (hit) return { ...asset, relevanceScore: hit.relevanceScore, reason: hit.reason }
      const { score, reason } = mockRelevance(scene.narration, scene.searchQueries, asset)
      return { ...asset, relevanceScore: score, reason: `fallback: ${reason}` }
    })

    return finalizeScene(scene, candidates)
  })
}

export function resolveScoreMode(forceMock?: boolean): 'mock' | 'model' {
  if (forceMock === true) return 'mock'
  if (forceMock === false) return 'model'
  return env.scoreBrollMock() ? 'mock' : 'model'
}

/**
 * Score storyboard scenes and auto-select the best b-roll candidate per scene.
 * Model failures fall back to mock scoring; `mode` reflects what actually ran.
 */
export async function scoreBroll(
  scenes: StoryboardScene[],
  opts?: { forceMock?: boolean },
): Promise<ScoreBrollResult> {
  const requested = resolveScoreMode(opts?.forceMock)

  if (requested === 'mock') {
    return {
      scenes: scoreScenesMock(scenes),
      scoredAt: new Date().toISOString(),
      mode: 'mock',
    }
  }

  try {
    return {
      scenes: await scoreScenesModel(scenes),
      scoredAt: new Date().toISOString(),
      mode: 'model',
    }
  } catch {
    return {
      scenes: scoreScenesMock(scenes),
      scoredAt: new Date().toISOString(),
      mode: 'mock',
    }
  }
}
