import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fetchXPost, buildFuelText, parseXStatusUrl } from '@/lib/x-post'
import { OFFICIAL_LINKS_BLOCK, ensureOfficialLinks } from '@/data/style-bible'

const anthropic = new Anthropic()

export const maxDuration = 60

const GENERATION_SYSTEM_PROMPT = `You are helping produce a YouTube video for "Clawd Explains," a channel covering the clawdbotatg / $CLAWD ecosystem. You will be given an X (Twitter) post or long-form X Article — plus optional author context the video creator pasted manually, and optional creative direction.

AUTHOR CONTEXT SOURCE: When author context is present, it was gathered simply by using the "summary profile" tool on x.com for that account (and/or pasting related notes). In the sourceDoc and description, mention this casually and accurately once — e.g. that profile background came from X's summary profile tool — not as a dramatic research claim. Do not invent deeper diligence.

Your job: produce structured material a human editor can turn directly into a video. Do NOT pad with filler or generic crypto-YouTuber hype. Ground everything in what the write-up actually says. Use author context only to situate who wrote it and their angle — never invent quotes, claims, or bio facts that are not in the provided material. Never spell "clawd" as "claude."

SOURCE DOC must close with the full mandatory disclaimer sequence (always last):
1. This channel is not officially associated with any mentioned projects — just a community fanboi
2. This is not financial advice — do your own research (DYOR)
3. Humans and AI both make mistakes — always verify facts against the primary sources in the description
4. Check the video description for official links and the verified contract address
5. Note: the AI narrator sometimes mispronounces the token name — it rhymes with "clawed" not "clod"

YOUTUBE DESCRIPTION must include: a short summary, the source X URL, then this OFFICIAL LINKS block EXACTLY as written (do not invent or alter addresses/URLs):

${OFFICIAL_LINKS_BLOCK}

Then the standard disclaimer (not affiliated, not financial advice, DYOR). Keep prose under 500 words excluding the official links block.

THUMBNAIL RULES: each prompt is ONE single continuous scene — no split-screen, side-by-side panels, comparison layouts, labeled columns, or collages. One focal point, high contrast, scroll-stopping. Prefer incorporating the CLAWD mascot when it fits. Also weave in something recognizable from the poster/author when available (handle, name, brand like "Gem Finderz", bio vibe, or their visual palette from author context) so the thumb reads as "this person's write-up about CLAWD," not a generic CLAWD graphic. Under ~150 words each.

Return ONLY valid JSON (no markdown fences, no preamble) matching this shape:
{
  "title": "punchy video title, under 70 characters",
  "sourceDoc": "a NotebookLM-ready source document: several paragraphs synthesizing the write-up's thesis, key arguments, and why it matters for CLAWD / the ecosystem. If author context was provided, briefly situate the writer and note the summary-profile source. Written to brief a narrator, not as a script. End with the full disclaimer sequence.",
  "description": "YouTube description with summary, source URL, exact OFFICIAL LINKS block, and standard disclaimer",
  "thumbnailPrompts": ["2-3 distinct single-composition thumbnail prompts (no panels/split screens)"]
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
      description: ensureOfficialLinks(parsed.description || ''),
      raw: rawText,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
