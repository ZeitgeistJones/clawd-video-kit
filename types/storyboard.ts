export type Asset = {
  id: string
  provider: 'pexels' | 'pixabay'
  kind: 'image' | 'video'
  url: string
  thumbUrl?: string
  width?: number
  height?: number
  duration?: number
  creator?: string
  query: string
  score?: number
}

export type StoryboardScene = {
  index: number
  title: string
  narration: string
  estimatedDuration: number
  searchQueries: string[]
  selectedAsset: Asset | null
  backupAssets: Asset[]
}

export type StoryboardResult = {
  scenes: StoryboardScene[]
  keywords: string[]
  srt: string
  totalDuration: number
}

/** Candidate b-roll with a relevance score against scene narration. */
export type BrollCandidate = Asset & {
  relevanceScore: number
  reason?: string
}

/** Scene after auto-match / review scoring. */
export type ScoredScene = StoryboardScene & {
  candidates: BrollCandidate[]
  confidence: number
  needsReview: boolean
}

export type ScoreBrollResult = {
  scenes: ScoredScene[]
  scoredAt: string
  mode: 'mock' | 'model'
}

/** Below this confidence, UI should flag the scene for manual review. */
export const BROLL_REVIEW_THRESHOLD = 0.45
