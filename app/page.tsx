'use client'

import { useState, useEffect } from 'react'
import GapReport from '@/components/GapReport'
import GeneratePanel from '@/components/GeneratePanel'
import OutputPanel from '@/components/OutputPanel'
import DraftHistory from '@/components/DraftHistory'

export type GapEntry = {
  repoName: string
  status: 'uncovered' | 'stale' | 'covered'
  matchedVideo: { title: string; url: string; publishedAt: string } | null
  repoLastPushed: string
  priority: 'high' | 'medium' | 'low'
}

export type Draft = {
  repoName: string
  notebookDoc: string
  youtubeDesc: string
  generatedAt: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'just now'
}

export default function Home() {
  const [gaps, setGaps] = useState<GapEntry[]>([])
  const [loadingGaps, setLoadingGaps] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [output, setOutput] = useState<{
    notebookDoc: string
    youtubeDesc: string
    thumbnailPrompt?: string
    pfpImage?: string
    pfpPrompt?: string
  } | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('clawd-kit-drafts')
    if (saved) setDrafts(JSON.parse(saved))
    loadCache()
  }, [])

  async function loadCache() {
    try {
      const res = await fetch('/api/gap-cache')
      const { cache } = await res.json()
      if (cache) {
        setGaps(cache.gaps)
        setLastScanned(cache.scanned_at)
      }
    } catch {}
  }

  async function runGapAnalysis(force = false) {
    setLoadingGaps(true)
    setError('')
    try {
      const reposRes = await fetch('/api/repos')
      const reposData = await reposRes.json()
      if (!reposData.repos) throw new Error('Repos error: ' + JSON.stringify(reposData))

      const videosRes = await fetch('/api/videos')
      const videosData = await videosRes.json()
      if (!videosData.videos) throw new Error('Videos error: ' + JSON.stringify(videosData))

      const gapsRes = await fetch('/api/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repos: reposData.repos, videos: videosData.videos }),
      })
      const gapsData = await gapsRes.json()
      if (!gapsData.gaps) throw new Error('Gaps error: ' + JSON.stringify(gapsData))

      setGaps(gapsData.gaps)
      setLastScanned(new Date().toISOString())

      // save to cache
      await fetch('/api/gap-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaps: gapsData.gaps }),
      })
    } catch (e: any) {
      setError(e.message || 'Gap analysis failed')
    }
    setLoadingGaps(false)
  }

  async function generate(opts: {
    repoName: string
    includeMetaHook: boolean
    previousVideoDescription: string
    generatePfp: boolean
    extraContext: string
  }) {
    setGenerating(true)
    setError('')
    setOutput(null)
    try {
      const packRes = await fetch('/api/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName: opts.repoName }),
      })
      const { packed, repoUrl, error: packErr } = await packRes.json()
      if (packErr) throw new Error(packErr)

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packed,
          repoName: opts.repoName,
          repoUrl,
          includeMetaHook: opts.includeMetaHook,
          previousVideoDescription: opts.previousVideoDescription,
          extraContext: opts.extraContext,
        }),
      })
      const { notebookDoc, youtubeDesc, thumbnailPrompt, error: genErr } = await genRes.json()
      if (genErr) throw new Error(genErr)

      let pfpImage: string | undefined
      let pfpPrompt: string | undefined

      if (opts.generatePfp) {
        const pfpRes = await fetch('/api/pfp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoName: opts.repoName, notebookDoc }),
        })
        const pfpData = await pfpRes.json()
        if (pfpData.imageData) {
          pfpImage = pfpData.imageData
          pfpPrompt = pfpData.prompt
        } else if (pfpData.error) {
          setError('PFP generation failed: ' + pfpData.error)
        }
      }

      setOutput({ notebookDoc, youtubeDesc, thumbnailPrompt, pfpImage, pfpPrompt })

      const draft: Draft = {
        repoName: opts.repoName,
        notebookDoc,
        youtubeDesc,
        generatedAt: new Date().toISOString(),
      }
      const updated = [draft, ...drafts].slice(0, 5)
      setDrafts(updated)
      localStorage.setItem('clawd-kit-drafts', JSON.stringify(updated))
    } catch (e: any) {
      setError(e.message || 'Generation failed')
    }
    setGenerating(false)
  }

  async function markCovered(repoName: string, videoUrl: string) {
    await fetch('/api/mark-covered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName, videoUrl }),
    })
    setGaps(prev => prev.map(g => g.repoName === repoName ? { ...g, status: 'covered' } : g))
  }

  return (
    <main className="main">
      <header className="header">
        <div className="header-inner">
          <span className="logo">🦞 clawd video kit</span>
          <span className="tagline">gap analysis → notebooklm doc → youtube description</span>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="panel">
            <div className="panel-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>coverage gaps</span>
                {lastScanned && (
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                    last scanned {timeAgo(lastScanned)}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {gaps.length > 0 && (
                  <button onClick={() => runGapAnalysis(true)} disabled={loadingGaps} className="btn-scan" style={{ opacity: 0.6 }}>
                    {loadingGaps ? '...' : 'rescan'}
                  </button>
                )}
                {gaps.length === 0 && (
                  <button onClick={() => runGapAnalysis()} disabled={loadingGaps} className="btn-scan">
                    {loadingGaps ? 'scanning...' : 'scan'}
                  </button>
                )}
              </div>
            </div>
            {gaps.length > 0
              ? <GapReport gaps={gaps} onSelect={setSelectedRepo} selected={selectedRepo} />
              : <div className="empty">{loadingGaps ? 'scanning repos...' : 'run a scan to find uncovered repos'}</div>
            }
          </div>

          <DraftHistory drafts={drafts} onLoad={(d) => {
            setSelectedRepo(d.repoName)
            setOutput({ notebookDoc: d.notebookDoc, youtubeDesc: d.youtubeDesc })
          }} />
        </aside>

        <div className="content">
          {error && <div className="error">{error}</div>}

          <GeneratePanel
            selectedRepo={selectedRepo}
            onRepoChange={setSelectedRepo}
            onGenerate={generate}
            generating={generating}
          />

          {output && (
            <OutputPanel
              notebookDoc={output.notebookDoc}
              youtubeDesc={output.youtubeDesc}
              thumbnailPrompt={output.thumbnailPrompt}
              pfpImage={output.pfpImage}
              pfpPrompt={output.pfpPrompt}
              repoName={selectedRepo}
              onMarkCovered={markCovered}
            />
          )}
        </div>
      </div>
    </main>
  )
}
