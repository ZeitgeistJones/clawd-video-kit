import { NextResponse } from 'next/server'

type GapEntry = {
  repoName: string
  status: 'uncovered' | 'stale' | 'covered'
  matchedVideo: { title: string; url: string; publishedAt: string } | null
  repoLastPushed: string
  priority: 'high' | 'medium' | 'low'
}

type RepoInput = { name: string; pushedAt: string }
type VideoInput = {
  id?: string
  title: string
  publishedAt: string
  description?: string
  url?: string
}

/** Free local gap analysis — no Gemini/Anthropic. Matches repo names against video titles/descriptions. */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(s: string): string[] {
  const stop = new Set([
    'clawd', 'clawdbotatg', 'the', 'a', 'an', 'and', 'or', 'of', 'to', 'for',
    'in', 'on', 'with', 'bot', 'atg', 'repo', 'app', 'api',
  ])
  return normalize(s)
    .split(' ')
    .filter((t) => t.length >= 2 && !stop.has(t))
}

function repoSearchForms(repoName: string): string[] {
  const forms = new Set<string>()
  const raw = repoName.trim()
  forms.add(normalize(raw))
  forms.add(normalize(raw.replace(/^clawd[-_]?/i, '')))
  forms.add(normalize(raw.replace(/[-_]/g, ' ')))
  // compact form without separators for titles like "OneDollarAudits"
  forms.add(normalize(raw).replace(/\s+/g, ''))
  return [...forms].filter(Boolean)
}

function scoreMatch(repoName: string, video: VideoInput): number {
  const hay = normalize(`${video.title} ${video.description || ''}`)
  const hayCompact = hay.replace(/\s+/g, '')
  const forms = repoSearchForms(repoName)
  let score = 0

  for (const form of forms) {
    if (!form) continue
    if (hay.includes(form)) score = Math.max(score, form.length >= 8 ? 10 : 7)
    if (hayCompact.includes(form.replace(/\s+/g, ''))) score = Math.max(score, 8)
  }

  // token overlap: require most meaningful tokens to appear
  const tokens = tokenize(repoName)
  if (tokens.length > 0) {
    const hits = tokens.filter((t) => hay.includes(t) || hayCompact.includes(t)).length
    const ratio = hits / tokens.length
    if (ratio >= 1) score = Math.max(score, 9)
    else if (ratio >= 0.66 && tokens.length >= 2) score = Math.max(score, 6)
    else if (ratio >= 0.5 && tokens.some((t) => t.length >= 6 && hay.includes(t))) {
      score = Math.max(score, 5)
    }
  }

  return score
}

function videoUrl(v: VideoInput): string {
  if (v.url) return v.url
  if (v.id) return `https://www.youtube.com/watch?v=${v.id}`
  return ''
}

function daysBetween(laterIso: string, earlierIso: string): number {
  const later = new Date(laterIso).getTime()
  const earlier = new Date(earlierIso).getTime()
  if (Number.isNaN(later) || Number.isNaN(earlier)) return 0
  return (later - earlier) / (1000 * 60 * 60 * 24)
}

function classifyRepo(repo: RepoInput, videos: VideoInput[]): GapEntry {
  let best: { video: VideoInput; score: number } | null = null

  for (const video of videos) {
    const score = scoreMatch(repo.name, video)
    if (score < 5) continue
    if (!best || score > best.score) best = { video, score }
  }

  if (!best) {
    return {
      repoName: repo.name,
      status: 'uncovered',
      matchedVideo: null,
      repoLastPushed: repo.pushedAt,
      priority: 'high',
    }
  }

  const stale = daysBetween(repo.pushedAt, best.video.publishedAt) >= 30
  const matchedVideo = {
    title: best.video.title,
    url: videoUrl(best.video),
    publishedAt: best.video.publishedAt,
  }

  if (stale) {
    return {
      repoName: repo.name,
      status: 'stale',
      matchedVideo,
      repoLastPushed: repo.pushedAt,
      priority: 'medium',
    }
  }

  return {
    repoName: repo.name,
    status: 'covered',
    matchedVideo,
    repoLastPushed: repo.pushedAt,
    priority: 'low',
  }
}

export async function POST(req: Request) {
  try {
    const { repos, videos } = await req.json() as {
      repos: RepoInput[]
      videos: VideoInput[]
    }

    if (!Array.isArray(repos) || !Array.isArray(videos)) {
      return NextResponse.json({ error: 'repos and videos arrays are required' }, { status: 400 })
    }

    const filteredRepos = repos.filter(
      (r) => r?.name && !r.name.startsWith('leftclaw-service-job'),
    )

    const gaps = filteredRepos.map((repo) => classifyRepo(repo, videos))

    return NextResponse.json({ gaps, engine: 'local' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
