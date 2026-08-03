export default function AboutContent() {
  const sections = [
    {
      title: 'What this is',
      items: [
        'Private production tool for the Clawd Explains YouTube channel.',
        'Scans clawdbotatg repos, finds coverage gaps, generates scripts and descriptions via Gemini.',
      ],
    },
    {
      title: 'Workflow',
      items: [
        'Three lanes: Classic (NLM audio/doc), Cinematic (NLM Cinematic Video Overview), Draft (storyboard → strip MP4 audio → Remotion).',
        'Classic: scan → pick repo → generate → copy source + custom focus into NotebookLM audio overview.',
        'Cinematic: download repo pack + emphasis + holder thesis → paste normie customize into Studio → Video Overview → Cinematic.',
        'larva / x — separate pages for forum and X write-up packs.',
      ],
    },
    {
      title: 'Cinematic package (multi source)',
      items: [
        'Source 1 — repo pack download (kit packer, ~80k cap) for full context.',
        'Source 2 — emphasis brief: what to prioritize; hard rule not to narrate the whole pack.',
        'Source 3 — holder thesis: why it matters to $CLAWD holders, tagged DIRECT/INDIRECT and LIVE/PLANNED/SPECULATIVE.',
        'Customize paste — Talk Normie “normie” narrator + focus + light feel (not animation tech dumps).',
        'YouTube description + thumbnail still included for publish.',
      ],
    },
    {
      title: 'Duration modes',
      items: [
        'Full (5–6 min) — complete insider doc + YouTube description.',
        'Medium (2–3 min) — condensed but complete arc, fits HeyGen free tier.',
        'Short (30–45 sec) — normie-friendly teaser, no disclaimer, vertical thumbnail.',
      ],
    },
    {
      title: 'Generate options',
      items: [
        'Thumbnail only — light README pack + thumbnail prompt (and optional LeftClaw mascot). Skips scripts/docs; keeps any existing package for that repo.',
        'Extra context — anything not in the repo (tweets, community context, launches).',
        'HeyGen mode — teleprompter-style single-presenter script (full/medium only).',
        'Meta-research hook, episode continuity, LeftClaw mascot PFP (costs 1000 CLAWD from kit wallet) — thumbnail locks to that scene; burns logged in pfp_burns for Ash Ledger.',
      ],
    },
    {
      title: 'Draft lane',
      items: [
        'Switch lane to Draft → generate script → Storyboard → B-roll → Captions → upload NotebookLM MP4 → render.',
        'MP4 upload strips audio via ffmpeg — no share-URL paste.',
        'LeftClaw PFP available on Classic / Cinematic lanes.',
      ],
    },
    {
      title: 'Outputs',
      items: [
        'NotebookLM source doc / short brief — paste as NotebookLM source.',
        'ElevenLabs script — spoken-only paste for TTS; plain language (sharp-kid clarity, no baby talk or condescension). Handy for Draft narration too.',
        'NotebookLM custom focus — paste into NotebookLM custom topic box when generating audio.',
        'YouTube description + thumbnail prompt — copy separately. Descriptions always include the canonical OFFICIAL LINKS block (contract, CoinGecko, X, website, Telegram).',
      ],
    },
    {
      title: 'Gap report',
      items: [
        'uncovered — no matching video. stale — repo updated since last video. covered — matched.',
        'Gap scan uses free local name matching (GitHub + YouTube only) — does not burn Gemini/Anthropic quota.',
        'cached badge — previous generation saved; click repo to load instantly.',
      ],
    },
    {
      title: 'Regenerate',
      items: [
        'Forces a fresh Gemini generation and overwrites the cached output for that repo.',
      ],
    },
    {
      title: 'Attribution',
      items: [
        'clawdbotatg builds and ships repos. Austin is the kill switch, not the builder.',
        'Don\'t belabor the distinction every video — just get attribution right quietly.',
      ],
    },
  ]

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        TLDR reference for things that aren&apos;t obvious from the dashboard.
      </p>
      {sections.map(section => (
        <div
          key={section.title}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <div className="panel-header">{section.title}</div>
          <ul style={{
            listStyle: 'none',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {section.items.map((item, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, paddingLeft: 12, borderLeft: '2px solid var(--border-strong)' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
