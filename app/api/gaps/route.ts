import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()
const BATCH_SIZE = 25

type GapEntry = {
  repoName: string
  status: 'uncovered' | 'stale' | 'covered'
  matchedVideo: { title: string; url: string; publishedAt: string } | null
  repoLastPushed: string
  priority: 'high' | 'medium' | 'low'
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size))
  }
  return batches
}

function fallbackGap(repo: { name: string; pushedAt: string }): GapEntry {
  return {
    repoName: repo.name,
    status: 'uncovered',
    matchedVideo: null,
    repoLastPushed: repo.pushedAt,
    priority: 'high',
  }
}

async function analyzeBatch(
  repos: { name: string; pushedAt: string }[],
  slimVideos: string,
): Promise<GapEntry[]> {
  const slimRepos = repos.map((r) => `- ${r.name} (pushed: ${r.pushedAt})`).join('\n')

  const prompt =
    'Analyze coverage gaps for the Clawd Explains YouTube channel.\n\n' +
    'REPOS:\n' + slimRepos + '\n\n' +
    'VIDEOS:\n' + slimVideos + '\n\n' +
    'For each repo classify as uncovered, stale (repo pushed 30+ days after video), or covered. ' +
    'Match loosely on repo name in video title or description.\n\n' +
    'Return ONLY compact JSON with one entry per repo in this batch. ' +
    'Keep matchedVideo null unless covered/stale. Example:\n' +
    '{"gaps":[{"repoName":"name","status":"uncovered","matchedVideo":null,"repoLastPushed":"ISO","priority":"high"}]}'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    const result = JSON.parse(clean)
    const gapMap = new Map(
      (result.gaps || []).map((g: GapEntry) => [g.repoName, g]),
    )
    return repos.map((r) => gapMap.get(r.name) ?? fallbackGap(r))
  } catch {
    // Truncated or malformed JSON — treat batch as uncovered rather than failing the scan
    return repos.map(fallbackGap)
  }
}

export async function POST(req: Request) {
  try {
    const { repos, videos } = await req.json()

    const filteredRepos = repos.filter(
      (r: { name: string }) => !r.name.startsWith('leftclaw-service-job'),
    )

    const slimVideos = videos
      .map(
        (v: { title: string; publishedAt: string; description?: string }) =>
          `- "${v.title}" | ${v.publishedAt} | ${(v.description || '').slice(0, 80)}`,
      )
      .join('\n')

    const batches = chunk(filteredRepos, BATCH_SIZE)
    const batchResults = await Promise.all(
      batches.map((batch) => analyzeBatch(batch, slimVideos)),
    )

    const gaps = batchResults.flat()

    return NextResponse.json({ gaps })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
