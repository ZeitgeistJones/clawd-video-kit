export type Duration = 'full' | 'medium' | 'short'

/** Classic audio/doc path, Cinematic Video Overview path, or controlled draft. */
export type WorkflowLane = 'classic' | 'cinematic' | 'draft'

export type CinematicOutputs = {
  /** Source 2 — steering companion to the full repo pack */
  emphasisSource?: string
  /** Source 3 — why this matters to $CLAWD holders (tagged direct/indirect, live/planned/speculative) */
  holderThesisSource?: string
  /** Fixed normie voice block used in customize paste */
  narratorBlock?: string
  focusGuidance?: string
  feelNotes?: string
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
  /** Full packed repo text for download as NLM source 1 (cinematic) */
  packedRepo?: string
  generatedAt: string
} & CinematicOutputs
