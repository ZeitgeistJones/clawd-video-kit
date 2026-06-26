import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  try {
    const { repos, videos } = await req.json()

    // filter out leftclaw service jobs and other noise — not video subjects
    const filteredRepos = repos.filter((r: any) =>
      !r.name.startsWith('leftclaw-service-job-') &&
      !r.name.startsWith('leftclaw-service-job')
    )

    const slimRepos = filteredRepos.map((r: any) => `- ${r.name} (pushed: ${r.pushedAt})`).join('\n')
    const slimVideos = videos.map((v: any) => `- "${v.title}" | ${v.publishedAt} | ${(v.description || '').slice(0, 150)}`).join('\n')

    const prompt = 'Analyze coverage gaps for the Clawd Explains YouTube channel.\n\nREPOS:\n' + slimRepos + '\n\nVIDEOS:\n' + slimVideos + '\n\nFor each repo classify as uncovered, stale (repo pushed 30+ days after video), or covered. Match loosely on name in title or description.\n\nReturn ONLY valid JSON: {"gaps":[{"repoName":"name","status":"uncovered","matchedVideo":null,"repoLastPushed":"ISO date","priority":"high"}]}'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
