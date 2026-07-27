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
