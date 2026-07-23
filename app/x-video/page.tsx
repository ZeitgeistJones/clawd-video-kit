'use client'

import { useState } from 'react'

type GenerationResult = {
  statusId: string
  handle: string
  postTitle: string
  postUrl: string
  isArticle: boolean
  title: string
  sourceDoc: string
  description: string
  thumbnailPrompts: string[]
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
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
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
          }}
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre style={{
        padding: '14px',
        fontSize: 12,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        color: 'var(--text)',
        margin: 0,
      }}>
        {content}
      </pre>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '10px 12px',
  color: 'var(--text)',
  fontSize: 12,
  fontFamily: 'var(--font)',
}

export default function XVideoPage() {
  const [postUrl, setPostUrl] = useState('')
  const [authorContext, setAuthorContext] = useState('')
  const [direction, setDirection] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/x-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl, authorContext, direction }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Generation failed')
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content" style={{ maxWidth: 800 }}>
      <div>
        <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>X write-up → video</h1>
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          Paste an X post or article URL, optionally paste author context (e.g. from Grok on their profile), generate source doc + description + thumbnail prompts.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="https://x.com/handle/status/123..."
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
          style={inputStyle}
        />
        <textarea
          placeholder="Author context — paste notes from Grok / their profile / your research (optional)"
          value={authorContext}
          onChange={(e) => setAuthorContext(e.target.value)}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <textarea
          placeholder="Video direction / angle (optional)"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !postUrl.trim()}
          className="btn-scan"
          style={{ alignSelf: 'flex-start', padding: '8px 16px' }}
        >
          {loading ? 'generating...' : 'generate'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            @{result.handle}/{result.statusId}
            {result.isArticle ? ' · article' : ' · post'}
            {result.postTitle ? `: ${result.postTitle}` : ''}
          </p>
          <CopyBlock label="title" content={result.title} />
          <CopyBlock label="source doc" content={result.sourceDoc} />
          <CopyBlock label="description" content={result.description} />
          <CopyBlock
            label="thumbnail prompts"
            content={result.thumbnailPrompts?.join('\n\n') || ''}
          />
        </div>
      )}
    </div>
  )
}
