'use client'

import { useState } from 'react'

type Props = {
  notebookDoc: string
  youtubeDesc: string
  repoName: string
  onMarkCovered: (repoName: string, videoUrl: string) => void
}

function CopyBlock({ label, content }: { label: string; content: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </span>
        <button
          onClick={copy}
          style={{
            background: copied ? 'var(--success-dim)' : 'var(--accent-dim)',
            color: copied ? 'var(--success)' : 'var(--accent)',
            border: `1px solid ${copied ? 'var(--success)' : 'var(--accent)'}`,
            borderRadius: 4,
            padding: '3px 10px',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            transition: 'all 0.15s',
          }}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre style={{
        padding: '14px',
        fontSize: 12,
        lineHeight: 1.7,
        color: 'var(--text)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '400px',
        overflowY: 'auto',
        margin: 0,
      }}>
        {content}
      </pre>
    </div>
  )
}

export default function OutputPanel({ notebookDoc, youtubeDesc, repoName, onMarkCovered }: Props) {
  const [videoUrl, setVideoUrl] = useState('')
  const [marked, setMarked] = useState(false)

  function handleMark() {
    onMarkCovered(repoName, videoUrl)
    setMarked(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CopyBlock label="notebooklm source doc" content={notebookDoc} />
      <CopyBlock label="youtube description" content={youtubeDesc} />

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
          mark as published
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="youtube video url (optional)"
            style={{
              flex: 1,
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)',
              padding: '7px 12px',
              color: 'var(--text)',
              fontSize: 12,
              fontFamily: 'var(--font)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleMark}
            disabled={marked}
            style={{
              background: marked ? 'var(--success-dim)' : 'transparent',
              color: marked ? 'var(--success)' : 'var(--text-muted)',
              border: `1px solid ${marked ? 'var(--success)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius)',
              padding: '7px 16px',
              fontSize: 12,
              cursor: marked ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font)',
              whiteSpace: 'nowrap',
            }}
          >
            {marked ? '✓ marked' : 'mark covered'}
          </button>
        </div>
      </div>
    </div>
  )
}
