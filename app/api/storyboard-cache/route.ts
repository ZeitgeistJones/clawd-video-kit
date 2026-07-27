import { NextResponse } from 'next/server'
import {
  getStoryboardCache,
  listStoryboardCache,
} from '@/lib/storyboard-cache'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cacheKey = searchParams.get('cacheKey')
    const repoName = searchParams.get('repoName')

    if (cacheKey) {
      const cached = await getStoryboardCache(cacheKey)
      return NextResponse.json({ cache: cached })
    }

    const result = await listStoryboardCache({
      repoName: repoName || undefined,
      limit: repoName ? 10 : 50,
    })
    return NextResponse.json({ entries: result.rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
