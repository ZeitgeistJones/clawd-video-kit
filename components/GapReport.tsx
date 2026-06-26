'use client'

import type { GapEntry } from '@/app/page'

const STATUS_COLOR = {
  uncovered: 'var(--accent)',
  stale: 'var(--warning)',
  covered: 'var(--success)',
}

const STATUS_LABEL = {
  uncovered: 'no video',
  stale: 'stale',
  covered: 'covered',
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

type Props = {
  gaps: GapEntry[]
  onSelect: (repo: string) => void
  selected: string
}

export default function GapReport({ gaps, onSelect, selected }: Props) {
  const sorted = [...gaps].sort((a, b) => {
    if (a.status === 'covered' && b.status !== 'covered') return 1
    if (b.status === 'covered' && a.status !== 'covered') return -1
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })

  return (
    <div>
      {sorted.map((g) => (
        <button
          key={g.repoName}
          onClick={() => onSelect(g.repoName)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: selected === g.repoName ? 'rgba(224,92,58,0.08)' : 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            padding: '10px 16px',
            cursor: 'pointer',
            transition: 'background 0.1s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: selected === g.repoName ? 600 : 400 }}>
              {g.repoName}
            </span>
            <span style={{
              fontSize: 10,
              color: STATUS_COLOR[g.status],
              background: `${STATUS_COLOR[g.status]}22`,
              padding: '1px 6px',
              borderRadius: 4,
              border: `1px solid ${STATUS_COLOR[g.status]}44`,
            }}>
              {STATUS_LABEL[g.status]}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            pushed {new Date(g.repoLastPushed).toLocaleDateString()}
            {g.matchedVideo && (
              <span> · video {new Date(g.matchedVideo.publishedAt).toLocaleDateString()}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
