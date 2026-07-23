export default function AboutContent() {
  const sections = [
    {
      title: 'What this is',
      items: [
        'Private production tool for the Clawd Explains YouTube channel.',
        'Scans clawdbotatg repos, finds coverage gaps, generates scripts and descriptions via Claude.',
      ],
    },
    {
      title: 'Workflow',
      items: [
        'Scan gaps → pick a repo → generate → copy outputs into NotebookLM → generate audio overview.',
        'Use the custom focus block for NotebookLM steering (duration, tone, structure).',
        'larva — paste a larv.ai forum URL for community-thread videos.',
        'x — paste an X post/article URL; optionally paste author notes from X\'s summary profile tool.',
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
        'Extra context — anything not in the repo (tweets, community context, launches).',
        'HeyGen mode — teleprompter-style single-presenter script (full/medium only).',
        'Meta-research hook, episode continuity, mascot PFP (costs 1000 CLAWD).',
      ],
    },
    {
      title: 'Outputs',
      items: [
        'NotebookLM source doc / short brief — paste as NotebookLM source.',
        'NotebookLM custom focus — paste into NotebookLM custom topic box when generating audio.',
        'YouTube description + thumbnail prompt — copy separately.',
      ],
    },
    {
      title: 'Gap report',
      items: [
        'uncovered — no matching video. stale — repo updated since last video. covered — matched.',
        'cached badge — previous generation saved; click repo to load instantly.',
      ],
    },
    {
      title: 'Regenerate',
      items: [
        'Forces a fresh Claude generation and overwrites the cached output for that repo.',
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
