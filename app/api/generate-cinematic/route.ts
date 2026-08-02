import { NextResponse } from 'next/server'
import {
  STYLE_BIBLE,
  META_RESEARCH_HOOK,
  THUMBNAIL_CREATIVE_NOTES,
  OFFICIAL_LINKS_BLOCK,
  ensureOfficialLinks,
  CINEMATIC_PRODUCTION_NOTES,
  CINEMATIC_EMPHASIS_RULES,
  CINEMATIC_HOLDER_THESIS_RULES,
  buildCinematicCustomizePaste,
} from '@/data/style-bible'
import { buildNormieVoiceBlockWithNoSlang } from '@/data/normieVoice'
import { generateText } from '@/lib/llm'
import {
  generateMascotScene,
  thumbnailMascotLockNotes,
  thumbnailMascotOpenNotes,
} from '@/lib/mascot-scene'

export const maxDuration = 60

function section(text: string, start: string, end?: string): string {
  const startIdx = text.indexOf(start)
  if (startIdx === -1) return ''
  const from = startIdx + start.length
  const endIdx = end ? text.indexOf(end, from) : -1
  return (endIdx === -1 ? text.slice(from) : text.slice(from, endIdx)).trim()
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
      mascotScene: providedScene,
      lockMascot = false,
    } = await req.json()

    const metaSection = includeMetaHook ? `\n\n${META_RESEARCH_HOOK}` : ''
    const previousContext = previousVideoDescription
      ? `\n\nPREVIOUS VIDEO CONTEXT (episode continuity — reference lightly, don't repeat):\n${previousVideoDescription}`
      : ''
    const extraSection = extraContext
      ? `\n\nEXTRA CONTEXT FROM CREATOR:\n${extraContext}`
      : ''

    let mascotScene =
      typeof providedScene === 'string' && providedScene.trim()
        ? providedScene.trim()
        : undefined
    if (!mascotScene && lockMascot) {
      mascotScene = await generateMascotScene(repoName, packed || '')
    }

    const thumbNotes = mascotScene
      ? thumbnailMascotLockNotes(mascotScene, '16:9')
      : thumbnailMascotOpenNotes('16:9')

    const narratorBlock = buildNormieVoiceBlockWithNoSlang()

    const prompt = `You are generating a NotebookLM CINEMATIC Video Overview package for the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude".
IMPORTANT: clawdbotatg builds these repos. Austin is the kill switch, not the builder.
IMPORTANT: Multi-source workflow — user uploads (1) FULL packed repo (2) EMPHASIS SOURCE (3) HOLDER THESIS SOURCE. You write sources 2–3 + FOCUS/FEEL. Do NOT write animation-director tech dumps (no hex colors, no RPC/CORS/VRF shot lists).

${STYLE_BIBLE}

${CINEMATIC_PRODUCTION_NOTES}${metaSection}${previousContext}${extraSection}

Here is the packed repo content (for accuracy — the user will also upload this pack as a NotebookLM source):
${packed}

Generate ALL of the following sections with the exact headers shown:

---EMPHASIS SOURCE---
A short steering companion (~400–800 words) for NotebookLM source 2 alongside the full repo pack.
Must include near the top (paraphrase OK):
${CINEMATIC_EMPHASIS_RULES}

Then: what this repo is in plain + lightly specific terms; 4–7 key parts to prioritize; what to skip in the spoken video; clawdbotatg attribution; brief disclaimer pointers.
NOT a second full technical essay. NOT a timed script. No chapter headers required — flowing prose OK.

---HOLDER THESIS SOURCE---
A dedicated NotebookLM source (~300–600 words) on why this build matters to $CLAWD / clawd holders — direct or indirect.
Must include near the top (paraphrase OK):
${CINEMATIC_HOLDER_THESIS_RULES}

Structure with clear labeled points. Every material claim must carry tags in-line, e.g. [DIRECT · LIVE], [INDIRECT · PLANNED], [INDIRECT · SPECULATIVE].
Cover: what is live today for holders (if anything), what is only adjacent/indirect, what is planned vs speculative.
If the holder link is thin, say so honestly under SPECULATIVE or as a weak-link note.
No price talk. No guaranteed outcomes. Credit builds to clawdbotatg.

---FOCUS GUIDANCE---
Plain-English FOCUS lines for the customize box (under 140 words). What to lead with, what matters for outsiders, what to skip even if it is in the repo pack.
Must include: do not walk through proxies, CORS, selectors, or file dumps.
May note holder stakes briefly and that speculative / planned points must sound speculative — not like facts.
No markdown headers inside this section. Short lines or short paragraphs OK.

---FEEL NOTES---
2–4 everyday visual feel lines for Cinematic (under 60 words). Dark, clear, modern, simple motion. Ban hex codes, glassmorphism, neon crypto spam, slide decks, talking-head stock. No architecture metaphors that require knowing code.

---YOUTUBE DESCRIPTION---
Enthusiastic community voice. 2–3 sentence summary, repo URL ${repoUrl}, then paste this OFFICIAL LINKS block EXACTLY:

${OFFICIAL_LINKS_BLOCK}

Then standard disclaimer. Under 500 words excluding the links block.

---THUMBNAIL PROMPT---
Ready-to-paste image prompt for ChatGPT/Perplexity.

${THUMBNAIL_CREATIVE_NOTES}

${thumbNotes}

Return every section with its ---HEADER--- exactly as specified.`

    const text = await generateText({
      prompt,
      maxOutputTokens: 6000,
    })

    const emphasisSource = section(text, '---EMPHASIS SOURCE---', '---HOLDER THESIS SOURCE---')
    const holderThesisSource = section(text, '---HOLDER THESIS SOURCE---', '---FOCUS GUIDANCE---')
    const focusGuidance = section(text, '---FOCUS GUIDANCE---', '---FEEL NOTES---')
    const feelNotes = section(text, '---FEEL NOTES---', '---YOUTUBE DESCRIPTION---')
    const youtubeDesc = ensureOfficialLinks(
      section(text, '---YOUTUBE DESCRIPTION---', '---THUMBNAIL PROMPT---'),
    )
    const thumbnailPrompt = section(text, '---THUMBNAIL PROMPT---')

    if (!emphasisSource || !focusGuidance || !holderThesisSource) {
      return NextResponse.json(
        {
          error:
            'Cinematic generation incomplete — missing emphasis, holder thesis, or focus guidance',
          raw: text.slice(0, 500),
        },
        { status: 500 },
      )
    }

    const cinematicCustomizePaste = buildCinematicCustomizePaste({
      narratorBlock,
      focusGuidance,
      feelNotes: feelNotes || 'Dark, clear, modern. Simple motion. Not neon crypto spam. Not slide decks.',
    })

    return NextResponse.json({
      lane: 'cinematic',
      emphasisSource,
      holderThesisSource,
      /** alias — emphasis is source 2; pack is source 1 */
      notebookDoc: emphasisSource,
      focusGuidance,
      feelNotes,
      narratorBlock,
      cinematicCustomizePaste,
      youtubeDesc,
      thumbnailPrompt,
      mascotScene: mascotScene || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
