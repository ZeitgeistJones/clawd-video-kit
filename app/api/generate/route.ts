import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { STYLE_BIBLE, META_RESEARCH_HOOK } from '@/data/style-bible'

const anthropic = new Anthropic()

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { packed, repoName, repoUrl, includeMetaHook, previousVideoDescription } = await req.json()

    const metaSection = includeMetaHook ? `\n\n${META_RESEARCH_HOOK}` : ''

    const previousContext = previousVideoDescription
      ? `\n\nPREVIOUS VIDEO CONTEXT (episode continuity — reference this as prior coverage, don't repeat it):\n${previousVideoDescription}`
      : ''

    const prompt = `You are generating a NotebookLM source document and a YouTube description for a video about the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude". Never confuse it with Anthropic's Claude AI.

${STYLE_BIBLE}${metaSection}${previousContext}

Here is the packed repo content:
${packed}

Generate two outputs:

---NOTEBOOKLM DOC---
A structured source document for NotebookLM with these sections:

SEGMENT 1 — THE HOOK
A compelling "Why does this repo exist?" opening. One punchy question or surprising fact pulled from the actual repo content.

SEGMENT 2 — REPO FUNCTION & MECHANICS
What this repo does. Is it a service, a tool for other agents, or a core protocol primitive? Plain language, no jargon walls. Use analogies where helpful.

SEGMENT 3 — THE BUILD PROCESS
How it was shipped. Pipeline, speed, any audit or deployment details found in the repo. Acknowledge the autonomous nature without framing humans as the bottleneck.

SEGMENT 4 — STRATEGIC ECOSYSTEM IMPACT
How this repo strengthens the clawd moat. What dependency does it create? How does it serve the broader ecosystem?

SEGMENT 5 — CLOSING & DISCLAIMERS
Insert the full mandatory disclaimer sequence from the production notes above, word for word.

---YOUTUBE DESCRIPTION---
A YouTube video description in the voice of an enthusiastic clawd community member. Include:
- 2-3 sentence summary of what the video covers
- The GitHub repo URL: ${repoUrl}
- A note to check official links and contract address
- The standard disclaimer (not affiliated, not financial advice, DYOR)
- Keep it under 500 words

Return both sections clearly separated by the ---NOTEBOOKLM DOC--- and ---YOUTUBE DESCRIPTION--- headers.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    const notebookMatch = text.split('---YOUTUBE DESCRIPTION---')
    const notebookDoc = notebookMatch[0].replace('---NOTEBOOKLM DOC---', '').trim()
    const youtubeDesc = notebookMatch[1]?.trim() || ''

    return NextResponse.json({ notebookDoc, youtubeDesc })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
