import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fetchForumPost, buildFuelText, parseForumPostId } from '@/lib/larva-forum'

const anthropic = new Anthropic()

export const maxDuration = 60

const GENERATION_SYSTEM_PROMPT = `You are helping produce a YouTube video for "Clawd Explains," a channel covering the clawdbotatg / $CLAWD ecosystem. You will be given a larv.ai forum post — including its body, an aggregated community synthesis, and a sample of individual "larva" (AI agent) responses from token holders — plus creative direction from the video's creator.

Your job: produce structured material a human editor can turn directly into a video. Do NOT pad with filler or generic crypto-YouTuber hype. Ground everything in what the post and responses actually say. Never spell "clawd" as "claude."

Return ONLY valid JSON (no markdown fences, no preamble) matching this shape:
{
  "title": "punchy video title, under 70 characters",
  "sourceDoc": "a NotebookLM-ready source document: several paragraphs synthesizing the post, the community split/consensus, and 4-6 standout individual voices worth quoting or dramatizing on screen. Written to brief a narrator, not as a script.",
  "description": "YouTube description, 2-4 short paragraphs, plain-English, no jargon-as-drama",
  "thumbnailPrompts": ["2-3 distinct single-composition thumbnail prompts — one continuous scene each, no split-screen/panels/collages, high contrast, scroll-stopping"]
}`

export async function POST(req: Request) {
  try {
    const { postUrlOrId, direction } = await req.json() as {
      postUrlOrId?: string
      direction?: string
    }

    if (!postUrlOrId) {
      return NextResponse.json({ error: 'postUrlOrId is required' }, { status: 400 })
    }

    const postId = parseForumPostId(postUrlOrId)
    const forumData = await fetchForumPost(postId)
    const fuelText = buildFuelText(forumData, 15)

    const userPrompt =
      `${fuelText}\n\n---\nCREATIVE DIRECTION FROM VIDEO CREATOR:\n` +
      (direction?.trim() || '(none provided — use your best judgment based on the post content)')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
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
      postId,
      postTitle: forumData.post.title,
      ...parsed,
      raw: rawText,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
