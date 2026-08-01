import { spawn } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import ffmpegPath from 'ffmpeg-static'

const VIDEO_EXT = /\.(mp4|webm|mov|mkv|m4v)$/i
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|flac)$/i

export function isVideoFile(name: string, mime: string): boolean {
  if (mime.startsWith('video/')) return true
  return VIDEO_EXT.test(name)
}

export function isAudioFile(name: string, mime: string): boolean {
  if (mime.startsWith('audio/')) return true
  return AUDIO_EXT.test(name)
}

function extFromName(name: string, fallback: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i)
  return (m?.[1] || fallback).toLowerCase()
}

/**
 * Strip audio track from a video buffer → MP3.
 * Used for NotebookLM video exports (good audio inside an MP4).
 */
export async function extractAudioFromVideo(
  videoBuf: Buffer,
  filename = 'input.mp4',
): Promise<Buffer> {
  if (!ffmpegPath) {
    throw new Error('ffmpeg binary missing — install ffmpeg-static')
  }

  const dir = await mkdtemp(path.join(os.tmpdir(), 'clawd-narration-'))
  const inExt = extFromName(filename, 'mp4')
  const input = path.join(dir, `in.${inExt}`)
  const output = path.join(dir, 'out.mp3')

  try {
    await writeFile(input, videoBuf)

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        ffmpegPath as string,
        [
          '-hide_banner',
          '-loglevel', 'error',
          '-y',
          '-i', input,
          '-vn',
          '-acodec', 'libmp3lame',
          '-q:a', '2',
          output,
        ],
        { windowsHide: true },
      )

      let stderr = ''
      proc.stderr?.on('data', (chunk) => {
        stderr += chunk.toString()
      })
      proc.on('error', reject)
      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`ffmpeg failed (${code}): ${stderr.trim() || 'no details'}`))
      })
    })

    return await readFile(output)
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
