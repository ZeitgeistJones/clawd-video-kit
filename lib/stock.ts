import { env } from '@/lib/env'

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

const DEFAULT_PER_PAGE = 8

function scoreAsset(a: Omit<Asset, 'score'>, query: string): number {
  let score = 0
  // Prefer video for B-roll pipelines
  if (a.kind === 'video') score += 3
  // Prefer landscape-ish
  if (a.width && a.height && a.width >= a.height) score += 2
  // Prefer longer clips (3–20s sweet spot)
  if (a.duration != null) {
    if (a.duration >= 3 && a.duration <= 20) score += 2
    else if (a.duration > 20) score += 1
  }
  // Slight provider diversity nudge — pexels first when tied
  if (a.provider === 'pexels') score += 0.5
  // Query length specificity
  score += Math.min(query.split(/\s+/).length, 4) * 0.1
  return score
}

function dedupeAssets(assets: Asset[]): Asset[] {
  const seen = new Set<string>()
  const out: Asset[] = []
  for (const a of assets) {
    const key = `${a.provider}:${a.kind}:${a.url}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  return out
}

function rankAssets(assets: Asset[]): Asset[] {
  return [...assets].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}

export async function searchPexelsImages(query: string, perPage = DEFAULT_PER_PAGE): Promise<Asset[]> {
  const key = env.pexelsApiKey()
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: key } })
  if (!res.ok) {
    throw new Error(`Pexels images error: HTTP ${res.status}`)
  }
  const data = await res.json() as {
    photos?: Array<{
      id: number
      width: number
      height: number
      src?: { large?: string; medium?: string; original?: string }
      photographer?: string
    }>
  }

  return (data.photos || []).map((p) => {
    const base: Omit<Asset, 'score'> = {
      id: `pexels-img-${p.id}`,
      provider: 'pexels',
      kind: 'image',
      url: p.src?.large || p.src?.original || p.src?.medium || '',
      thumbUrl: p.src?.medium || p.src?.large,
      width: p.width,
      height: p.height,
      creator: p.photographer,
      query,
    }
    return { ...base, score: scoreAsset(base, query) }
  }).filter((a) => a.url)
}

export async function searchPexelsVideos(query: string, perPage = DEFAULT_PER_PAGE): Promise<Asset[]> {
  const key = env.pexelsApiKey()
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: key } })
  if (!res.ok) {
    throw new Error(`Pexels videos error: HTTP ${res.status}`)
  }
  const data = await res.json() as {
    videos?: Array<{
      id: number
      width: number
      height: number
      duration: number
      user?: { name?: string }
      image?: string
      video_files?: Array<{ link: string; width: number; height: number; quality?: string }>
    }>
  }

  return (data.videos || []).map((v) => {
    const files = [...(v.video_files || [])].sort((a, b) => (b.width || 0) - (a.width || 0))
    // Prefer HD-ish without grabbing the absolute largest
    const file = files.find((f) => f.width >= 1280 && f.width <= 1920) || files[0]
    const base: Omit<Asset, 'score'> = {
      id: `pexels-vid-${v.id}`,
      provider: 'pexels',
      kind: 'video',
      url: file?.link || '',
      thumbUrl: v.image,
      width: file?.width || v.width,
      height: file?.height || v.height,
      duration: v.duration,
      creator: v.user?.name,
      query,
    }
    return { ...base, score: scoreAsset(base, query) }
  }).filter((a) => a.url)
}

export async function searchPixabayImages(query: string, perPage = DEFAULT_PER_PAGE): Promise<Asset[]> {
  const key = env.pixabayApiKey()
  const url =
    `https://pixabay.com/api/?key=${encodeURIComponent(key)}` +
    `&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${perPage}&safesearch=true`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Pixabay images error: HTTP ${res.status}`)
  }
  const data = await res.json() as {
    hits?: Array<{
      id: number
      largeImageURL?: string
      webformatURL?: string
      previewURL?: string
      imageWidth?: number
      imageHeight?: number
      user?: string
    }>
  }

  return (data.hits || []).map((h) => {
    const base: Omit<Asset, 'score'> = {
      id: `pixabay-img-${h.id}`,
      provider: 'pixabay',
      kind: 'image',
      url: h.largeImageURL || h.webformatURL || '',
      thumbUrl: h.previewURL || h.webformatURL,
      width: h.imageWidth,
      height: h.imageHeight,
      creator: h.user,
      query,
    }
    return { ...base, score: scoreAsset(base, query) }
  }).filter((a) => a.url)
}

export async function searchPixabayVideos(query: string, perPage = DEFAULT_PER_PAGE): Promise<Asset[]> {
  const key = env.pixabayApiKey()
  const url =
    `https://pixabay.com/api/videos/?key=${encodeURIComponent(key)}` +
    `&q=${encodeURIComponent(query)}&per_page=${perPage}&safesearch=true`
  const res = await fetch(url)
  if (!res.ok) {
    // Videos endpoint may be unavailable on some keys — degrade gracefully
    if (res.status === 400 || res.status === 403 || res.status === 404) return []
    throw new Error(`Pixabay videos error: HTTP ${res.status}`)
  }
  const data = await res.json() as {
    hits?: Array<{
      id: number
      duration?: number
      user?: string
      videos?: {
        large?: { url?: string; width?: number; height?: number }
        medium?: { url?: string; width?: number; height?: number }
        small?: { url?: string; width?: number; height?: number }
        tiny?: { url?: string; width?: number; height?: number }
      }
      picture_id?: string
    }>
  }

  return (data.hits || []).map((h) => {
    const vid = h.videos?.medium || h.videos?.large || h.videos?.small || h.videos?.tiny
    const thumb = h.picture_id
      ? `https://i.vimeocdn.com/video/${h.picture_id}_295x166.jpg`
      : undefined
    const base: Omit<Asset, 'score'> = {
      id: `pixabay-vid-${h.id}`,
      provider: 'pixabay',
      kind: 'video',
      url: vid?.url || '',
      thumbUrl: thumb,
      width: vid?.width,
      height: vid?.height,
      duration: h.duration,
      creator: h.user,
      query,
    }
    return { ...base, score: scoreAsset(base, query) }
  }).filter((a) => a.url)
}

async function safeCall(fn: () => Promise<Asset[]>): Promise<Asset[]> {
  try {
    return await fn()
  } catch {
    return []
  }
}

/**
 * Search both providers for images + videos. Accepts one query or many.
 * Missing provider keys skip that provider instead of failing the whole call.
 */
export async function unifiedSearchAssets(
  queryOrQueries: string | string[],
  opts?: { perQuery?: number },
): Promise<Asset[]> {
  const queries = (Array.isArray(queryOrQueries) ? queryOrQueries : [queryOrQueries])
    .map((q) => q.trim())
    .filter(Boolean)

  if (queries.length === 0) return []

  const perPage = opts?.perQuery ?? DEFAULT_PER_PAGE
  const hasPexels = Boolean(env.optionalPexelsApiKey())
  const hasPixabay = Boolean(env.optionalPixabayApiKey())

  if (!hasPexels && !hasPixabay) {
    throw new Error('Missing stock API keys: set PEXELS_API_KEY and/or PIXABAY_API_KEY')
  }

  const batches = await Promise.all(
    queries.flatMap((query) => {
      const jobs: Array<Promise<Asset[]>> = []
      if (hasPexels) {
        jobs.push(safeCall(() => searchPexelsVideos(query, perPage)))
        jobs.push(safeCall(() => searchPexelsImages(query, perPage)))
      }
      if (hasPixabay) {
        jobs.push(safeCall(() => searchPixabayVideos(query, perPage)))
        jobs.push(safeCall(() => searchPixabayImages(query, perPage)))
      }
      return jobs
    }),
  )

  return rankAssets(dedupeAssets(batches.flat()))
}
