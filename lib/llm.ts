import { GoogleGenAI } from '@google/genai'

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  return new GoogleGenAI({ apiKey })
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
    model: opts.model || DEFAULT_MODEL,
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
