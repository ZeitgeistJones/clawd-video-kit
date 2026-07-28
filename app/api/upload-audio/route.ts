import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { storeAudioUpload } from '@/lib/render-job'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    if (buf.length === 0) {
      return NextResponse.json({ error: 'empty file' }, { status: 400 })
    }
    if (buf.length > 40 * 1024 * 1024) {
      return NextResponse.json({ error: 'file too large (max 40MB)' }, { status: 400 })
    }

    const url = await storeAudioUpload(file.name || 'audio.mp3', buf, file.type || 'audio/mpeg')
    return NextResponse.json({ url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

/** Serve locally stored audio when Blob is not configured. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const file = searchParams.get('file')
    if (!file || file.includes('..') || file.includes('/') || file.includes('\\')) {
      return NextResponse.json({ error: 'invalid file' }, { status: 400 })
    }
    const full = path.join(process.cwd(), 'tmp', 'audio', file)
    const buf = await readFile(full)
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Not found' }, { status: 404 })
  }
}
