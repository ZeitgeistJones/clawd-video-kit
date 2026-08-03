'use client'

import { useState } from 'react'
import type { Duration, WorkflowLane } from '@/types/generate'

type Props = {
  selectedRepo: string
  onRepoChange: (repo: string) => void
  lane: WorkflowLane
  onLaneChange: (lane: WorkflowLane) => void
  duration: Duration
  onDurationChange: (duration: Duration) => void
  isHeyGen: boolean
  onHeyGenChange: (isHeyGen: boolean) => void
  onGenerate: (opts: {
    repoName: string
    lane: WorkflowLane
    includeMetaHook: boolean
    previousVideoDescription: string
    generatePfp: boolean
    extraContext: string
    duration: Duration
    isHeyGen: boolean
    thumbnailOnly?: boolean
    forceRegenerate?: boolean
  }) => void
  generating: boolean
  hasOutput: boolean
}

const LANE_OPTIONS: { value: WorkflowLane; label: string; hint: string }[] = [
  { value: 'classic', label: 'Classic', hint: 'NLM audio / doc' },
  { value: 'cinematic', label: 'Cinematic', hint: 'NLM video overview' },
  { value: 'draft', label: 'Draft', hint: 'storyboard + render' },
]

const DURATION_OPTIONS: { value: Duration; label: string; hint: string }[] = [
  { value: 'full', label: 'Full', hint: '5–6 min' },
  { value: 'medium', label: 'Medium', hint: '2–3 min' },
  { value: 'short', label: 'Short', hint: '30–45 sec' },
]

function generateButtonLabel(
  lane: WorkflowLane,
  duration: Duration,
  generating: boolean,
  thumbnailOnly: boolean,
) {
  if (generating) return 'generating...'
  if (thumbnailOnly) return '⚡ generate thumbnail + prompt'
  if (lane === 'cinematic') return '⚡ generate cinematic package'
  if (lane === 'draft') return '⚡ generate script for draft'
  if (duration === 'short') return '⚡ generate short brief'
  if (duration === 'medium') return '⚡ generate medium doc'
  return '⚡ generate doc + description'
}

export default function GeneratePanel({
  selectedRepo,
  onRepoChange,
  lane,
  onLaneChange,
  duration,
  onDurationChange,
  isHeyGen,
  onHeyGenChange,
  onGenerate,
  generating,
  hasOutput,
}: Props) {
  const [includeMetaHook, setIncludeMetaHook] = useState(false)
  const [previousVideoDescription, setPreviousVideoDescription] = useState('')
  const [showPrevious, setShowPrevious] = useState(false)
  const [generatePfp, setGeneratePfp] = useState(false)
  const [thumbnailOnly, setThumbnailOnly] = useState(false)
  const [extraContext, setExtraContext] = useState('')

  function buildOpts(forceRegenerate?: boolean) {
    return {
      repoName: selectedRepo.trim(),
      lane,
      includeMetaHook: thumbnailOnly ? false : includeMetaHook,
      previousVideoDescription: thumbnailOnly ? '' : previousVideoDescription,
      generatePfp: lane === 'draft' && !thumbnailOnly ? false : generatePfp,
      extraContext,
      duration: lane === 'cinematic' && !thumbnailOnly ? 'full' as Duration : duration,
      isHeyGen: thumbnailOnly || lane !== 'classic' || duration === 'short' ? false : isHeyGen,
      thumbnailOnly,
      forceRegenerate,
    }
  }

  function handleGenerate() {
    if (!selectedRepo.trim()) return
    onGenerate(buildOpts())
  }

  function handleRegenerate() {
    if (!selectedRepo.trim()) return
    onGenerate(buildOpts(true))
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
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
          lane
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onLaneChange(opt.value)}
              style={{
                flex: 1,
                background: lane === opt.value ? 'var(--accent-dim)' : 'var(--surface-2)',
                color: lane === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${lane === opt.value ? 'var(--accent)' : 'var(--border-strong)'}`,
                borderRadius: 'var(--radius)',
                padding: '8px 6px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontWeight: 600 }}>{opt.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{opt.hint}</div>
            </button>
          ))}
        </div>
        {lane === 'cinematic' && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5 }}>
            Dual source: download <strong style={{ color: 'var(--text-muted)' }}>repo pack</strong>,{' '}
            <strong style={{ color: 'var(--text-muted)' }}>emphasis</strong>, and{' '}
            <strong style={{ color: 'var(--text-muted)' }}>holder thesis</strong>, then paste the{' '}
            <strong style={{ color: 'var(--text-muted)' }}>normie customize</strong> into Studio → Video Overview → Cinematic.
          </div>
        )}
        {lane === 'draft' && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5 }}>
            Generates a classic script, then use storyboard → b-roll → upload NotebookLM MP4 → render.
          </div>
        )}
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

      {lane === 'classic' && !thumbnailOnly && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            duration
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {DURATION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onDurationChange(opt.value)
                  if (opt.value === 'short') onHeyGenChange(false)
                }}
                style={{
                  flex: 1,
                  background: duration === opt.value ? 'var(--accent-dim)' : 'var(--surface-2)',
                  color: duration === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                  border: `1px solid ${duration === opt.value ? 'var(--accent)' : 'var(--border-strong)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '8px 6px',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{opt.hint}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {thumbnailOnly && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            thumbnail format
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { value: 'full' as Duration, label: '16:9', hint: 'longform' },
              { value: 'short' as Duration, label: '9:16', hint: 'shorts' },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onDurationChange(opt.value)}
                style={{
                  flex: 1,
                  background: duration === opt.value || (opt.value === 'full' && duration === 'medium')
                    ? 'var(--accent-dim)'
                    : 'var(--surface-2)',
                  color: duration === opt.value || (opt.value === 'full' && duration === 'medium')
                    ? 'var(--accent)'
                    : 'var(--text-muted)',
                  border: `1px solid ${
                    duration === opt.value || (opt.value === 'full' && duration === 'medium')
                      ? 'var(--accent)'
                      : 'var(--border-strong)'
                  }`,
                  borderRadius: 'var(--radius)',
                  padding: '8px 6px',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{opt.hint}</div>
              </button>
            ))}
          </div>
        </div>
      )}

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
            checked={thumbnailOnly}
            onChange={e => setThumbnailOnly(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            thumbnail only <span style={{ color: 'var(--text-dim)' }}>(prompt + optional mascot — skips scripts/docs)</span>
          </span>
        </label>

        {lane === 'classic' && !thumbnailOnly && (
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: duration === 'short' ? 'not-allowed' : 'pointer',
          opacity: duration === 'short' ? 0.4 : 1,
        }}>
          <input
            type="checkbox"
            checked={isHeyGen && duration !== 'short'}
            disabled={duration === 'short'}
            onChange={e => onHeyGenChange(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            HeyGen mode <span style={{ color: 'var(--text-dim)' }}>(single presenter, teleprompter style)</span>
          </span>
        </label>
        )}

        {!thumbnailOnly && (
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
        )}

        {!thumbnailOnly && (
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
        )}

        {(lane !== 'draft' || thumbnailOnly) && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={generatePfp}
            onChange={e => setGeneratePfp(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            generate LeftClaw mascot <span style={{ color: 'var(--text-dim)' }}>(burns 1000 CLAWD · locks thumbnail)</span>
          </span>
        </label>
        )}
      </div>

      {showPrevious && !thumbnailOnly && (
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

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedRepo.trim()}
          style={{
            flex: 1,
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
          {generateButtonLabel(lane, duration, generating, thumbnailOnly)}
        </button>
        {hasOutput && (
          <button
            onClick={handleRegenerate}
            disabled={generating || !selectedRepo.trim()}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              fontSize: 12,
              cursor: generating || !selectedRepo.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font)',
              whiteSpace: 'nowrap',
              opacity: generating || !selectedRepo.trim() ? 0.4 : 1,
            }}
          >
            regenerate
          </button>
        )}
        {hasOutput && lane === 'draft' && (
          <button
            type="button"
            onClick={() => {
              document.getElementById('storyboard-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              whiteSpace: 'nowrap',
            }}
          >
            ↓ storyboard
          </button>
        )}
      </div>
    </div>
  )
}
