'use client'

import { useState } from 'react'

type Props = {
  selectedRepo: string
  onRepoChange: (repo: string) => void
  onGenerate: (opts: {
    repoName: string
    includeMetaHook: boolean
    previousVideoDescription: string
    generatePfp: boolean
    extraContext: string
  }) => void
  generating: boolean
}

export default function GeneratePanel({ selectedRepo, onRepoChange, onGenerate, generating }: Props) {
  const [includeMetaHook, setIncludeMetaHook] = useState(false)
  const [previousVideoDescription, setPreviousVideoDescription] = useState('')
  const [showPrevious, setShowPrevious] = useState(false)
  const [generatePfp, setGeneratePfp] = useState(false)
  const [extraContext, setExtraContext] = useState('')

  function handleGenerate() {
    if (!selectedRepo.trim()) return
    onGenerate({
      repoName: selectedRepo.trim(),
      includeMetaHook,
      previousVideoDescription,
      generatePfp,
      extraContext,
    })
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
        generate
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          repo name
        </label>
        <input
          value={selectedRepo}
          onChange={e => onRepoChange(e.target.value)}
          placeholder="e.g. leftclaw-services"
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            color: 'var(--text)',
            fontSize: 13,
            fontFamily: 'var(--font)',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          extra context <span style={{ color: 'var(--text-dim)' }}>(optional — anything not in the repo)</span>
        </label>
        <textarea
          value={extraContext}
          onChange={e => setExtraContext(e.target.value)}
          placeholder="e.g. clawd tweeted this was built in response to X... the community was asking for this in Telegram... this connects to the upcoming launch of Y..."
          rows={3}
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            color: 'var(--text)',
            fontSize: 12,
            fontFamily: 'var(--font)',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeMetaHook}
            onChange={e => setIncludeMetaHook(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            include meta-research hook <span style={{ color: 'var(--text-dim)' }}>(clawd research agent was used)</span>
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showPrevious}
            onChange={e => setShowPrevious(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            episode continuity <span style={{ color: 'var(--text-dim)' }}>(paste previous video description)</span>
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={generatePfp}
            onChange={e => setGeneratePfp(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            generate mascot pfp <span style={{ color: 'var(--text-dim)' }}>(burns 1000 CLAWD)</span>
          </span>
        </label>
      </div>

      {showPrevious && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={previousVideoDescription}
            onChange={e => setPreviousVideoDescription(e.target.value)}
            placeholder="paste the previous video's YouTube description here..."
            rows={4}
            style={{
              width: '100%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)',
              padding: '8px 12px',
              color: 'var(--text)',
              fontSize: 12,
              fontFamily: 'var(--font)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating || !selectedRepo.trim()}
        style={{
          width: '100%',
          background: generating ? 'var(--accent-dim)' : 'var(--accent)',
          color: generating ? 'var(--accent)' : '#fff',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)',
          padding: '10px',
          fontSize: 13,
          fontWeight: 600,
          cursor: generating || !selectedRepo.trim() ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.15s',
          opacity: !selectedRepo.trim() ? 0.4 : 1,
        }}
      >
        {generating ? 'generating...' : '⚡ generate doc + description'}
      </button>
    </div>
  )
}
