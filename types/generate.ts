export type Duration = 'full' | 'medium' | 'short'

/** Classic audio/doc path, Cinematic Video Overview path, or controlled draft. */
export type WorkflowLane = 'classic' | 'cinematic' | 'draft'

export type CinematicOutputs = {
  steeringPrompt?: string
  sourceEmphasis?: string
  visualStyleGuidance?: string
  runtimeScope?: string
  sceneFocusNotes?: string
  /** One paste for NotebookLM Cinematic customize box */
  cinematicCustomizePaste?: string
}

export type GenerationOutputs = {
  lane?: WorkflowLane
  duration: Duration
  isHeyGen: boolean
  shortBrief?: string
  notebookDoc?: string
  youtubeDesc?: string
  thumbnailPrompt?: string
  generatedAt: string
} & CinematicOutputs
