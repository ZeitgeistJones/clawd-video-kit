'use client'

import { useMemo, useState } from 'react'
import type { Asset, BrollCandidate, ScoredScene } from '@/types/storyboard'

type Props = {
  scenes: ScoredScene[]
  mode?: 'mock' | 'model'
  scoredAt?: string
  onScenesChange: (scenes: ScoredScene[]) => void
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

function CandidateThumb({
  candidate,
  selected,
  onSelect,
}: {
  candidate: BrollCandidate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={candidate.reason || candidate.query}
      style={{
        display: 'block',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 4,
        overflow: 'hidden',
        background: selected ? 'var(--accent-dim)' : 'var(--surface)',
        color: 'var(--text-muted)',
        fontSize: 10,
        minWidth: 96,
        maxWidth: 140,
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'var(--font)',
        textAlign: 'left',
      }}
    >
      {candidate.thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidate.thumbUrl}
          alt={candidate.query}
          style={{ width: '100%', height: 64, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ height: 64, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
          no thumb
        </div>
      )}
      <div style={{ padding: '4px 6px' }}>
        {selected ? 'selected' : `${candidate.provider} ${candidate.kind}`}
        {' · '}
        {pct(candidate.relevanceScore)}
      </div>
    </button>
  )
}

function toAsset(c: BrollCandidate): Asset {
  return {
    id: c.id,
    provider: c.provider,
    kind: c.kind,
    url: c.url,
    thumbUrl: c.thumbUrl,
    width: c.width,
    height: c.height,
    duration: c.duration,
    creator: c.creator,
    query: c.query,
    score: c.score,
  }
}

export default function BrollReviewPanel({ scenes, mode, scoredAt, onScenesChange }: Props) {
  const [showAll, setShowAll] = useState(false)

  const reviewCount = useMemo(
    () => scenes.filter((s) => s.needsReview).length,
    [scenes],
  )

  const visible = showAll ? scenes : scenes.filter((s) => s.needsReview)

  function selectCandidate(sceneIndex: number, candidate: BrollCandidate) {
    const next = scenes.map((scene) => {
      if (scene.index !== sceneIndex) return scene
      const ranked = [...scene.candidates].sort((a, b) => b.relevanceScore - a.relevanceScore)
      const selectedAsset = toAsset(candidate)
      const backupAssets = ranked
        .filter((c) => c.id !== candidate.id)
        .map(toAsset)
      return {
        ...scene,
        selectedAsset,
        backupAssets,
        needsReview: false,
        confidence: candidate.relevanceScore,
      }
    })
    onScenesChange(next)
  }

  return (
    <div
      id="broll-panel"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
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
        background: 'var(--surface-2)',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            b-roll review
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
            {reviewCount} need review · {scenes.length} total
            {mode ? ` · ${mode}` : ''}
            {scoredAt ? ` · scored ${new Date(scoredAt).toLocaleTimeString()}` : ''}
            {!showAll ? ' · showing needs-review only' : ' · showing all'}
          </div>
        </div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          show all scenes (with scores)
        </label>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--success)' }}>
            {scenes.length === 0
              ? 'Generate a storyboard first — scoring runs automatically after.'
              : 'All scenes look fine. Toggle “show all” to inspect scores anyway.'}
          </div>
        )}

        {visible.map((scene) => (
          <div
            key={scene.index}
            style={{
              border: `1px solid ${scene.needsReview ? 'var(--warning)' : 'var(--border)'}`,
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
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                {scene.index + 1}. {scene.title}
                {scene.needsReview && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: 10,
                    color: 'var(--warning)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    needs review
                  </span>
                )}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                confidence {pct(scene.confidence)} · ~{scene.estimatedDuration}s
              </span>
            </div>
            <p style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 8,
              lineHeight: 1.5,
            }}>
              {scene.narration.length > 180
                ? scene.narration.slice(0, 180) + '…'
                : scene.narration}
            </p>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 8 }}>
              click a thumb to select · backups included
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(scene.candidates.length > 0 ? scene.candidates : []).map((c) => (
                <CandidateThumb
                  key={c.id}
                  candidate={c}
                  selected={scene.selectedAsset?.id === c.id}
                  onSelect={() => selectCandidate(scene.index, c)}
                />
              ))}
              {scene.candidates.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>no candidates</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
