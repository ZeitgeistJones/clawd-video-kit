'use client'

import { useState } from 'react'
import type { ScoredScene } from '@/types/storyboard'

type Props = {
  scenes: ScoredScene[] | null
  repoName: string
}

export default function DraftVideoPanel({ scenes, repoName }: Props) {
  const [audioUrl, setAudioUrl] = useState('')
  const [captions, setCaptions] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)

  const readyScenes = (scenes || []).filter((s) => s.selectedAsset)
  const canRender = Boolean(audioUrl.trim()) && readyScenes.length > 0 && !rendering && !uploading

  async function onFile(file: File | null) {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload-audio', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setAudioUrl(data.url)
      setStatus('Audio uploaded')
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function render() {
    if (!canRender) return
    setRendering(true)
    setError('')
    setOutputUrl(null)
    setStatus('Rendering draft (this can take a few minutes)…')
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: audioUrl.trim(),
          scenes: readyScenes,
          captions,
          repoName,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.status === 'error') {
        throw new Error(data.error || 'Render failed')
      }
      setJobId(data.jobId)
      setOutputUrl(data.outputUrl)
      setStatus('Draft ready')
    } catch (e: any) {
      setError(e.message || 'Render failed')
      setStatus('')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div
      id="draft-video"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          draft video
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
          Remotion still-sequence draft from scored b-roll + narration — no CapCut
        </div>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!scenes && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Generate storyboard + finish b-roll scoring first.
          </div>
        )}

        {scenes && readyScenes.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--warning)' }}>
            No scenes have a selected asset yet.
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            narration audio URL
          </div>
          <input
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://… or upload below (NotebookLM export)"
            style={{
              width: '100%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)',
              padding: '8px 12px',
              color: 'var(--text)',
              fontSize: 12,
              fontFamily: 'var(--font)',
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            or upload audio file
          </div>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.m4a"
            disabled={uploading}
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            style={{ fontSize: 12, color: 'var(--text-muted)' }}
          />
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={captions}
            onChange={(e) => setCaptions(e.target.checked)}
          />
          burn-in captions (scene narration)
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-scan"
            disabled={!canRender}
            onClick={render}
          >
            {rendering ? 'rendering…' : uploading ? 'uploading…' : 'render draft'}
          </button>
          {readyScenes.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {readyScenes.length} scenes ready
            </span>
          )}
        </div>

        {status && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{status}</div>
        )}
        {error && <div className="error">{error}</div>}

        {outputUrl && (
          <a
            href={outputUrl}
            download
            style={{
              display: 'inline-block',
              fontSize: 12,
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              background: 'var(--accent-dim)',
              borderRadius: 4,
              padding: '6px 12px',
              textDecoration: 'none',
              width: 'fit-content',
            }}
          >
            download MP4{jobId ? ` (${jobId.slice(0, 8)})` : ''}
          </a>
        )}
      </div>
    </div>
  )
}
