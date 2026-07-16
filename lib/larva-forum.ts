// Fetches a larv.ai forum post + its larva (AI agent) responses, and
// selects a representative subset to use as fuel for video generation.

export interface LarvaPost {
  id: number
  wallet: string
  title: string
  body: string
  cv_burned: number
  total_cv: number
  larva_triggered: boolean
  aggregated_opinion: string
  aggregated_opinion_short: string
  created_at: string
}

export interface LarvaResponse {
  wallet: string
  response: string
  created_at: string
}

export interface LarvaHumanReply {
  wallet: string
  body?: string
  [key: string]: unknown
}

export interface ForumPostData {
  post: LarvaPost
  replies: LarvaHumanReply[]
  stakes: unknown[]
  larvaResponseCount: number
  larvaPendingCount: number
  larvaResponses: LarvaResponse[]
}

const LARVA_API_BASE = 'https://larv.ai/api/forum'

export function parseForumPostId(input: string | number): number {
  if (typeof input === 'number') return input
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/forum\/(\d+)/)
  if (urlMatch) return parseInt(urlMatch[1], 10)
  const asNumber = parseInt(trimmed, 10)
  if (!isNaN(asNumber)) return asNumber
  throw new Error(`Could not parse a forum post ID from: ${input}`)
}

export async function fetchForumPost(postIdOrUrl: string | number): Promise<ForumPostData> {
  const postId = parseForumPostId(postIdOrUrl)
  const res = await fetch(`${LARVA_API_BASE}/${postId}`, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`larv.ai API returned ${res.status} for post ${postId}`)
  }

  return (await res.json()) as ForumPostData
}

export function selectRepresentativeResponses(
  responses: LarvaResponse[],
  count = 15,
): LarvaResponse[] {
  if (responses.length <= count) return responses

  const bucketCount = count
  const bucketSize = Math.ceil(responses.length / bucketCount)
  const selected: LarvaResponse[] = []

  for (let i = 0; i < bucketCount; i++) {
    const start = i * bucketSize
    const bucket = responses.slice(start, start + bucketSize)
    if (bucket.length === 0) continue
    const best = bucket.reduce((a, b) =>
      b.response.length > a.response.length ? b : a,
    )
    selected.push(best)
  }

  return selected
}

export function buildFuelText(data: ForumPostData, sampleSize = 15): string {
  const { post, larvaResponses, replies } = data
  const sampled = selectRepresentativeResponses(larvaResponses ?? [], sampleSize)
  const parts: string[] = []

  parts.push(`FORUM POST (larv.ai/forum/${post.id})`)
  parts.push(`Title: ${post.title}`)
  parts.push(`Body: ${post.body}`)
  parts.push(`CV burned: ${post.cv_burned} / ${post.total_cv}`)
  parts.push('')

  if (post.aggregated_opinion) {
    parts.push('AGGREGATED COMMUNITY SYNTHESIS:')
    parts.push(post.aggregated_opinion)
    parts.push('')
  }

  if (replies && replies.length > 0) {
    parts.push(`HUMAN REPLIES (${replies.length}):`)
    parts.push(JSON.stringify(replies, null, 2))
    parts.push('')
  }

  if (sampled.length > 0) {
    parts.push(
      `SAMPLE OF INDIVIDUAL LARVA (AI AGENT) RESPONSES (${sampled.length} of ${larvaResponses.length} total):`,
    )
    for (const r of sampled) {
      parts.push(`— ${r.wallet.slice(0, 8)}...: ${r.response}`)
    }
  }

  return parts.join('\n')
}
