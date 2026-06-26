'use client'

import type { Draft } from '@/app/page'

type Props = {
  drafts: Draft[]
  onLoad: (draft: Draft) => void
}

export default function DraftHistory({ drafts, onLoad }: Props) {
  if (drafts.length === 0) return null

  return (
    <div className="panel">
      <div className="panel-header">
        <span>recent drafts</span>
      </div>
      {drafts.map((d, i) => (
        <button
          key={i}
          onClick={() => onLoad(d)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2 }}>{d.repoName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {new Date(d.generatedAt).toLocaleDateString()} {new Date(d.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </button>
      ))}
    </div>
  )
}
