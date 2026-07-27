'use client'

import { useState } from 'react'
import { NOTEBOOKLM_SHORT_FOCUS, NOTEBOOKLM_FULL_FOCUS, NOTEBOOKLM_MEDIUM_FOCUS } from '@/data/style-bible'
import type { Duration } from '@/types/generate'
import StoryboardPanel from '@/components/StoryboardPanel'

type Props = {
  duration?: Duration
  isHeyGen?: boolean
  shortBrief?: string
  notebookDoc?: string
  youtubeDesc?: string
  thumbnailPrompt?: string
  pfpImage?: string
  pfpPrompt?: string
  repoName: string
  onMarkCovered: (repoName: string, videoUrl: string) => void
}

function CopyBlock({ label, content, note }: { label: string; content: string; note?: string }) {
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
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {label}
          </span>
          {note && <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>{note}</span>}
        </div>
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

function notebookFocusForDuration(duration?: Duration) {
  if (duration === 'short') return NOTEBOOKLM_SHORT_FOCUS
  if (duration === 'medium') return NOTEBOOKLM_MEDIUM_FOCUS
  return NOTEBOOKLM_FULL_FOCUS
}

function docNote(duration?: Duration, isHeyGen?: boolean) {
  const parts: string[] = []
  if (duration === 'medium') parts.push('targets 2–3 minutes')
  if (isHeyGen) parts.push('formatted for HeyGen — single presenter, teleprompter style')
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export default function OutputPanel({
  duration,
  isHeyGen,
  shortBrief,
  notebookDoc,
  youtubeDesc,
  thumbnailPrompt,
  pfpImage,
  pfpPrompt,
  repoName,
  onMarkCovered,
}: Props) {
  const [videoUrl, setVideoUrl] = useState('')
  const [marked, setMarked] = useState(false)

  function handleMark() {
    onMarkCovered(repoName, videoUrl)
    setMarked(true)
  }

  function downloadPfp() {
    if (!pfpImage) return
    const link = document.createElement('a')
    link.href = pfpImage.startsWith('data:') ? pfpImage : `data:image/png;base64,${pfpImage}`
    link.download = `clawd-pfp-${repoName}.png`
    link.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {duration === 'short' ? (
        shortBrief && (
          <CopyBlock
            label="notebooklm short brief"
            content={shortBrief}
            note="targets 30–45 seconds"
          />
        )
      ) : (
        <>
          {notebookDoc && (
            <CopyBlock
              label="notebooklm source doc"
              content={notebookDoc}
              note={docNote(duration, isHeyGen)}
            />
          )}
          {youtubeDesc && <CopyBlock label="youtube description" content={youtubeDesc} />}
        </>
      )}

      <CopyBlock
        label="notebooklm custom focus"
        content={notebookFocusForDuration(duration)}
        note="paste into NotebookLM's custom topic box when generating audio"
      />

      {thumbnailPrompt && (
        <CopyBlock
          label="thumbnail prompt"
          content={thumbnailPrompt}
          note={duration === 'short'
            ? '9:16 vertical — paste into ChatGPT or Perplexity with the mascot image attached'
            : 'paste into ChatGPT or Perplexity with the mascot image attached'}
        />
      )}

      {pfpImage && (
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
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                clawd mascot
              </span>
              {pfpPrompt && <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>"{pfpPrompt}"</span>}
            </div>
            <button
              onClick={downloadPfp}
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 4,
                padding: '3px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              download
            </button>
          </div>
          <div style={{ padding: 14, display: 'flex', justifyContent: 'center' }}>
            <img
              src={pfpImage.startsWith('data:') ? pfpImage : `data:image/png;base64,${pfpImage}`}
              alt="clawd mascot"
              style={{ maxWidth: 300, borderRadius: 8 }}
            />
          </div>
        </div>
      )}

      <StoryboardPanel
        text={duration === 'short' ? (shortBrief || '') : (notebookDoc || '')}
        repoName={repoName}
        duration={duration || 'full'}
      />

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
