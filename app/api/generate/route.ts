import { NextResponse } from 'next/server'
import {
  STYLE_BIBLE,
  META_RESEARCH_HOOK,
  SHORT_BRIEF_NOTES,
  MEDIUM_BRIEF_NOTES,
  HEYGEN_NOTES,
  THUMBNAIL_CREATIVE_NOTES,
  OFFICIAL_LINKS_BLOCK,
  ensureOfficialLinks,
  buildElevenLabsScriptSection,
} from '@/data/style-bible'
import { buildElevenLabsVoiceBlock } from '@/data/normieVoice'
import { generateText } from '@/lib/llm'
import {
  generateMascotScene,
  thumbnailMascotLockNotes,
  thumbnailMascotOpenNotes,
} from '@/lib/mascot-scene'
import type { Duration } from '@/types/generate'

function elevenLabsScriptSection(kind: 'full' | 'medium' | 'short') {
  return buildElevenLabsScriptSection(kind, buildElevenLabsVoiceBlock())
}

export const maxDuration = 60

function buildThumbnailSection(aspect: '16:9' | '9:16', mascotScene?: string) {
  const notes = mascotScene
    ? thumbnailMascotLockNotes(mascotScene, aspect)
    : thumbnailMascotOpenNotes(aspect)

  return `---THUMBNAIL PROMPT---
A precise, ready-to-paste image generation prompt for ChatGPT or Perplexity.

${THUMBNAIL_CREATIVE_NOTES}

${notes}`
}

function buildThumbnailOnlyPrompt(
  repoName: string,
  repoUrl: string,
  packed: string,
  aspect: '16:9' | '9:16',
  extraSection: string,
  mascotScene?: string,
) {
  const skim = packed.length > 10000 ? packed.slice(0, 10000) + '\n\n[truncated]' : packed
  return `You are writing ONLY a YouTube thumbnail image prompt for a Clawd Explains video about the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude".
Do NOT write a script, description, or NotebookLM doc — thumbnail prompt only.

Repo skim (for vibe / subject matter):
${skim}${extraSection}

Generate ONE output:

${buildThumbnailSection(aspect, mascotScene)}

Return the section with the ---THUMBNAIL PROMPT--- header. Write a ready-to-paste prompt — specific scene tied to this repo, not generic AI slop.`
}

function buildDocSection(
  isHeyGen: boolean,
  duration: 'full' | 'medium',
  mascotScene?: string,
) {
  const heygenSection = isHeyGen ? `\n\n${HEYGEN_NOTES}` : ''
  const durationNote = duration === 'medium'
    ? 'Target 2-3 minutes of spoken audio — condensed but complete, all beats present.'
    : 'Target 5-6 minutes of spoken audio.'

  return `---NOTEBOOKLM DOC---
A flowing narrative script for NotebookLM — NOT a structured document with labeled sections or chapter headers. Write it as one continuous piece that a cool, funny, relatable narrator would deliver naturally — without Gen Z slang or try-hard coolness. It should feel like a knowledgeable friend explaining something interesting, not a school presentation or AI-generated explainer.

${durationNote}

Follow the attention & authenticity rules: hook fast, lead with the most attention-grabbing angles, no generic filler or template cadence.${heygenSection}

The narrative must naturally weave in these beats (without labeling them):
- Hook: open immediately with something surprising or punchy — assume the viewer already knows clawd
- Why it was built: what gap or problem motivated this?
- What it does: plain english with good analogies, no jargon walls
- Why it matters for clawd holders: concrete reason this strengthens the ecosystem or investment thesis
- The build: acknowledge the speed and quality, don't make humans the bottleneck
- Close with the full mandatory disclaimer sequence from the production notes

Tone throughout: cool and easygoing. Casual conversational English — no "cap", "ngl", "lowkey", "bruh", or other Gen Z slang. Genuinely interested. Personable and specific — never sterile, never try-hard, never generic AI slop.

${elevenLabsScriptSection(duration)}

---YOUTUBE DESCRIPTION---
A YouTube video description in the voice of an enthusiastic, relatable clawd community member — not generic marketing copy. Include:
- 2-3 sentence summary of what the video covers
- The GitHub repo URL: {repoUrl}
- Then paste this OFFICIAL LINKS block EXACTLY as written (do not invent or alter addresses/URLs):

${OFFICIAL_LINKS_BLOCK}

- Then the standard disclaimer (not affiliated, not financial advice, DYOR)
- Keep the prose under 500 words excluding the official links block

${buildThumbnailSection('16:9', mascotScene)}`
}

function buildShortPrompt(
  repoName: string,
  repoUrl: string,
  packed: string,
  metaSection: string,
  previousContext: string,
  extraSection: string,
  mascotScene?: string,
) {
  return `You are generating a tight NotebookLM short brief and a vertical thumbnail prompt for a YouTube Short about the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude". Never confuse it with Anthropic's Claude AI.

${SHORT_BRIEF_NOTES}${metaSection}${previousContext}${extraSection}

Here is the packed repo content:
${packed}

Generate THREE outputs:

---NOTEBOOKLM SHORT BRIEF---
Write ONE flowing punchy paragraph for NotebookLM to riff on in under 45 seconds. No chapter headers, no labeled sections, no disclaimer. Audience is normies who don't know clawd — write plain english anyone can follow. You may briefly mention "an AI agent named clawdbotatg" but don't explain the ecosystem. Hook in the first sentence, explain what the repo does in one understandable line, say why it's wild or impressive in one line, and close with energy that makes viewers want to click the channel to learn more.

Sound human and personable — genuinely interested in this specific repo. Funny and relatable only when it comes naturally. No Gen Z slang, no forced jokes or analogies. NOT a presenter, NOT generic AI hype.

${elevenLabsScriptSection('short')}

${buildThumbnailSection('9:16', mascotScene)}

Return all sections clearly separated by the ---NOTEBOOKLM SHORT BRIEF---, ---ELEVENLABS SCRIPT---, and ---THUMBNAIL PROMPT--- headers.`
}

function buildDocPrompt(
  repoName: string,
  repoUrl: string,
  packed: string,
  duration: 'full' | 'medium',
  isHeyGen: boolean,
  metaSection: string,
  previousContext: string,
  extraSection: string,
  mascotScene?: string,
) {
  const durationNotes = duration === 'medium' ? `\n\n${MEDIUM_BRIEF_NOTES}` : ''
  const docSection = buildDocSection(isHeyGen, duration, mascotScene).replace('{repoUrl}', repoUrl)

  return `You are generating a NotebookLM source document, an ElevenLabs spoken script, a YouTube description, and a thumbnail prompt for a video about the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude". Never confuse it with Anthropic's Claude AI.
IMPORTANT: clawdbotatg builds these repos. Austin is the kill switch, not the builder — don't attribute builds to Austin, and don't explain this distinction unless it's naturally relevant.

${STYLE_BIBLE}${durationNotes}${metaSection}${previousContext}${extraSection}

Here is the packed repo content:
${packed}

Generate FOUR outputs:

${docSection}

Return all sections clearly separated by the ---NOTEBOOKLM DOC---, ---ELEVENLABS SCRIPT---, ---YOUTUBE DESCRIPTION---, and ---THUMBNAIL PROMPT--- headers.`
}

export async function POST(req: Request) {
  try {
    const {
      packed,
      repoName,
      repoUrl,
      includeMetaHook,
      previousVideoDescription,
      extraContext,
      duration = 'full',
      isHeyGen = false,
      thumbnailOnly = false,
      mascotScene: providedScene,
      lockMascot = false,
    } = await req.json()

    const metaSection = includeMetaHook ? `\n\n${META_RESEARCH_HOOK}` : ''

    const previousContext = previousVideoDescription
      ? `\n\nPREVIOUS VIDEO CONTEXT (episode continuity — reference this as prior coverage, don't repeat it):\n${previousVideoDescription}`
      : ''

    const extraSection = extraContext
      ? `\n\nEXTRA CONTEXT FROM CREATOR (not in the repo — factor this in):\n${extraContext}`
      : ''

    let mascotScene =
      typeof providedScene === 'string' && providedScene.trim()
        ? providedScene.trim()
        : undefined

    // When LeftClaw PFP will be generated (or aligned), lock one shared scene first.
    if (!mascotScene && lockMascot) {
      mascotScene = await generateMascotScene(repoName, packed || '')
    }

    const dur = duration as Duration
    const aspect: '16:9' | '9:16' = dur === 'short' ? '9:16' : '16:9'

    if (thumbnailOnly) {
      const prompt = buildThumbnailOnlyPrompt(
        repoName,
        repoUrl,
        packed || '',
        aspect,
        extraSection,
        mascotScene,
      )
      const text = await generateText({
        prompt,
        maxOutputTokens: 1200,
      })
      const thumbnailPrompt = text.replace('---THUMBNAIL PROMPT---', '').trim()
      return NextResponse.json({
        thumbnailOnly: true,
        thumbnailPrompt,
        mascotScene: mascotScene || null,
      })
    }

    const prompt = dur === 'short'
      ? buildShortPrompt(repoName, repoUrl, packed, metaSection, previousContext, extraSection, mascotScene)
      : buildDocPrompt(repoName, repoUrl, packed, dur, isHeyGen, metaSection, previousContext, extraSection, mascotScene)

    const text = await generateText({
      prompt,
      maxOutputTokens: 6500,
    })

    if (dur === 'short') {
      const chunks = text.split(/---ELEVENLABS SCRIPT---|---THUMBNAIL PROMPT---/)
      const shortBrief = (chunks[0] || '').replace('---NOTEBOOKLM SHORT BRIEF---', '').trim()
      const elevenLabsScript = (chunks[1] || '').trim()
      const thumbnailPrompt = (chunks[2] || '').trim()
      return NextResponse.json({
        shortBrief,
        elevenLabsScript,
        thumbnailPrompt,
        mascotScene: mascotScene || null,
      })
    }

    const parts = text.split(
      /---ELEVENLABS SCRIPT---|---YOUTUBE DESCRIPTION---|---THUMBNAIL PROMPT---/,
    )
    const notebookDoc = (parts[0] || '').replace('---NOTEBOOKLM DOC---', '').trim()
    const elevenLabsScript = (parts[1] || '').trim()
    const youtubeDesc = ensureOfficialLinks((parts[2] || '').trim())
    const thumbnailPrompt = (parts[3] || '').trim()

    return NextResponse.json({
      notebookDoc,
      elevenLabsScript,
      youtubeDesc,
      thumbnailPrompt,
      mascotScene: mascotScene || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
