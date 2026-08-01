import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { storeAudioUpload } from '@/lib/render-job'
import {
  extractAudioFromVideo,
  isAudioFile,
  isVideoFile,
} from '@/lib/extract-audio'

export const maxDuration = 120

function safeBaseName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'narration'
  return base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'narration'
}

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
    // NotebookLM video exports can be large; prefer local/dev for big files.
    if (buf.length > 120 * 1024 * 1024) {
      return NextResponse.json({ error: 'file too large (max 120MB)' }, { status: 400 })
    }

    const name = file.name || 'upload'
    const mime = file.type || ''

    let audioBuf: Buffer
    let outName: string
    let source: 'video' | 'audio'

    if (isVideoFile(name, mime)) {
      audioBuf = await extractAudioFromVideo(buf, name)
      outName = `${safeBaseName(name)}.mp3`
      source = 'video'
    } else if (isAudioFile(name, mime)) {
      audioBuf = buf
      outName = name.includes('.') ? name.replace(/[^a-zA-Z0-9._-]+/g, '_') : `${safeBaseName(name)}.mp3`
      source = 'audio'
    } else {
      return NextResponse.json(
        {
          error:
            'Upload a NotebookLM MP4 (or other video) — audio will be stripped. Plain audio files also work.',
        },
        { status: 400 },
      )
    }

    const url = await storeAudioUpload(outName, audioBuf, 'audio/mpeg')
    return NextResponse.json({
      url,
      source,
      stripped: source === 'video',
      bytes: audioBuf.length,
    })
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
