import { NextResponse } from 'next/server'
import { getRenderJob } from '@/lib/render-job'
import { runDraftRender } from '@/lib/render-draft'
import type { ScoredScene } from '@/types/storyboard'

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      audioUrl?: string
      scenes?: ScoredScene[]
      captions?: boolean
      repoName?: string
    }

    if (!body.audioUrl?.trim()) {
      return NextResponse.json({ error: 'audioUrl is required' }, { status: 400 })
    }
    if (!Array.isArray(body.scenes) || body.scenes.length === 0) {
      return NextResponse.json({ error: 'scenes array is required' }, { status: 400 })
    }

    const result = await runDraftRender({
      audioUrl: body.audioUrl.trim(),
      scenes: body.scenes,
      captions: body.captions !== false,
      repoName: body.repoName,
    })

    return NextResponse.json(result, {
      status: result.status === 'error' ? 500 : 200,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Render failed' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }
    const job = await getRenderJob(jobId)
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }
    return NextResponse.json(job)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
