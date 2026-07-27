'use client'

import { useState } from 'react'
import type { Duration } from '@/types/generate'
import type { Asset, StoryboardScene } from '@/types/storyboard'

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

function AssetThumb({ asset, label }: { asset: Asset; label?: string }) {
  return (
    <a
      href={asset.url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'block',
        border: '1px solid var(--border)',
        borderRadius: 4,
        overflow: 'hidden',
        background: 'var(--surface-2)',
        textDecoration: 'none',
        color: 'var(--text-muted)',
        fontSize: 10,
        minWidth: 96,
        maxWidth: 140,
      }}
    >
      {asset.thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.thumbUrl}
          alt={label || asset.query}
          style={{ width: '100%', height: 64, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ height: 64, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
          no thumb
        </div>
      )}
      <div style={{ padding: '4px 6px' }}>
        {label || `${asset.provider} ${asset.kind}`}
        {asset.duration != null ? ` · ${asset.duration}s` : ''}
      </div>
    </a>
  )
}

export default function StoryboardPanel({ text, repoName, duration }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<StoryboardPayload | null>(null)

  async function generate(force = false) {
    if (!text.trim()) {
      setError('Generate a notebook doc first')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, repoName, duration, force }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Storyboard failed')
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Storyboard failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      id="storyboard-panel"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
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
            storyboard / b-roll
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            keywords → scenes → Pexels/Pixabay → SRT · scroll here after generate
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {result && (
            <button
              onClick={() => generate(true)}
              disabled={loading || !text.trim()}
              className="btn-scan"
              style={{ opacity: 0.7 }}
            >
              {loading ? '...' : 'regen'}
            </button>
          )}
          <button
            onClick={() => generate(false)}
            disabled={loading || !text.trim()}
            className="btn-scan"
          >
            {loading ? 'building...' : result ? 'reload' : 'generate storyboard'}
          </button>
        </div>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div className="error">{error}</div>}

        {!result && !loading && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            After you have a notebook doc (or short brief), generate a scene storyboard with matched free stock assets and exportable SRT.
          </div>
        )}

        {result && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {result.scenes.length} scenes · ~{result.totalDuration}s
              {result.cached ? ' · cached' : ''}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.scenes.map((scene) => (
                <div
                  key={scene.index}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-2)',
                    padding: 12,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                      {scene.index + 1}. {scene.title}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      ~{scene.estimatedDuration}s
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    lineHeight: 1.5,
                  }}>
                    {scene.narration.length > 220
                      ? scene.narration.slice(0, 220) + '…'
                      : scene.narration}
                  </p>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 8 }}>
                    queries: {scene.searchQueries.join(' · ') || '—'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {scene.selectedAsset && (
                      <AssetThumb asset={scene.selectedAsset} label="selected" />
                    )}
                    {scene.backupAssets.map((a) => (
                      <AssetThumb key={a.id} asset={a} />
                    ))}
                    {!scene.selectedAsset && (
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        no stock match
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <CopyBlock
              label="srt"
              content={result.srt}
              note="estimated timings — not word-level accurate"
            />
          </>
        )}
      </div>
    </div>
  )
}
