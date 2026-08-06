/**
 * Local gap analysis — matches repo names against YouTube titles (strict) and
 * description GitHub URLs only. No Gemini/Anthropic.
 */
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

/** Tokens too generic to count as a solo title match. */
const GENERIC_TOKENS = new Set([
  'chat', 'web', 'live', 'test', 'services', 'service', 'client', 'research',
  'mobile', 'agent', 'agents', 'dashboard', 'console', 'tip', 'vote', 'cal',
  'computer', 'container', 'contracts', 'wallet', 'frontend', 'proxy', 'stack',
  'labs', 'idea', 'token', 'hub', 'snapshot', 'relay', 'escrow', 'audit',
  'example', 'eth', 'ai', 'video', 'coin', 'coins', 'claude', 'leftclaw',
  'summary', 'version', 'tldr', 'episode', 'stream', 'streams', 'new', 'face',
  'one', 'dollar', 'p', 'v2', 'v3', 'v4', 'guide', 'your', 'gated', 'skills',
  'obs', 'proxy', 'standalone', 'background', 'frontpage',
])

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
    'in', 'on', 'with', 'bot', 'atg', 'repo', 'app', 'api', 'your', 'my', 'me',
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
  const spaced = normalize(raw.replace(/[-_]/g, ' '))
  forms.add(spaced)
  // Sliding windows so "token-gated-chat" can match title "Gated Chat"
  const parts = spaced.split(' ').filter(Boolean)
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j <= parts.length; j++) {
      const slice = parts.slice(i, j).join(' ')
      if (slice.length >= 6) forms.add(slice)
    }
  }
  // Known title misspellings / aliases
  if (/conclave/i.test(raw)) forms.add('concave')
  if (/one[-_]?dollar[-_]?audit/i.test(raw)) {
    forms.add('1 audit')
    forms.add('one dollar audit')
  }
  if (/\bpfp\b/i.test(raw) || /[-_]pfp([-_]|$)/i.test(raw)) {
    forms.add('new face')
    forms.add('pfp')
  }
  if (/burn-me-a-coffee|incinerator/i.test(raw)) {
    forms.add('to burn or not to burn')
    forms.add('incinerator')
  }
  return [...forms].filter(Boolean)
}

/** Space-padded includes so short tokens don't match mid-word (e.g. vesting≠investing). */
function hayHasPhrase(hay: string, phrase: string): boolean {
  if (!phrase) return false
  if (phrase.includes(' ')) return (` ${hay} `).includes(` ${phrase} `) || hay.includes(phrase)
  return (` ${hay} `).includes(` ${phrase} `)
}

type ScoreResult = {
  score: number
  reasons: string[]
  source: 'title' | 'desc' | null
}

function scoreMatch(repoName: string, video: VideoInput): ScoreResult {
  const titleHay = normalize(video.title || '')
  const descRaw = video.description || ''
  const forms = repoSearchForms(repoName)
  const tokens = tokenize(repoName)
  const meaningful = tokens.filter((t) => t.length >= 4 && !GENERIC_TOKENS.has(t))

  let score = 0
  let source: 'title' | 'desc' | null = null
  const reasons: string[] = []

  const bump = (s: number, why: string, src: 'title' | 'desc') => {
    if (s > score || (s === score && src === 'title' && source !== 'title')) {
      score = s
      source = src
    }
    if (s >= 6) reasons.push(`${why}:${s}`)
  }

  // --- Title matches (primary) ---
  for (const form of forms) {
    if (form.length < 4) continue
    // Generic single-word forms ("research", "chat") cause huge false positives.
    // Multi-word forms are allowed even if parts are generic ("gated chat").
    if (!form.includes(' ') && GENERIC_TOKENS.has(form)) continue
    if (hayHasPhrase(titleHay, form)) {
      // "clawd x" matches every "Clawd x …" video — too weak.
      if (/^clawd(\s+\w{1,4})?$/.test(form)) continue
      const s = form.length >= 10 ? 12 : form.length >= 7 ? 10 : form.includes(' ') ? 9 : 8
      bump(s, `title_form:${form}`, 'title')
    }
  }

  if (meaningful.length > 0) {
    const hits = meaningful.filter((t) => hayHasPhrase(titleHay, t))
    if (hits.length === meaningful.length) {
      // Single short distinctive token needs length >= 6 (avoid guide/talk noise).
      const s = hits.length >= 2 ? 11 : hits[0].length >= 6 ? 10 : 0
      if (s > 0) bump(s, `title_meaningful:${hits.join('|')}`, 'title')
    } else if (hits.length >= 2) {
      bump(8, `title_meaningful_partial:${hits.join('|')}`, 'title')
    } else if (hits.length === 1 && hits[0].length >= 7) {
      bump(7, `title_meaningful_one:${hits[0]}`, 'title')
    }
  } else if (tokens.length === 1) {
    const t = tokens[0]
    if (!GENERIC_TOKENS.has(t) && t.length >= 5 && hayHasPhrase(titleHay, t)) {
      bump(9, `title_single:${t}`, 'title')
    }
  }

  // --- Description: GitHub repo URL only, and only if title isn't a worse unrelated hit ---
  const repoSlug = repoName.trim().toLowerCase()
  const escaped = repoSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const urlRe = new RegExp(
    `github\\.com\\/[\\w.-]+\\/${escaped}(?=[\\/#?\\s]|$)`,
    'i',
  )
  if (urlRe.test(descRaw)) {
    // Prefer desc URL matches when title already has some signal; otherwise soft credit.
    const titleSignal =
      meaningful.some((t) => hayHasPhrase(titleHay, t)) ||
      forms.some((f) => f.length >= 5 && hayHasPhrase(titleHay, f))
    bump(titleSignal ? 10 : 7, `desc_github_url:${repoSlug}`, 'desc')
  }

  return { score, reasons, source }
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

const MATCH_THRESHOLD = 7

function classifyRepo(repo: RepoInput, videos: VideoInput[]): GapEntry {
  let best: {
    video: VideoInput
    score: number
    reasons: string[]
    source: 'title' | 'desc' | null
  } | null = null

  for (const video of videos) {
    const { score, reasons, source } = scoreMatch(repo.name, video)
    if (score < MATCH_THRESHOLD) continue
    if (
      !best ||
      score > best.score ||
      (score === best.score && source === 'title' && best.source !== 'title')
    ) {
      best = { video, score, reasons, source }
    }
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

  const status = stale ? 'stale' : 'covered'
  // #region agent log
  fetch('http://127.0.0.1:7343/ingest/1a5867e9-c2d9-483f-bd01-1924980395c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2bdc0a'},body:JSON.stringify({sessionId:'2bdc0a',runId:'post-fix',hypothesisId:'A,D,E',location:'gaps/route.ts:classifyRepo',message:'repo matched as covered/stale',data:{repoName:repo.name,status,score:best.score,source:best.source,reasons:best.reasons.slice(0,5),videoTitle:best.video.title},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

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

    // #region agent log
    const covered = gaps.filter((g) => g.status === 'covered')
    const stale = gaps.filter((g) => g.status === 'stale')
    const uncovered = gaps.filter((g) => g.status === 'uncovered')
    fetch('http://127.0.0.1:7343/ingest/1a5867e9-c2d9-483f-bd01-1924980395c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2bdc0a'},body:JSON.stringify({sessionId:'2bdc0a',runId:'post-fix',hypothesisId:'A,D,E',location:'gaps/route.ts:POST',message:'gap scan summary',data:{repoCount:filteredRepos.length,videoCount:videos.length,covered:covered.length,stale:stale.length,uncovered:uncovered.length,coveredSample:covered.slice(0,25).map((g)=>({repo:g.repoName,video:g.matchedVideo?.title})),staleSample:stale.slice(0,15).map((g)=>({repo:g.repoName,video:g.matchedVideo?.title}))},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    return NextResponse.json({ gaps, engine: 'local' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
