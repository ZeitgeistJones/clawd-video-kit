import { NextResponse } from 'next/server'
import {
  STYLE_BIBLE,
  META_RESEARCH_HOOK,
  THUMBNAIL_CREATIVE_NOTES,
  OFFICIAL_LINKS_BLOCK,
  ensureOfficialLinks,
  CINEMATIC_PRODUCTION_NOTES,
  buildCinematicCustomizePaste,
} from '@/data/style-bible'
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

    const prompt = `You are generating a NotebookLM CINEMATIC Video Overview package for the clawdbotatg GitHub repo: ${repoName} (${repoUrl}).

IMPORTANT: The project is called "clawd" (rhymes with "clawed"). Never spell it "claude".
IMPORTANT: clawdbotatg builds these repos. Austin is the kill switch, not the builder.

${STYLE_BIBLE}

${CINEMATIC_PRODUCTION_NOTES}${metaSection}${previousContext}${extraSection}

Here is the packed repo content:
${packed}

Generate ALL of the following sections with the exact headers shown:

---CINEMATIC SOURCE DOC---
A flowing NotebookLM source narrative (~5–6 min spoken when filmed). Visual-beat friendly: concrete images, moments, and metaphors the Cinematic model can render. One continuous piece, no chapter headers. Include the full mandatory disclaimer sequence at the end. Clawd Explains voice — cool, specific, no Gen Z slang.

---CINEMATIC STEERING PROMPT---
A tight director brief for NotebookLM's Cinematic customize / steering field. Open by stating this must be a Cinematic immersive video (not Explainer, not Short). Cover narrative angle, tone, and what "good" looks like for this repo. Under 180 words. No markdown headers inside this section.

---SOURCE EMPHASIS---
Bullet-like short lines (plain text): what to stress, what to skip or keep brief, holder-relevant stakes. Under 120 words.

---VISUAL STYLE GUIDANCE---
Specific visual language for Cinematic generative video: palette, lighting, motion, metaphor systems, what to avoid (generic crypto neon spam, slide decks, stock talking heads). Under 120 words. This goes into the customize paste because Cinematic has no style carousel.

---RUNTIME SCOPE---
Suggested runtime window and coverage scope (what must land vs optional depth). One short paragraph.

---SCENE FOCUS NOTES---
5–8 short beat lines the model can mold toward (not timed edit cues). Visual + story pairs. Plain text list.

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

    const notebookDoc = section(text, '---CINEMATIC SOURCE DOC---', '---CINEMATIC STEERING PROMPT---')
    const steeringPrompt = section(text, '---CINEMATIC STEERING PROMPT---', '---SOURCE EMPHASIS---')
    const sourceEmphasis = section(text, '---SOURCE EMPHASIS---', '---VISUAL STYLE GUIDANCE---')
    const visualStyleGuidance = section(text, '---VISUAL STYLE GUIDANCE---', '---RUNTIME SCOPE---')
    const runtimeScope = section(text, '---RUNTIME SCOPE---', '---SCENE FOCUS NOTES---')
    const sceneFocusNotes = section(text, '---SCENE FOCUS NOTES---', '---YOUTUBE DESCRIPTION---')
    const youtubeDesc = ensureOfficialLinks(
      section(text, '---YOUTUBE DESCRIPTION---', '---THUMBNAIL PROMPT---'),
    )
    const thumbnailPrompt = section(text, '---THUMBNAIL PROMPT---')

    if (!notebookDoc || !steeringPrompt) {
      return NextResponse.json(
        { error: 'Cinematic generation incomplete — missing source doc or steering prompt', raw: text.slice(0, 500) },
        { status: 500 },
      )
    }

    const cinematicCustomizePaste = buildCinematicCustomizePaste({
      steeringPrompt,
      sourceEmphasis,
      visualStyleGuidance,
      runtimeScope,
      sceneFocusNotes,
    })

    return NextResponse.json({
      lane: 'cinematic',
      notebookDoc,
      steeringPrompt,
      sourceEmphasis,
      visualStyleGuidance,
      runtimeScope,
      sceneFocusNotes,
      cinematicCustomizePaste,
      youtubeDesc,
      thumbnailPrompt,
      mascotScene: mascotScene || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
