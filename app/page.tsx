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

export default function Home() {
  const [gaps, setGaps] = useState<GapEntry[]>([])
  const [loadingGaps, setLoadingGaps] = useState(false)
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
  }, [])

  async function runGapAnalysis() {
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
      setGaps(gapsData.gaps || [])
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
              <span>coverage gaps</span>
              <button onClick={runGapAnalysis} disabled={loadingGaps} className="btn-scan">
                {loadingGaps ? 'scanning...' : 'scan'}
              </button>
            </div>
            {gaps.length > 0
              ? <GapReport gaps={gaps} onSelect={setSelectedRepo} selected={selectedRepo} />
              : <div className="empty">run a scan to find uncovered repos</div>
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
