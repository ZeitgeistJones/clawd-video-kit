function firstDefined(...vals: Array<string | undefined>): string | undefined {
  for (const v of vals) {
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return undefined
}

function requireEnv(label: string, ...vals: Array<string | undefined>): string {
  const v = firstDefined(...vals)
  if (!v) {
    throw new Error(`Missing required env var: ${label}`)
  }
  return v
}

/**
 * Typed env helper. Accepts both conventional names and compacted aliases
 * (e.g. ANTHROPIC_API_KEY / ANTHROPICAPIKEY).
 */
export const env = {
  geminiApiKey: () =>
    requireEnv('GEMINI_API_KEY', process.env.GEMINI_API_KEY, process.env.GEMINIAPIKEY),

  anthropicApiKey: () =>
    firstDefined(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPICAPIKEY),

  githubToken: () =>
    requireEnv('GITHUB_TOKEN', process.env.GITHUB_TOKEN, process.env.GITHUBTOKEN),

  youtubeApiKey: () =>
    requireEnv('YOUTUBE_API_KEY', process.env.YOUTUBE_API_KEY, process.env.YOUTUBEAPIKEY),

  postgresUrl: () =>
    requireEnv('POSTGRES_URL', process.env.POSTGRES_URL, process.env.POSTGRESURL),

  pexelsApiKey: () =>
    requireEnv('PEXELS_API_KEY', process.env.PEXELS_API_KEY, process.env.PEXELSAPIKEY),

  pixabayApiKey: () =>
    requireEnv('PIXABAY_API_KEY', process.env.PIXABAY_API_KEY, process.env.PIXABAYAPIKEY),

  /** Optional — returns undefined instead of throwing. */
  optionalPexelsApiKey: () =>
    firstDefined(process.env.PEXELS_API_KEY, process.env.PEXELSAPIKEY),

  optionalPixabayApiKey: () =>
    firstDefined(process.env.PIXABAY_API_KEY, process.env.PIXABAYAPIKEY),

  geminiModel: () =>
    firstDefined(process.env.GEMINI_MODEL, process.env.GEMINIMODEL) || 'gemini-2.5-flash',
}
