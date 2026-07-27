import { NextResponse } from 'next/server'
import { scoreBroll } from '@/lib/score-broll'
import type { StoryboardScene } from '@/types/storyboard'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      scenes?: StoryboardScene[]
      forceMock?: boolean
    }

    if (!Array.isArray(body.scenes)) {
      return NextResponse.json({ error: 'scenes array is required' }, { status: 400 })
    }

    if (body.scenes.length === 0) {
      return NextResponse.json({ error: 'scenes must not be empty' }, { status: 400 })
    }

    const result = await scoreBroll(body.scenes, { forceMock: body.forceMock })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'B-roll scoring failed' },
      { status: 500 },
    )
  }
}
