import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { STYLE_BIBLE, META_RESEARCH_HOOK, SHORT_BRIEF_NOTES, THUMBNAIL_CREATIVE_NOTES } from '@/data/style-bible'

const anthropic = new Anthropic()

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { packed, repoName, repoUrl, includeMetaHook, previousVideoDescription, extraContext, isShort } = await req.json()

    const metaSection = includeMetaHook ? `\n\n${META_RESEARCH_HOOK}` : ''

    const previousContext = previousVideoDescription
      ? `\n\nPREVIOUS VIDEO CONTEXT (episode continuity — reference this as prior coverage, don't repeat it):\n${previousVideoDescription}`
      : ''

    const extraSection = extraContext
      ? `\n\nEXTRA CONTEXT FROM CREATOR (not in the repo — factor this in):\n${extraContext}`
      : ''

    const prompt = isShort
      ? `You are generating a tight NotebookLM short brief and a vertical thumbnail prompt for a YouTube Short about the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude". Never confuse it with Anthropic's Claude AI.

${SHORT_BRIEF_NOTES}${metaSection}${previousContext}${extraSection}

Here is the packed repo content:
${packed}

Generate TWO outputs:

---NOTEBOOKLM SHORT BRIEF---
Write ONE flowing punchy paragraph for NotebookLM to riff on in under 45 seconds. No chapter headers, no labeled sections, no disclaimer. Audience is normies who don't know clawd — write plain english anyone can follow. You may briefly mention "an AI agent named clawdbotatg" but don't explain the ecosystem. Hook in the first sentence, explain what the repo does in one understandable line, say why it's wild or impressive in one line, and close with energy that makes viewers want to click the channel to learn more. Funny, relatable, hype — not generic AI slop.

---THUMBNAIL PROMPT---
A precise, ready-to-paste image generation prompt for ChatGPT or Perplexity.

${THUMBNAIL_CREATIVE_NOTES}

The prompt should:
- Start by telling the AI that the user will attach an image of the CLAWD mascot (a red crystalline diamond/pyramid-shaped character, sometimes in a tuxedo, sometimes in other outfits — the attached image shows the specific mascot to use)
- Instruct the AI to incorporate the attached mascot as the central character
- Describe a specific creative scene, pose, and expression for the mascot that fits the repo topic — funny, energetic, attention-grabbing, not generic
- Suggest bold title text to overlay (short, punchy, relevant to the short)
- Describe background, color palette, and visual style — vary the style to fit the vibe (comic book, cinematic, cartoon, anime, pop art, retro, etc)
- Specify 9:16 vertical YouTube Shorts format
- Keep it under 150 words, be specific — no vague or stock-photo aesthetics

Return both sections clearly separated by the ---NOTEBOOKLM SHORT BRIEF--- and ---THUMBNAIL PROMPT--- headers.`
      : `You are generating a NotebookLM source document, a YouTube description, and a thumbnail prompt for a video about the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude". Never confuse it with Anthropic's Claude AI.

${STYLE_BIBLE}${metaSection}${previousContext}${extraSection}

Here is the packed repo content:
${packed}

Generate THREE outputs:

---NOTEBOOKLM DOC---
A flowing narrative script for NotebookLM — NOT a structured document with labeled sections or chapter headers. Write it as one continuous piece that a chill, hyped, funny, relatable narrator would deliver naturally. It should feel like a knowledgeable friend explaining something exciting, not a school presentation or AI-generated explainer.

Follow the attention & authenticity rules: hook fast, lead with the most attention-grabbing angles, no generic filler or template cadence.

The narrative must naturally weave in these beats (without labeling them):
- Hook: open immediately with something surprising or punchy — assume the viewer already knows clawd
- Why it was built: what gap or problem motivated this?
- What it does: plain english with good analogies, no jargon walls
- Why it matters for clawd holders: concrete reason this strengthens the ecosystem or investment thesis
- The build: acknowledge the speed and quality, don't make humans the bottleneck
- Close with the full mandatory disclaimer sequence from the production notes

Tone throughout: chill, bro energy. Casual language. Genuinely excited. Personable and specific — never sterile, never generic AI slop.

---YOUTUBE DESCRIPTION---
A YouTube video description in the voice of an enthusiastic, relatable clawd community member — not generic marketing copy. Include:
- 2-3 sentence summary of what the video covers
- The GitHub repo URL: ${repoUrl}
- A note to check official links and contract address
- The standard disclaimer (not affiliated, not financial advice, DYOR)
- Keep it under 500 words

---THUMBNAIL PROMPT---
A precise, ready-to-paste image generation prompt for ChatGPT or Perplexity.

${THUMBNAIL_CREATIVE_NOTES}

The prompt should:
- Start by telling the AI that the user will attach an image of the CLAWD mascot (a red crystalline diamond/pyramid-shaped character, sometimes in a tuxedo, sometimes in other outfits — the attached image shows the specific mascot to use)
- Instruct the AI to incorporate the attached mascot as the central character
- Describe a specific creative scene, pose, and expression for the mascot that fits the repo topic — funny, energetic, attention-grabbing, not generic
- Suggest bold title text to overlay (short, punchy, relevant to the video)
- Describe background, color palette, and visual style — vary the style to fit the vibe (comic book, cinematic, cartoon, anime, pop art, retro, etc)
- Specify 16:9 YouTube thumbnail format
- Keep it under 150 words, be specific — no vague or stock-photo aesthetics

Return all three sections clearly separated by the ---NOTEBOOKLM DOC---, ---YOUTUBE DESCRIPTION---, and ---THUMBNAIL PROMPT--- headers.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    if (isShort) {
      const parts = text.split(/---THUMBNAIL PROMPT---/)
      const shortBrief = (parts[0] || '').replace('---NOTEBOOKLM SHORT BRIEF---', '').trim()
      const thumbnailPrompt = (parts[1] || '').trim()
      return NextResponse.json({ shortBrief, thumbnailPrompt })
    }

    const parts = text.split(/---YOUTUBE DESCRIPTION---|---THUMBNAIL PROMPT---/)
    const notebookDoc = (parts[0] || '').replace('---NOTEBOOKLM DOC---', '').trim()
    const youtubeDesc = (parts[1] || '').trim()
    const thumbnailPrompt = (parts[2] || '').trim()

    return NextResponse.json({ notebookDoc, youtubeDesc, thumbnailPrompt })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
