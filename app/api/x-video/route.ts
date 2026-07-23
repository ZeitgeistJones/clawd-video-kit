import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fetchXPost, buildFuelText, parseXStatusUrl } from '@/lib/x-post'

const anthropic = new Anthropic()

export const maxDuration = 60

const GENERATION_SYSTEM_PROMPT = `You are helping produce a YouTube video for "Clawd Explains," a channel covering the clawdbotatg / $CLAWD ecosystem. You will be given an X (Twitter) post or long-form X Article — plus optional author context the video creator pasted manually (e.g. notes from Grok or their own research), and optional creative direction.

Your job: produce structured material a human editor can turn directly into a video. Do NOT pad with filler or generic crypto-YouTuber hype. Ground everything in what the write-up actually says. Use author context only to situate who wrote it and their angle — never invent quotes, claims, or bio facts that are not in the provided material. Never spell "clawd" as "claude."

Return ONLY valid JSON (no markdown fences, no preamble) matching this shape:
{
  "title": "punchy video title, under 70 characters",
  "sourceDoc": "a NotebookLM-ready source document: several paragraphs synthesizing the write-up's thesis, key arguments, and why it matters for CLAWD / the ecosystem. If author context was provided, briefly situate the writer. Written to brief a narrator, not as a script.",
  "description": "YouTube description, 2-4 short paragraphs, plain-English, no jargon-as-drama. Include the source X URL naturally if useful.",
  "thumbnailPrompts": ["2-3 distinct visual thumbnail concepts, each a single descriptive sentence an image generator or designer could act on"]
}`

export async function POST(req: Request) {
  try {
    const { postUrl, authorContext, direction } = await req.json() as {
      postUrl?: string
      authorContext?: string
      direction?: string
    }

    if (!postUrl?.trim()) {
      return NextResponse.json({ error: 'postUrl is required' }, { status: 400 })
    }

    // Validate early for clearer errors
    parseXStatusUrl(postUrl)

    const post = await fetchXPost(postUrl)
    const fuelText = buildFuelText(post, authorContext, direction)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: fuelText }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed: {
      title: string
      sourceDoc: string
      description: string
      thumbnailPrompts: string[]
    }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse generation output as JSON', raw: rawText },
        { status: 502 },
      )
    }

    return NextResponse.json({
      statusId: post.statusId,
      handle: post.handle,
      postTitle: post.articleTitle || post.tweetText.slice(0, 120),
      postUrl: post.url,
      isArticle: post.isArticle,
      ...parsed,
      raw: rawText,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
