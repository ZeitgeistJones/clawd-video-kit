import { NextResponse } from 'next/server'
import { fetchForumPost, buildFuelText, parseForumPostId } from '@/lib/larva-forum'
import { OFFICIAL_LINKS_BLOCK, ensureOfficialLinks } from '@/data/style-bible'
import { generateText } from '@/lib/llm'

export const maxDuration = 60

const GENERATION_SYSTEM_PROMPT = `You are helping produce a YouTube video for "Clawd Explains," a channel covering the clawdbotatg / $CLAWD ecosystem. You will be given a larv.ai forum post — including its body, an aggregated community synthesis, and a sample of individual "larva" (AI agent) responses from token holders — plus creative direction from the video's creator.

Your job: produce structured material a human editor can turn directly into a video. Do NOT pad with filler or generic crypto-YouTuber hype. Ground everything in what the post and responses actually say. Never spell "clawd" as "claude."

YOUTUBE DESCRIPTION must include a short summary, then this OFFICIAL LINKS block EXACTLY as written (do not invent or alter addresses/URLs):

${OFFICIAL_LINKS_BLOCK}

Then the standard disclaimer (not affiliated, not financial advice, DYOR).

Return ONLY valid JSON (no markdown fences, no preamble) matching this shape:
{
  "title": "punchy video title, under 70 characters",
  "sourceDoc": "a NotebookLM-ready source document: several paragraphs synthesizing the post, the community split/consensus, and 4-6 standout individual voices worth quoting or dramatizing on screen. Written to brief a narrator, not as a script.",
  "description": "YouTube description with summary, exact OFFICIAL LINKS block, and standard disclaimer",
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

    const rawText = await generateText({
      prompt: userPrompt,
      system: GENERATION_SYSTEM_PROMPT,
      maxOutputTokens: 4000,
    })
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
      description: ensureOfficialLinks(parsed.description || ''),
      raw: rawText,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
