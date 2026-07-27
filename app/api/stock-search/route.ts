import { NextResponse } from 'next/server'
import { extractKeywords } from '@/lib/keywords'
import { unifiedSearchAssets } from '@/lib/stock'
import type { Duration } from '@/types/generate'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      text?: string
      repoName?: string
      duration?: Duration
    }

    const text = body.text?.trim()
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    if (body.duration && !['full', 'medium', 'short'].includes(body.duration)) {
      return NextResponse.json({ error: 'duration must be full | medium | short' }, { status: 400 })
    }

    const keywords = await extractKeywords(text)
    const assets = await unifiedSearchAssets(keywords, { perQuery: 4 })

    return NextResponse.json({
      keywords,
      assets,
      repoName: body.repoName || null,
      duration: body.duration || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Stock search failed' }, { status: 500 })
  }
}
