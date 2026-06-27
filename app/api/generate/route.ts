import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { STYLE_BIBLE, META_RESEARCH_HOOK } from '@/data/style-bible'

const anthropic = new Anthropic()

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { packed, repoName, repoUrl, includeMetaHook, previousVideoDescription, extraContext } = await req.json()

    const metaSection = includeMetaHook ? `\n\n${META_RESEARCH_HOOK}` : ''

    const previousContext = previousVideoDescription
      ? `\n\nPREVIOUS VIDEO CONTEXT (episode continuity — reference this as prior coverage, don't repeat it):\n${previousVideoDescription}`
      : ''

    const extraSection = extraContext
      ? `\n\nEXTRA CONTEXT FROM CREATOR (not in the repo — factor this in):\n${extraContext}`
      : ''

    const prompt = `You are generating a NotebookLM source document, a YouTube description, and a thumbnail prompt for a video about the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude". Never confuse it with Anthropic's Claude AI.

${STYLE_BIBLE}${metaSection}${previousContext}${extraSection}

Here is the packed repo content:
${packed}

Generate THREE outputs:

---NOTEBOOKLM DOC---
A flowing narrative script for NotebookLM — NOT a structured document with labeled sections or chapter headers. Write it as one continuous piece that a chill, hyped narrator would deliver naturally. It should feel like a knowledgeable friend explaining something exciting, not a school presentation.

The narrative must naturally weave in these beats (without labeling them):
- Hook: open with something surprising or punchy about why this repo exists — assume the viewer already knows clawd
- Why it was built: what gap or problem motivated this?
- What it does: plain english with good analogies, no jargon walls
- Why it matters for clawd holders: concrete reason this strengthens the ecosystem or investment thesis
- The build: acknowledge the speed and quality, don't make humans the bottleneck
- Close with the full mandatory disclaimer sequence from the production notes

Tone throughout: chill, bro energy. Casual language. Genuinely excited. Never sterile or chapter-by-chapter.

---YOUTUBE DESCRIPTION---
A YouTube video description in the voice of an enthusiastic clawd community member. Include:
- 2-3 sentence summary of what the video covers
- The GitHub repo URL: ${repoUrl}
- A note to check official links and contract address
- The standard disclaimer (not affiliated, not financial advice, DYOR)
- Keep it under 500 words

---THUMBNAIL PROMPT---
A precise, ready-to-paste image generation prompt for ChatGPT or Perplexity. The prompt should:
- Start by telling the AI that the user will attach an image of the CLAWD mascot (a red crystalline diamond/pyramid-shaped character, sometimes in a tuxedo, sometimes in other outfits — the attached image shows the specific mascot to use)
- Instruct the AI to incorporate the attached mascot as the central character
- Describe a specific creative scene, pose, and expression for the mascot that fits the repo topic and feels fun and energetic
- Suggest bold title text to overlay (short, punchy, relevant to the video)
- Describe background, color palette, and visual style — vary the style to fit the vibe (comic book, cinematic, cartoon, anime, pop art, retro, etc)
- Specify 16:9 YouTube thumbnail format, high contrast, eye-catching
- Keep it under 150 words, be specific

Return all three sections clearly separated by the ---NOTEBOOKLM DOC---, ---YOUTUBE DESCRIPTION---, and ---THUMBNAIL PROMPT--- headers.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    const parts = text.split(/---YOUTUBE DESCRIPTION---|---THUMBNAIL PROMPT---/)
    const notebookDoc = (parts[0] || '').replace('---NOTEBOOKLM DOC---', '').trim()
    const youtubeDesc = (parts[1] || '').trim()
    const thumbnailPrompt = (parts[2] || '').trim()

    return NextResponse.json({ notebookDoc, youtubeDesc, thumbnailPrompt })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
