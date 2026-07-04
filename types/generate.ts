export type Duration = 'full' | 'medium' | 'short'

export type GenerationOutputs = {
  duration: Duration
  isHeyGen: boolean
  shortBrief?: string
  notebookDoc?: string
  youtubeDesc?: string
  thumbnailPrompt?: string
  generatedAt: string
}
