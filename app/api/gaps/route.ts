import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  try {
    const { repos, videos } = await req.json()

    const filteredRepos = repos.filter((r: any) =>
      !r.name.startsWith('leftclaw-service-job')
    )

    const slimRepos = filteredRepos.map((r: any) => `- ${r.name} (pushed: ${r.pushedAt})`).join('\n')
    const slimVideos = videos.map((v: any) => `- "${v.title}" | ${v.publishedAt} | ${(v.description || '').slice(0, 150)}`).join('\n')

    const prompt = 'Analyze coverage gaps for the Clawd Explains YouTube channel.\n\nREPOS:\n' + slimRepos + '\n\nVIDEOS:\n' + slimVideos + '\n\nFor each repo classify as uncovered, stale (repo pushed 30+ days after video), or covered. Match loosely on name in title or description.\n\nReturn ONLY valid JSON: {"gaps":[{"repoName":"name","status":"uncovered","matchedVideo":null,"repoLastPushed":"ISO date","priority":"high"}]}'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    // Claude may omit repos when the list is long — merge so every repo appears
    const gapMap = new Map(
      (result.gaps || []).map((g: { repoName: string }) => [g.repoName, g]),
    )
    const gaps = filteredRepos.map((r: { name: string; pushedAt: string }) => {
      const existing = gapMap.get(r.name)
      if (existing) return existing
      return {
        repoName: r.name,
        status: 'uncovered',
        matchedVideo: null,
        repoLastPushed: r.pushedAt,
        priority: 'high',
      }
    })

    return NextResponse.json({ gaps })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
