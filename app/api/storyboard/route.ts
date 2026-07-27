import { NextResponse } from 'next/server'
import { buildStoryboard } from '@/lib/storyboard'
import {
  getStoryboardCache,
  setStoryboardCache,
  storyboardCacheKey,
} from '@/lib/storyboard-cache'
import type { Duration } from '@/types/generate'

export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      text?: string
      repoName?: string
      duration?: Duration
      force?: boolean
    }

    const text = body.text?.trim()
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    if (body.duration && !['full', 'medium', 'short'].includes(body.duration)) {
      return NextResponse.json({ error: 'duration must be full | medium | short' }, { status: 400 })
    }

    const { key, scriptHash } = storyboardCacheKey(body.repoName, body.duration, text)

    if (!body.force) {
      try {
        const cached = await getStoryboardCache(key)
        if (cached) {
          return NextResponse.json({
            ...cached,
            cached: true,
            cacheKey: key,
            repoName: body.repoName || null,
            duration: body.duration || null,
          })
        }
      } catch {
        // cache miss / table not ready — continue
      }
    }

    const result = await buildStoryboard(text, { duration: body.duration })

    try {
      await setStoryboardCache({
        cacheKey: key,
        repoName: body.repoName,
        duration: body.duration,
        scriptHash,
        result,
      })
    } catch {
      // Don't fail the request if cache write fails
    }

    return NextResponse.json({
      ...result,
      cached: false,
      cacheKey: key,
      repoName: body.repoName || null,
      duration: body.duration || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Storyboard generation failed' }, { status: 500 })
  }
}
