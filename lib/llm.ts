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
  /** Ask Gemini for JSON output when possible. */
  json?: boolean
}

const RETRYABLE =
  /high demand|UNAVAILABLE|resource.exhausted|429|503|quota|overloaded|try again later/i

const MODEL_GONE = /NOT_FOUND|no longer available|is not found|invalid model/i

function fallbackModels(primary: string): string[] {
  const defaults = [
    primary,
    'gemini-3.6-flash',
    'gemini-3-flash-preview',
    'gemini-2.0-flash',
    'gemini-flash-latest',
  ]
  return [...new Set(defaults.filter(Boolean))]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function errMeta(err: any) {
  const msg = String(err?.message || err || '')
  const status =
    err?.status ||
    err?.code ||
    err?.error?.code ||
    err?.error?.status ||
    (msg.match(/\b(429|503|404)\b/) || [])[1] ||
    null
  return { msg, status }
}

function debugLog(location: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch('http://127.0.0.1:7343/ingest/1a5867e9-c2d9-483f-bd01-1924980395c6', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '2bdc0a',
    },
    body: JSON.stringify({
      sessionId: '2bdc0a',
      runId: 'post-fix',
      hypothesisId: 'F,G,H',
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}

async function generateOnce(
  model: string,
  opts: GenerateTextOptions,
): Promise<string> {
  const ai = getClient()
  const response = await ai.models.generateContent({
    model,
    contents: opts.prompt,
    config: {
      ...(opts.system ? { systemInstruction: opts.system } : {}),
      maxOutputTokens: opts.maxOutputTokens ?? 5000,
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  })

  const text = response.text?.trim()
  if (!text) {
    throw new Error('Gemini returned an empty response')
  }
  return text
}

/**
 * Shared Gemini text call for all kit generators.
 * On 503/high-demand: short retry, then failover to alternate models.
 */
export async function generateText(opts: GenerateTextOptions): Promise<string> {
  const primary = opts.model || env.geminiModel()
  const models = opts.model ? [opts.model] : fallbackModels(primary)
  let lastErr: any

  for (let mi = 0; mi < models.length; mi++) {
    const model = models[mi]
    // 2 tries per model, then switch — overloaded models rarely recover in-process.
    for (let attempt = 0; attempt < 2; attempt++) {
      debugLog('llm.ts:generateText:entry', 'gemini call start', {
        model,
        attempt,
        modelIndex: mi,
        promptLen: opts.prompt?.length || 0,
      })
      try {
        const text = await generateOnce(model, opts)
        debugLog('llm.ts:generateText:ok', 'gemini call success', {
          model,
          attempt,
          modelIndex: mi,
          textLen: text.length,
        })
        return text
      } catch (err: any) {
        lastErr = err
        const { msg, status } = errMeta(err)
        const modelGone = MODEL_GONE.test(msg) || status === 404 || status === '404'
        const retryable =
          !modelGone &&
          (RETRYABLE.test(msg) ||
            status === 503 ||
            status === 429 ||
            status === 'UNAVAILABLE' ||
            status === '503')
        debugLog('llm.ts:generateText:error', 'gemini call failed', {
          model,
          attempt,
          modelIndex: mi,
          status,
          retryable,
          modelGone,
          errMsg: msg.slice(0, 500),
          hasRetry: true,
        })
        if (modelGone) break
        if (!retryable) throw err
        if (attempt === 0) await sleep(600)
        else break // failover to next model
      }
    }
  }

  const { msg } = errMeta(lastErr)
  if (RETRYABLE.test(msg)) {
    throw new Error(
      'Gemini is overloaded right now (high demand). Tried multiple models — wait a minute and generate again.',
    )
  }
  throw lastErr
}
