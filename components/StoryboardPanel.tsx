'use client'

import { useState } from 'react'
import type { Duration } from '@/types/generate'
import type { ScoredScene, StoryboardScene } from '@/types/storyboard'
import BrollReviewPanel from '@/components/BrollReviewPanel'

type StoryboardPayload = {
  scenes: StoryboardScene[]
  keywords: string[]
  srt: string
  totalDuration: number
  cached?: boolean
}

type Props = {
  text: string
  repoName: string
  duration: Duration
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
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
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
          }}
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre style={{
        padding: 14,
        fontSize: 12,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        color: 'var(--text)',
        margin: 0,
        maxHeight: 280,
        overflowY: 'auto',
      }}>
        {content}
      </pre>
    </div>
  )
}

function SectionHeader({ id, title, hint }: { id: string; title: string; hint?: string }) {
  return (
    <div id={id} style={{ marginTop: 4 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--accent)',
      }}>
        {title}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{hint}</div>
      )}
    </div>
  )
}

export default function StoryboardPanel({ text, repoName, duration }: Props) {
  const [loading, setLoading] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<StoryboardPayload | null>(null)
  const [scoredScenes, setScoredScenes] = useState<ScoredScene[] | null>(null)
  const [scoreMode, setScoreMode] = useState<'mock' | 'model' | null>(null)
  const [scoredAt, setScoredAt] = useState<string | null>(null)

  async function scoreScenes(scenes: StoryboardScene[]) {
    setScoring(true)
    try {
      const res = await fetch('/api/score-broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'B-roll scoring failed')
      setScoredScenes(data.scenes)
      setScoreMode(data.mode)
      setScoredAt(data.scoredAt)
    } catch (e: any) {
      setError(e.message || 'B-roll scoring failed')
      setScoredScenes(null)
    } finally {
      setScoring(false)
    }
  }

  async function generate(force = false) {
    if (!text.trim()) {
      setError('Generate a notebook doc first')
      return
    }
    setLoading(true)
    setError('')
    setScoredScenes(null)
    setScoreMode(null)
    setScoredAt(null)
    try {
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, repoName, duration, force }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Storyboard failed')
      setResult(data)
      setLoading(false)
      await scoreScenes(data.scenes)
    } catch (e: any) {
      setError(e.message || 'Storyboard failed')
      setLoading(false)
    }
  }

  const busy = loading || scoring

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader
        id="storyboard-panel"
        title="2 · storyboard"
        hint="keywords + scenes from your script"
      />

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--accent-dim)',
        }}>
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}>
              generate storyboard
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              then auto-scores b-roll relevance
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {result && (
              <button
                onClick={() => generate(true)}
                disabled={busy || !text.trim()}
                className="btn-scan"
                style={{ opacity: 0.7 }}
              >
                {busy ? '...' : 'regen'}
              </button>
            )}
            <button
              onClick={() => generate(false)}
              disabled={busy || !text.trim()}
              className="btn-scan"
            >
              {loading
                ? 'building...'
                : scoring
                  ? 'scoring b-roll...'
                  : result
                    ? 'reload'
                    : 'generate storyboard'}
            </button>
          </div>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div className="error">{error}</div>}

          {!result && !busy && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              After you have a notebook doc (or short brief), generate scenes. B-roll scoring runs automatically next.
            </div>
          )}

          {result && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {result.scenes.length} scenes · ~{result.totalDuration}s
                {result.cached ? ' · cached storyboard' : ''}
              </div>

              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}>
                  keywords
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.keywords.map((k) => (
                    <span
                      key={k}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-muted)',
                        background: 'var(--surface-2)',
                      }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.scenes.map((scene) => (
                  <div
                    key={scene.index}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface-2)',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      marginBottom: 4,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        {scene.index + 1}. {scene.title}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        ~{scene.estimatedDuration}s
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {scene.narration.length > 160
                        ? scene.narration.slice(0, 160) + '…'
                        : scene.narration}
                    </p>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>
                      queries: {scene.searchQueries.join(' · ') || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <SectionHeader
        id="broll-section"
        title="3 · b-roll"
        hint="auto-scored picks — fix low-confidence scenes"
      />

      {scoredScenes ? (
        <BrollReviewPanel
          scenes={scoredScenes}
          mode={scoreMode || undefined}
          scoredAt={scoredAt || undefined}
          onScenesChange={setScoredScenes}
        />
      ) : (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 14,
          fontSize: 12,
          color: 'var(--text-dim)',
        }}>
          {scoring
            ? 'Scoring b-roll relevance…'
            : 'B-roll review appears here after storyboard generate + score.'}
        </div>
      )}

      <SectionHeader
        id="captions-section"
        title="4 · captions"
        hint="SRT from estimated scene timings"
      />

      {result?.srt ? (
        <CopyBlock
          label="srt"
          content={result.srt}
          note="estimated timings — not word-level accurate"
        />
      ) : (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 14,
          fontSize: 12,
          color: 'var(--text-dim)',
        }}>
          SRT export shows up after storyboard generate.
        </div>
      )}
    </div>
  )
}
