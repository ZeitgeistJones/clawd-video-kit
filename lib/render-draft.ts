import path from 'path'
import { mkdir } from 'fs/promises'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import {
  createRenderJob,
  sceneImageUrl,
  storeOutputMp4,
  updateRenderJob,
} from '@/lib/render-job'
import {
  FACELESS_DRAFT_ID,
  type DraftSceneInput,
} from '../remotion/FacelessDraft'
import type { ScoredScene } from '@/types/storyboard'

export type RenderInput = {
  audioUrl: string
  scenes: ScoredScene[]
  captions?: boolean
  repoName?: string
}

let cachedBundle: string | null = null

function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return 'http://127.0.0.1:3000'
}

function toAbsoluteUrl(url: string): string {
  if (!url) return url
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  return new URL(url, siteOrigin()).toString()
}

async function getBundle(): Promise<string> {
  if (cachedBundle) return cachedBundle
  const entry = path.join(process.cwd(), 'remotion', 'index.ts')
  cachedBundle = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
  })
  return cachedBundle
}

function toDraftScenes(scenes: ScoredScene[]): DraftSceneInput[] {
  return scenes
    .map((s) => {
      const imageUrl = sceneImageUrl(s)
      if (!imageUrl) return null
      return {
        index: s.index,
        title: s.title,
        narration: s.narration,
        estimatedDuration: Math.max(2, Number(s.estimatedDuration) || 5),
        imageUrl: toAbsoluteUrl(imageUrl),
      }
    })
    .filter(Boolean) as DraftSceneInput[]
}

/**
 * Create a render job and run Remotion renderMedia (blocking).
 * Remotion stays behind this helper / API — not exposed as an editor UI.
 */
export async function runDraftRender(input: RenderInput): Promise<{
  jobId: string
  status: string
  outputUrl: string | null
  error: string | null
}> {
  if (!input.audioUrl?.trim()) {
    throw new Error('audioUrl is required')
  }
  const draftScenes = toDraftScenes(input.scenes || [])
  if (draftScenes.length === 0) {
    throw new Error('At least one scene with a selected asset image/thumb is required')
  }

  const jobId = await createRenderJob(input.repoName)
  await updateRenderJob(jobId, { status: 'rendering', progress: 0.05 })

  const outDir = path.join(process.cwd(), 'tmp', 'renders')
  await mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, `${jobId}.mp4`)

  try {
    const serveUrl = await getBundle()
    await updateRenderJob(jobId, { progress: 0.2 })

    const inputProps = {
      scenes: draftScenes,
      audioUrl: toAbsoluteUrl(input.audioUrl.trim()),
      captions: Boolean(input.captions),
    }

    const composition = await selectComposition({
      serveUrl,
      id: FACELESS_DRAFT_ID,
      inputProps,
    })

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
      onProgress: ({ progress }) => {
        // fire-and-forget progress updates
        void updateRenderJob(jobId, {
          status: 'rendering',
          progress: 0.2 + progress * 0.7,
        })
      },
    })

    const outputUrl = await storeOutputMp4(jobId, outPath)
    await updateRenderJob(jobId, {
      status: 'done',
      progress: 1,
      outputUrl,
      error: null,
    })

    return { jobId, status: 'done', outputUrl, error: null }
  } catch (err: any) {
    const message = err?.message || 'Render failed'
    await updateRenderJob(jobId, {
      status: 'error',
      error: message,
    })
    return { jobId, status: 'error', outputUrl: null, error: message }
  }
}
