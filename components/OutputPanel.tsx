'use client'

import { useState } from 'react'
import { NOTEBOOKLM_SHORT_FOCUS, NOTEBOOKLM_FULL_FOCUS, NOTEBOOKLM_MEDIUM_FOCUS } from '@/data/style-bible'
import type { Duration, WorkflowLane } from '@/types/generate'
import type { ScoredScene } from '@/types/storyboard'
import StoryboardPanel from '@/components/StoryboardPanel'
import DraftVideoPanel from '@/components/DraftVideoPanel'

type Props = {
  lane?: WorkflowLane
  showDraftPipeline?: boolean
  duration?: Duration
  isHeyGen?: boolean
  shortBrief?: string
  notebookDoc?: string
  emphasisSource?: string
  packedRepo?: string
  youtubeDesc?: string
  thumbnailPrompt?: string
  cinematicCustomizePaste?: string
  narratorBlock?: string
  focusGuidance?: string
  feelNotes?: string
  pfpImage?: string
  pfpPrompt?: string
  repoName: string
  onMarkCovered: (repoName: string, videoUrl: string) => void
}

function CopyBlock({
  label,
  content,
  note,
  downloadName,
}: {
  label: string
  content: string
  note?: string
  downloadName?: string
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadName || `${label.replace(/\s+/g, '-')}.md`
    link.click()
    URL.revokeObjectURL(url)
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
        gap: 8,
      }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {label}
          </span>
          {note && <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>{note}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {downloadName && (
            <button
              type="button"
              onClick={download}
              style={{
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-strong)',
                borderRadius: 4,
                padding: '3px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              download
            </button>
          )}
          <button
            type="button"
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

function SectionHeader({ id, title, hint }: { id?: string; title: string; hint?: string }) {
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
  lane,
  showDraftPipeline = false,
  duration,
  isHeyGen,
  shortBrief,
  notebookDoc,
  emphasisSource,
  packedRepo,
  youtubeDesc,
  thumbnailPrompt,
  cinematicCustomizePaste,
  narratorBlock,
  focusGuidance,
  feelNotes,
  pfpImage,
  pfpPrompt,
  repoName,
  onMarkCovered,
}: Props) {
  const [videoUrl, setVideoUrl] = useState('')
  const [marked, setMarked] = useState(false)
  const [scoredScenes, setScoredScenes] = useState<ScoredScene[] | null>(null)
  const isCinematic = lane === 'cinematic' || Boolean(cinematicCustomizePaste)
  const emphasis = emphasisSource || (isCinematic ? notebookDoc : undefined)

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
      <SectionHeader
        id="script-section"
        title="1 · script"
        hint={isCinematic
          ? 'Dual source: repo pack + emphasis → normie customize paste → publish'
          : 'NotebookLM doc, description, focus, thumbnail / mascot'}
      />

      {isCinematic && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 14,
          fontSize: 12,
          color: 'var(--text-dim)',
          lineHeight: 1.6,
        }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>NotebookLM checklist</div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Upload <strong style={{ color: 'var(--text-muted)' }}>repo pack (source 1)</strong></li>
            <li>Upload <strong style={{ color: 'var(--text-muted)' }}>emphasis source (source 2)</strong></li>
            <li>Studio → Video Overview → <strong style={{ color: 'var(--text-muted)' }}>Cinematic</strong> → paste customize</li>
          </ol>
        </div>
      )}

      {isCinematic ? (
        <>
          {packedRepo && (
            <CopyBlock
              label="repo pack (source 1)"
              content={packedRepo}
              note="download & upload into NotebookLM — full pack for context (~80k cap)"
              downloadName={`repomix-${repoName || 'repo'}.md`}
            />
          )}
          {emphasis && (
            <CopyBlock
              label="emphasis source (source 2)"
              content={emphasis}
              note="steering companion — what to prioritize; do not narrate the whole pack"
              downloadName={`emphasis-${repoName || 'repo'}.md`}
            />
          )}
          {cinematicCustomizePaste && (
            <CopyBlock
              label="cinematic customize paste"
              content={cinematicCustomizePaste}
              note="normie narrator + focus + feel — paste into Cinematic customize / steering"
            />
          )}
          {narratorBlock && (
            <CopyBlock
              label="narrator voice"
              content={narratorBlock}
              note="Talk Normie smart-friend block (also inside customize paste)"
            />
          )}
          {focusGuidance && (
            <CopyBlock label="focus" content={focusGuidance} note="what to hit / skip in plain English" />
          )}
          {feelNotes && (
            <CopyBlock label="feel" content={feelNotes} note="light visual mood — not tech direction" />
          )}
          {youtubeDesc && <CopyBlock label="youtube description" content={youtubeDesc} />}
        </>
      ) : duration === 'short' ? (
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
          <CopyBlock
            label="notebooklm custom focus"
            content={notebookFocusForDuration(duration)}
            note="paste into NotebookLM's custom topic box when generating audio"
          />
        </>
      )}

      {thumbnailPrompt && (
        <CopyBlock
          label="thumbnail prompt"
          content={thumbnailPrompt}
          note={
            pfpPrompt
              ? (duration === 'short'
                ? `9:16 — attach the LeftClaw mascot below (${pfpPrompt})`
                : `attach the LeftClaw mascot below (${pfpPrompt})`)
              : (duration === 'short'
                ? '9:16 vertical — paste into ChatGPT or Perplexity with the mascot image attached'
                : 'paste into ChatGPT or Perplexity with the mascot image attached')
          }
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
                leftclaw mascot
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pfpImage.startsWith('data:') ? pfpImage : `data:image/png;base64,${pfpImage}`}
              alt="clawd mascot"
              style={{ maxWidth: 300, borderRadius: 8 }}
            />
          </div>
        </div>
      )}

      {showDraftPipeline && (
        <>
          <StoryboardPanel
            text={duration === 'short' ? (shortBrief || '') : (notebookDoc || '')}
            repoName={repoName}
            duration={duration || 'full'}
            onPipelineChange={({ scoredScenes: next }) => setScoredScenes(next)}
          />

          <SectionHeader
            id="upload-section"
            title="5 · narration"
            hint="NotebookLM video export — audio stripped automatically"
          />
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 14,
            fontSize: 12,
            color: 'var(--text-dim)',
          }}>
            Download the video from NotebookLM (not a share URL), then upload the MP4 in{' '}
            <strong style={{ color: 'var(--text-muted)' }}>6 · draft video</strong>. We strip the audio track for the draft.
          </div>

          <SectionHeader
            id="draft-section"
            title="6 · draft video"
            hint="MP4 in → audio strip → Remotion still draft"
          />
          <DraftVideoPanel scenes={scoredScenes} repoName={repoName} />
        </>
      )}

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
