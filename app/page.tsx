'use client'

import { useState, useEffect, useCallback } from 'react'
import GapReport from '@/components/GapReport'
import GeneratePanel from '@/components/GeneratePanel'
import OutputPanel from '@/components/OutputPanel'
import DraftHistory from '@/components/DraftHistory'
import type { Duration, GenerationOutputs, WorkflowLane } from '@/types/generate'

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

type OutputState = GenerationOutputs & {
  pfpImage?: string
  pfpPrompt?: string
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
  const [lane, setLane] = useState<WorkflowLane>('classic')
  const [duration, setDuration] = useState<Duration>('full')
  const [isHeyGen, setIsHeyGen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [output, setOutput] = useState<OutputState | null>(null)
  const [cachedRepos, setCachedRepos] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [error, setError] = useState('')

  async function loadGenerationCacheList() {
    try {
      const res = await fetch('/api/generation-cache')
      const { repos } = await res.json()
      if (repos) setCachedRepos(repos.map((r: { repoName: string }) => r.repoName))
    } catch {}
  }

  const loadRepoCache = useCallback(async (repoName: string) => {
    if (!repoName.trim()) {
      setOutput(null)
      return
    }
    try {
      const res = await fetch(`/api/generation-cache?repoName=${encodeURIComponent(repoName)}`)
      const { cache } = await res.json()
      if (cache) {
        const cinematic = cache.lane === 'cinematic' || Boolean(cache.cinematicCustomizePaste)
        setOutput({
          ...cache,
          emphasisSource: cache.emphasisSource || (cinematic ? cache.notebookDoc : undefined),
        })
        setDuration(cache.duration || 'full')
        setIsHeyGen(cache.isHeyGen || false)
        if (cinematic) {
          setLane('cinematic')
        } else if (cache.lane === 'classic' || cache.lane === 'draft') {
          setLane(cache.lane === 'draft' ? 'draft' : 'classic')
        }
      } else {
        setOutput(null)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('clawd-kit-drafts')
    if (saved) setDrafts(JSON.parse(saved))
    loadCache()
    loadGenerationCacheList()
  }, [])

  useEffect(() => {
    if (selectedRepo.trim()) loadRepoCache(selectedRepo.trim())
  }, [selectedRepo, loadRepoCache])

  async function loadCache() {
    try {
      const res = await fetch('/api/gap-cache')
      const { cache } = await res.json()
      if (cache) {
        // #region agent log
        const gapsArr = Array.isArray(cache.gaps) ? cache.gaps : []
        const counts = { covered: 0, stale: 0, uncovered: 0 }
        for (const g of gapsArr) {
          if (g?.status === 'covered') counts.covered++
          else if (g?.status === 'stale') counts.stale++
          else counts.uncovered++
        }
        fetch('http://127.0.0.1:7343/ingest/1a5867e9-c2d9-483f-bd01-1924980395c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2bdc0a'},body:JSON.stringify({sessionId:'2bdc0a',hypothesisId:'B',location:'page.tsx:loadCache',message:'loaded gap cache',data:{scannedAt:cache.scanned_at,total:gapsArr.length,...counts,sampleCovered:gapsArr.filter((g:GapEntry)=>g.status==='covered').slice(0,15).map((g:GapEntry)=>({repo:g.repoName,video:g.matchedVideo?.title}))},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        setGaps(cache.gaps)
        setLastScanned(cache.scanned_at)
      }
    } catch {}
  }

  async function saveGenerationCache(repoName: string, data: GenerationOutputs) {
    try {
      await fetch('/api/generation-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName, outputs: data }),
      })
      await loadGenerationCacheList()
    } catch {}
  }

  async function runGapAnalysis(_force = false) {
    setLoadingGaps(true)
    setError('')
    try {
      // Always bypass Next/GitHub caches on explicit scan/rescan so new repos show up.
      const reposRes = await fetch('/api/repos?fresh=1', { cache: 'no-store' })
      const reposData = await reposRes.json()
      if (!reposData.repos) throw new Error('Repos error: ' + JSON.stringify(reposData))

      const videosRes = await fetch('/api/videos?fresh=1', { cache: 'no-store' })
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
    lane: WorkflowLane
    includeMetaHook: boolean
    previousVideoDescription: string
    generatePfp: boolean
    extraContext: string
    duration: Duration
    isHeyGen: boolean
    thumbnailOnly?: boolean
    forceRegenerate?: boolean
  }) {
    setGenerating(true)
    setError('')
    // Thumbnail-only should not wipe an existing script package.
    if (opts.forceRegenerate && !opts.thumbnailOnly) setOutput(null)

    try {
      const packRes = await fetch('/api/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName: opts.repoName, light: Boolean(opts.thumbnailOnly) }),
      })
      const { packed, repoUrl, error: packErr } = await packRes.json()
      if (packErr) throw new Error(packErr)

      if (opts.thumbnailOnly) {
        const prev = output
        const genRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packed,
            repoName: opts.repoName,
            repoUrl,
            extraContext: opts.extraContext,
            duration: opts.duration === 'short' ? 'short' : 'full',
            thumbnailOnly: true,
            lockMascot: opts.generatePfp,
            mascotScene: opts.generatePfp ? undefined : prev?.pfpPrompt,
          }),
        })
        const genData = await genRes.json()
        // #region agent log
        if (genData.error) fetch('http://127.0.0.1:7343/ingest/1a5867e9-c2d9-483f-bd01-1924980395c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2bdc0a'},body:JSON.stringify({sessionId:'2bdc0a',hypothesisId:'F,G',location:'page.tsx:generate:thumb',message:'generate API error',data:{error:String(genData.error).slice(0,500),status:genRes.status,repo:opts.repoName,lane:opts.lane},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        if (genData.error) throw new Error(genData.error)

        const { thumbnailPrompt, mascotScene } = genData
        const generatedAt = new Date().toISOString()
        let pfpImage: string | undefined
        let pfpPrompt: string | undefined = mascotScene || undefined

        if (opts.generatePfp) {
          const pfpRes = await fetch('/api/pfp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repoName: opts.repoName,
              notebookDoc: packed,
              prompt: mascotScene || undefined,
            }),
          })
          const pfpData = await pfpRes.json()
          if (pfpData.imageData) {
            pfpImage = pfpData.imageData
            pfpPrompt = pfpData.prompt || mascotScene || undefined
          } else if (pfpData.error) {
            setError('PFP generation failed: ' + pfpData.error)
          }
        } else if (prev?.pfpImage && prev?.pfpPrompt) {
          pfpImage = prev.pfpImage
          pfpPrompt = prev.pfpPrompt
        }

        const thumbDuration: Duration = opts.duration === 'short' ? 'short' : (prev?.duration || 'full')
        const cachePayload: GenerationOutputs = {
          ...(prev
            ? {
                lane: prev.lane,
                duration: thumbDuration,
                isHeyGen: prev.isHeyGen,
                shortBrief: prev.shortBrief,
                notebookDoc: prev.notebookDoc,
                youtubeDesc: prev.youtubeDesc,
                elevenLabsScript: prev.elevenLabsScript,
                emphasisSource: prev.emphasisSource,
                holderThesisSource: prev.holderThesisSource,
                focusGuidance: prev.focusGuidance,
                feelNotes: prev.feelNotes,
                narratorBlock: prev.narratorBlock,
                cinematicCustomizePaste: prev.cinematicCustomizePaste,
              }
            : {
                lane: opts.lane === 'draft' ? 'classic' : opts.lane,
                duration: opts.duration === 'short' ? 'short' : 'full',
                isHeyGen: false,
              }),
          thumbnailPrompt,
          generatedAt,
        }

        const newOutput: OutputState = {
          ...cachePayload,
          pfpImage,
          pfpPrompt,
          packedRepo: prev?.packedRepo,
        }
        setOutput(newOutput)
        await saveGenerationCache(opts.repoName, cachePayload)
        setGenerating(false)
        return
      }

      const isCinematic = opts.lane === 'cinematic'
      const genRes = await fetch(isCinematic ? '/api/generate-cinematic' : '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packed,
          repoName: opts.repoName,
          repoUrl,
          includeMetaHook: opts.includeMetaHook,
          previousVideoDescription: opts.previousVideoDescription,
          extraContext: opts.extraContext,
          ...(isCinematic
            ? {}
            : { duration: opts.duration, isHeyGen: opts.isHeyGen }),
          lockMascot: opts.generatePfp,
          mascotScene: opts.generatePfp ? undefined : output?.pfpPrompt,
        }),
      })
      const genData = await genRes.json()
      // #region agent log
      if (genData.error) fetch('http://127.0.0.1:7343/ingest/1a5867e9-c2d9-483f-bd01-1924980395c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2bdc0a'},body:JSON.stringify({sessionId:'2bdc0a',hypothesisId:'F,G',location:'page.tsx:generate:main',message:'generate API error',data:{error:String(genData.error).slice(0,500),status:genRes.status,repo:opts.repoName,lane:opts.lane,cinematic:isCinematic},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      if (genData.error) throw new Error(genData.error)

      const {
        shortBrief,
        notebookDoc,
        emphasisSource,
        holderThesisSource,
        youtubeDesc,
        elevenLabsScript,
        thumbnailPrompt,
        mascotScene,
        focusGuidance,
        feelNotes,
        narratorBlock,
        cinematicCustomizePaste,
      } = genData
      const generatedAt = new Date().toISOString()
      const emphasis = emphasisSource || notebookDoc

      let pfpImage: string | undefined
      let pfpPrompt: string | undefined = mascotScene || undefined

      if (opts.generatePfp) {
        const pfpRes = await fetch('/api/pfp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoName: opts.repoName,
            notebookDoc: opts.duration === 'short' ? shortBrief : emphasis,
            prompt: mascotScene || undefined,
          }),
        })
        const pfpData = await pfpRes.json()
        if (pfpData.imageData) {
          pfpImage = pfpData.imageData
          pfpPrompt = pfpData.prompt || mascotScene || undefined
        } else if (pfpData.error) {
          setError('PFP generation failed: ' + pfpData.error)
        }
      } else if (output?.pfpImage && output?.pfpPrompt) {
        pfpImage = output.pfpImage
        pfpPrompt = output.pfpPrompt
      }

      const cachePayload: GenerationOutputs = {
        lane: opts.lane === 'draft' ? 'classic' : opts.lane,
        duration: isCinematic ? 'full' : opts.duration,
        isHeyGen: isCinematic ? false : opts.isHeyGen,
        generatedAt,
        elevenLabsScript,
        ...(isCinematic
          ? {
              emphasisSource: emphasis,
              holderThesisSource,
              notebookDoc: emphasis,
              youtubeDesc,
              thumbnailPrompt,
              focusGuidance,
              feelNotes,
              narratorBlock,
              cinematicCustomizePaste,
            }
          : opts.duration === 'short'
            ? { shortBrief, thumbnailPrompt }
            : { notebookDoc, youtubeDesc, thumbnailPrompt }),
      }

      // Keep full pack in session for download — do not persist huge packs in Postgres.
      const newOutput: OutputState = {
        ...cachePayload,
        pfpImage,
        pfpPrompt,
        ...(isCinematic ? { packedRepo: packed } : {}),
      }
      setOutput(newOutput)
      await saveGenerationCache(opts.repoName, cachePayload)

      if ((isCinematic || opts.duration !== 'short') && emphasis && youtubeDesc) {
        const draft: Draft = {
          repoName: opts.repoName,
          notebookDoc: emphasis,
          youtubeDesc,
          generatedAt,
        }
        const updated = [draft, ...drafts].slice(0, 5)
        setDrafts(updated)
        localStorage.setItem('clawd-kit-drafts', JSON.stringify(updated))
      }
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

  function handleRepoSelect(repo: string) {
    setSelectedRepo(repo)
  }

  return (
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
            ? <GapReport gaps={gaps} onSelect={handleRepoSelect} selected={selectedRepo} cachedRepos={cachedRepos} />
            : <div className="empty">{loadingGaps ? 'scanning repos...' : 'run a scan to find uncovered repos'}</div>
          }
        </div>

        <DraftHistory drafts={drafts} onLoad={(d) => {
          setSelectedRepo(d.repoName)
          setDuration('full')
          setIsHeyGen(false)
          setOutput({ duration: 'full', isHeyGen: false, notebookDoc: d.notebookDoc, youtubeDesc: d.youtubeDesc, generatedAt: d.generatedAt })
        }} />
      </aside>

      <div className="content">
        {error && <div className="error">{error}</div>}

        <GeneratePanel
          selectedRepo={selectedRepo}
          onRepoChange={setSelectedRepo}
          lane={lane}
          onLaneChange={setLane}
          duration={duration}
          onDurationChange={setDuration}
          isHeyGen={isHeyGen}
          onHeyGenChange={setIsHeyGen}
          onGenerate={generate}
          generating={generating}
          hasOutput={!!output}
        />

        {output && (
          <OutputPanel
            lane={output.lane || lane}
            showDraftPipeline={lane === 'draft'}
            duration={output.duration}
            isHeyGen={output.isHeyGen}
            shortBrief={output.shortBrief}
            notebookDoc={output.notebookDoc}
            emphasisSource={output.emphasisSource}
            holderThesisSource={output.holderThesisSource}
            packedRepo={output.packedRepo}
            youtubeDesc={output.youtubeDesc}
            elevenLabsScript={output.elevenLabsScript}
            thumbnailPrompt={output.thumbnailPrompt}
            cinematicCustomizePaste={output.cinematicCustomizePaste}
            narratorBlock={output.narratorBlock}
            focusGuidance={output.focusGuidance}
            feelNotes={output.feelNotes}
            pfpImage={output.pfpImage}
            pfpPrompt={output.pfpPrompt}
            repoName={selectedRepo}
            onMarkCovered={markCovered}
          />
        )}
      </div>
    </div>
  )
}
