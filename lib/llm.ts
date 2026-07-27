import { GoogleGenAI } from '@google/genai'
import { env } from '@/lib/env'

function getClient() {
  return new GoogleGenAI({ apiKey: env.geminiApiKey() })
}

export type GenerateTextOptions = {
  prompt: string
  system?: string
  maxOutputTokens?: number
  model?: string
}

/** Shared Gemini text call for all kit generators. */
export async function generateText(opts: GenerateTextOptions): Promise<string> {
  const ai = getClient()
  const response = await ai.models.generateContent({
    model: opts.model || env.geminiModel(),
    contents: opts.prompt,
    config: {
      ...(opts.system ? { systemInstruction: opts.system } : {}),
      maxOutputTokens: opts.maxOutputTokens ?? 5000,
    },
  })

  const text = response.text?.trim()
  if (!text) {
    throw new Error('Gemini returned an empty response')
  }
  return text
}
