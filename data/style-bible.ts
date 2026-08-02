export const STYLE_BIBLE = `
== PRODUCTION NOTES — READ BEFORE GENERATING ==

FORMAT & DURATION
- Target duration: 5-6 minutes
- Format: conversational explainer, NOT a structured lecture
- No chapter-by-chapter breakdown feel — it should flow like a friend explaining something cool, not a school presentation
- Pacing: fast and energetic — keep it moving, don't linger

AUDIENCE ASSUMPTION
- The viewer already knows what clawd is, who Austin is, what larv.ai does, and the basics of the ecosystem
- Do NOT over-explain the ecosystem — assume familiarity
- Skip the "clawd is an autonomous AI agent that builds onchain" type intros — they already know
- Get straight to what's interesting about THIS specific repo

BUILD ATTRIBUTION
- clawdbotatg is the autonomous AI agent that builds and ships these GitHub repos — default to crediting the agent for builds
- Never say Austin built, shipped, coded, or wrote the repo
- Austin is the kill switch (human oversight) — mention only if it comes up naturally, never as the builder
- Don't belabor the Austin vs clawdbotatg distinction every video — just get attribution right quietly

NARRATOR PERSONA
- Cool and easygoing — like a sharp community member who found something genuinely interesting
- Casual conversational English. No Gen Z slang checklist: never "no cap", "cap", "ngl", "lowkey", "bruh", "fr", "deadass", or similar try-hard slang
- Warm teacher energy that's still fun — educational without being sterile
- Sound genuinely interested, not like an AI reading a report or a creator performing coolness
- Peer-to-peer energy — talking TO the viewer, not AT them
- Never sound like a corporate press release or a school textbook
- Funny and personable when it lands naturally — confidence from specificity, not slang

ATTENTION & AUTHENTICITY
- Lead with whatever is most surprising, funny, or genuinely interesting about THIS repo — not a generic setup
- The hook lands fast. No warm-up paragraphs, no throat-clearing, no "today we're going to talk about..."
- Focus on the most attention-grabbing parts of the repo — don't bury the good stuff, don't pad with filler
- Avoid generic AI slop: no template rhythm, no hollow enthusiasm, no "let's dive in" / "in today's video" / "game-changer" / "revolutionary" clichés
- Specificity beats polish — a weird detail, a sharp analogy, or an honest reaction beats smooth corporate copy every time
- Write like someone in the clawd community talking to a friend who scrolled past 50 other videos today — earn their attention early

REQUIRED NARRATIVE BEATS (weave these in naturally, not as labeled sections)
- WHY WAS THIS BUILT: what problem or gap does this repo solve? what was the motivation?
- WHAT IT DOES: plain english, with good analogies
- WHY IT MATTERS FOR CLAWD HOLDERS: concrete reason this strengthens the ecosystem or the investment thesis
- THE BUILD ITSELF: acknowledge the speed and quality of the ship

FRAMING PHILOSOPHY
- Frame every development through the lens of "Infrastructure over Participant"
- clawdbotatg is the autonomous builder — credit the agent for builds and ships
- Never frame AI as making humans irrelevant or slow — AI amplifies, humans direct (Austin is the kill switch)
- Highlight the active build process and the speed at which clawdbotatg ships
- Frame the agent as a "receipt issuer" — creating durable, verifiable onchain artifacts
- Speculation about success = the agent's track record and reputation, not "a human dev did it better"

SPECULATION RULES
- Use prudent, transparent language when discussing future demand or unreleased features
- Frame potential as organic reputation-based interest, not hype
- Focus on structural value and long-term utility, not short-term price action

MANDATORY CLOSING DISCLAIMER SEQUENCE (always include, always last)
1. This channel is not officially associated with any mentioned projects — just a community fanboi
2. This is not financial advice — do your own research (DYOR)
3. Humans and AI both make mistakes — always verify facts against the primary sources in the description
4. Check the video description for official links and the verified contract address
5. Note: the AI narrator sometimes mispronounces the token name — it rhymes with "clawed" not "clod"

FORBIDDEN
- Never imply humans are slow, error-prone, or in the way of progress
- Never frame human oversight as a liability
- No labeled segments or chapter headers in the output — it should read as one flowing narrative
- No "In this video we will cover..." type intros
- No corporate or sterile language
- No Gen Z / try-hard slang: "cap", "no cap", "ngl", "lowkey", "bruh", "fr", "deadass", etc.
- Don't over-explain things the audience already knows
- No generic AI filler — if a sentence could appear in any crypto video about any project, cut it or make it specific to this repo
- Never attribute builds or ships to Austin
`.trim()

/** Paste verbatim into every YouTube description (before the disclaimer). */
export const OFFICIAL_LINKS_BLOCK = `OFFICIAL LINKS
clawd.atg.eth contract: 0x9f86db9fc6f7c9408e8fda3ff8ce4e78ac7a6b07
Crypto Ticker: CLAWD
Crypto Cashtag: $CLAWD

CoinGecko: https://www.coingecko.com/en/coins/clawd-atg-eth
Clawd's X: https://x.com/clawdbotatg
Austin's X: https://x.com/austingriffith
Website: https://clawdbotatg.eth.link/
Telegram: https://t.me/ClawdChatTGBot (token gated — need ~10M $CLAWD to join)`.trim()

/** Ensure the canonical official-links block is present in a YouTube description. */
export function ensureOfficialLinks(description: string): string {
  const trimmed = (description || '').trim()
  if (!trimmed) return OFFICIAL_LINKS_BLOCK

  if (/0x9f86db9fc6f7c9408e8fda3ff8ce4e78ac7a6b07/i.test(trimmed)) {
    return trimmed
  }

  // Insert before a DISCLAIMER heading if the model already wrote one
  const disclaimerMatch = trimmed.match(/\n(?=DISCLAIMER\b)/i)
  if (disclaimerMatch && disclaimerMatch.index != null) {
    const before = trimmed.slice(0, disclaimerMatch.index).trimEnd()
    const after = trimmed.slice(disclaimerMatch.index).trimStart()
    return `${before}\n\n${OFFICIAL_LINKS_BLOCK}\n\n${after}`
  }

  return `${trimmed}\n\n${OFFICIAL_LINKS_BLOCK}`
}

export const THUMBNAIL_CREATIVE_NOTES = `
THUMBNAIL & VISUAL CREATIVE NOTES
- Visuals must stop the scroll — bold, specific, attention-grabbing, not safe or generic
- ONE composition only: a single continuous scene with one clear focal point. Never split-screen, diptych, triptych, side-by-side panels, labeled columns, comparison grids, or collage layouts
- Avoid generic AI image slop: no vague "futuristic background", no stock-photo energy, no bland corporate aesthetics
- The scene should feel intentional, funny, or surprising — something a real creator would actually thumbnail, not a template
- Mascot should be doing something specific and expressive — a pose, reaction, or situation tied to the repo topic
- High contrast, clear focal point, strong color choices that pop at small sizes
- Prefer one short punchy text overlay max — not multiple competing captions across panels
`.trim()

export const META_RESEARCH_HOOK = `
OPTIONAL META-RESEARCH HOOK (include only if research agent was used)
- Mention early and casually that a clawd research agent dug this up
- Keep it brief — one sentence, conversational, not a formal disclosure
- Direct viewers to the description for the full report
`.trim()

export const SHORT_BRIEF_NOTES = `
== SHORT BRIEF PRODUCTION NOTES ==

FORMAT & DURATION
- Target duration: 30-45 seconds of spoken audio
- ONE flowing punchy paragraph — no chapter headers, no labeled sections
- NotebookLM hosts will riff on this in under 45 seconds
- This is a Short — every word fights for its life. Only the spiciest, most scroll-stopping beats make the cut
- NO disclaimer in the output — skip all legal/financial/DYOR closing language entirely

AUDIENCE
- Assume viewers are normies who do NOT know clawd, the token, or the ecosystem
- There is not enough time to explain what clawd is — do NOT try
- You may briefly reference "an AI agent named clawdbotatg" as the builder — one natural phrase max, enough to orient a stranger
- Write so anyone scrolling YouTube Shorts can follow along — plain english, zero jargon, zero insider assumptions

GOAL
- Make normies understand why this repo is wild and worth paying attention to
- Leave them curious enough to click the channel and watch longer videos to learn more about clawdbotatg
- Funny, relatable, personable — without try-hard slang
- This is a teaser, not a deep dive

REQUIRED BEATS (weave in naturally, unlabeled)
- Hook: land in the first sentence — immediate, surprising, scroll-stopping
- What it does: one plain-english line anyone can understand
- Why it matters: one line on why this is actually interesting or impressive — framed for outsiders, not holders

NARRATOR & ATTENTION
- Sound human — casual, personable, genuinely interested in THIS specific repo
- Funny and relatable when it comes naturally from the material — never forced. No slang checklist, no mandatory analogies, no try-hard personality bits
- No Gen Z slang ("cap", "no cap", "ngl", "lowkey", "bruh", etc.) — cool without performing cool
- Personality comes from being specific and actually into what's interesting here, not from slang or performance tricks
- Hook fast with what's actually surprising about this repo — lead with the real thing, not a gimmick
- Avoid generic AI slop and avoid sounding like a presenter or podcast host
- Natural flowing paragraph — not a robotic hook→explain→why cadence, but don't manufacture weirdness either
- Never sterile or corporate
`.trim()

export const NOTEBOOKLM_SHORT_FOCUS = `This is a YouTube Short teaser, not a full episode. Keep the audio overview under 45 seconds.

Audience: normies — plain English only, no jargon.

Structure:
- Hook in the first 3 seconds
- One line on what this repo/tool does
- One line on why it's wild or impressive
- End with curiosity — make viewers want to check the channel for the full story

Tone: casual, personable, genuinely excited — funny when it fits naturally, never forced. Sound like a real person, not a presenter or AI. No Gen Z slang. Don't cram in slang or analogies.

Optional: if NotebookLM suggests focus buttons, "Bot engineering" is usually the best fit. You can skip all of them.`

export const NOTEBOOKLM_FULL_FOCUS = `This is a full YouTube video overview, roughly 5-6 minutes of spoken audio.

Audience: clawd community members who already know what clawd is, who Austin is, and the basics of the ecosystem. Do NOT over-explain the ecosystem — get straight to what's interesting about this specific repo.

Tone: cool and easygoing — like a sharp community member explaining something interesting to a friend. Casual, genuinely engaged, never corporate, sterile, or try-hard slangy. Credit builds to clawdbotatg, not Austin — no need to explain the distinction every time.

Structure: one flowing narrative — hook fast, why it was built, what it does, why it matters for clawd holders, acknowledge the build. No chapter headers or "in this video we will cover" intros.

Always end with the full disclaimer sequence: not officially affiliated, not financial advice, DYOR, verify against primary sources, check description for official links and contract address.

Avoid generic AI slop — be specific to this repo, not template crypto copy.

Optional: if NotebookLM suggests focus buttons, pick whichever fits the repo topic best, or skip all of them.`

export const MEDIUM_BRIEF_NOTES = `
== MEDIUM BRIEF PRODUCTION NOTES ==

FORMAT & DURATION
- Target duration: 2-3 minutes of spoken audio
- Condensed but COMPLETE — hit all narrative beats, not a teaser like a Short
- ONE flowing narrative — no chapter headers, no labeled sections
- Tighter pacing than full video — keep it moving, cut filler, but don't skip the arc

AUDIENCE
- Same as full video: viewer already knows clawd and the ecosystem
- Do NOT over-explain the ecosystem — get straight to what's interesting about THIS repo

REQUIRED BEATS (weave in naturally, unlabeled)
- Hook, why it was built, what it does, why it matters for clawd holders, the build itself
- Close with the full mandatory disclaimer sequence from the production notes

TONE
- Same cool, easygoing energy as full video — casual, personable, never sterile or slangy
- Condensed, not shallow — every beat present, just less room to linger
`.trim()

export const HEYGEN_NOTES = `
== HEYGEN / TELEPROMPTER DELIVERY ==
- Single presenter talking directly to camera — NOT a two-host podcast or conversational back-and-forth
- Write for a talking head reading a teleprompter: direct address ("you"), shorter sentences, clear line breaks in the flow
- Less riffing and banter, more read-aloud script cadence — still easygoing and personable, just deliverable in one take
- Same facts and tone rules apply — no generic AI slop, no try-hard slang, just a different delivery format
`.trim()

export const NOTEBOOKLM_MEDIUM_FOCUS = `This is a medium-length YouTube video overview, roughly 2-3 minutes of spoken audio.

Audience: clawd community members who already know the ecosystem. Do NOT over-explain — get straight to what's interesting about this repo.

Structure: one flowing narrative — hook fast, why it was built, what it does, why it matters for clawd holders, acknowledge the build. No chapter headers. Condensed but complete.

Always end with the full disclaimer sequence: not officially affiliated, not financial advice, DYOR, verify against primary sources.

Tone: cool, personable, genuinely engaged — no try-hard slang. Credit builds to clawdbotatg, not Austin.

Optional: if NotebookLM suggests focus buttons, pick whichever fits the repo topic best, or skip all of them.`

/**
 * NotebookLM Cinematic Video Overview — multi-source + normie narrator customize.
 * Source 1 = full repo pack; source 2 = emphasis brief; source 3 = CLAWD holder relevance.
 * Customize paste steers the messenger only.
 */
export const CINEMATIC_PRODUCTION_NOTES = `
== NOTEBOOKLM CINEMATIC VIDEO OVERVIEW (MULTI SOURCE) ==

TARGET PRODUCT
- NotebookLM Studio → Video Overview → Format: Cinematic (English only)
- User will upload THREE sources: (1) full packed repo (2) EMPHASIS SOURCE (3) HOLDER THESIS SOURCE
- Customize / steering box steers the NARRATOR in plain English — NOT an animation shot list

EMPHASIS SOURCE (source 2 — companion to the full repo pack)
- Short steering companion (~400–800 words), NOT a second full technical essay
- Open by saying this document steers focus alongside the full repository pack
- List 4–7 key parts of the repo to prioritize (can be lightly specific)
- Hard rules for the VIDEO: plain-English narration for smart non-developers; skip deep implementation tours; use the repo pack only to stay accurate / fill gaps — never narrate the whole pack
- Credit builds to clawdbotatg; Austin is kill switch only if natural
- Brief disclaimer pointers OK (not affiliated, not financial advice, DYOR, verify sources)
- Do NOT dump hex colors, RPC/CORS/VRF tours, or architecture walkthroughs into the spoken video instructions

HOLDER THESIS SOURCE (source 3 — why this matters to $CLAWD holders)
- Dedicated NotebookLM source about holder relevance: direct vs indirect
- Every claim MUST be tagged clearly as one of: DIRECT, INDIRECT, LIVE, PLANNED, SPECULATIVE (combine tags when needed, e.g. INDIRECT + LIVE)
- DIRECT = clearly strengthens clawd / $CLAWD / clawdbotatg track record or utility in a concrete way
- INDIRECT = adjacent ecosystem / infrastructure / reputation benefit that is not a direct token utility
- LIVE = already shipped / observable in the repo or known product today
- PLANNED = stated intent or roadmap-ish, not fully live
- SPECULATIVE = inference, hope, or "could" — never present as fact
- Be honest when the link to holders is weak; say so instead of inventing thesis
- Prudent language — no price talk, no guaranteed outcomes
- ~300–600 words; structured so NotebookLM can quote the tags

CUSTOMIZE BOX (narrator only — Talk Normie "normie" / smart friend)
- NARRATOR block is provided by the host app (normie voice kit) — you generate FOCUS + FEEL only
- FOCUS: plain-English what to hit / skip for outsiders; forbid walking through proxies, CORS, selectors, file dumps even if in the pack
- FOCUS may briefly note holder stakes in plain English and that speculative points must sound speculative
- FEEL: 2–4 everyday visual lines max (dark, clear, modern) — NO hex codes, NO glassmorphism, NO animation director tech
- Never Gen Z slang; never whitepaper voice; never corporate hype
`.trim()

export const CINEMATIC_EMPHASIS_RULES = `
This file is a steering companion to the full repository pack uploaded alongside it.
Use the pack for accuracy and missing context. Do NOT turn the video into a reading of the pack.
Spoken narration must stay plain English for smart people who are not developers.
`.trim()

export const CINEMATIC_HOLDER_THESIS_RULES = `
This file explains why this build may matter to $CLAWD / clawd holders — directly or indirectly.
Tag every material point as DIRECT or INDIRECT, and as LIVE, PLANNED, or SPECULATIVE (combine as needed).
Never present speculative or planned items as if they are live facts. No price predictions.
`.trim()

export type CinematicPackageFields = {
  /** Fixed normie voice block from data/normieVoice.ts */
  narratorBlock: string
  /** Repo-specific plain-English focus lines from the model */
  focusGuidance: string
  /** Light everyday visual feel — not tech direction */
  feelNotes: string
}

/** One paste for NotebookLM Cinematic customize — narrator-first, dual-source aware. */
export function buildCinematicCustomizePaste(fields: CinematicPackageFields): string {
  return [
    'FORMAT: Cinematic Video Overview (English). Immersive storytelling video — not Explainer slides, not Short.',
    '',
    'NARRATOR',
    fields.narratorBlock.trim(),
    '',
    'FOCUS',
    fields.focusGuidance.trim(),
    '',
    'FEEL (light)',
    fields.feelNotes.trim(),
  ].join('\n')
}

/** Spoken script for ElevenLabs (or similar TTS) — clear, respectful, read-aloud ready. */
export const ELEVENLABS_SCRIPT_NOTES = `
== ELEVENLABS SPOKEN SCRIPT ==

PURPOSE
- A script meant to be read aloud by ElevenLabs (single narrator TTS)
- Viewer should feel like they actually understand — plain language, warm, clear
- Clarity bar: a sharp ~10-year-old could follow the ideas
- NOT baby talk, NOT kid references, NOT condescending — adults stay respected
- No Gen Z slang; no corporate hype; no whitepaper voice

FORM
- One continuous spoken script — no chapter headers, no markdown, no bullet lists
- Short-to-medium sentences that sound natural when spoken
- Spell out awkward abbreviations on first use in plain words
- Include a brief spoken disclaimer close (not affiliated, not financial advice, DYOR) for full/medium length; skip disclaimer for short/teaser length
- Credit builds to clawdbotatg; Austin only if natural
`.trim()

/** Prompt section for ---ELEVENLABS SCRIPT--- (Classic + Cinematic). */
export function buildElevenLabsScriptSection(
  kind: 'full' | 'medium' | 'short',
  voiceBlock: string,
): string {
  const length =
    kind === 'short'
      ? 'Target ~30–45 seconds spoken. No disclaimer.'
      : kind === 'medium'
        ? 'Target 2–3 minutes spoken. Include a brief spoken disclaimer at the end.'
        : 'Target 5–6 minutes spoken. Include a brief spoken disclaimer at the end.'

  return `---ELEVENLABS SCRIPT---
A single-narrator script ready to paste into ElevenLabs.

${ELEVENLABS_SCRIPT_NOTES}

Voice rules (follow closely):
${voiceBlock}

${length}
Write ONLY the words to be spoken — no stage directions, no headers, no bullets.`
}
