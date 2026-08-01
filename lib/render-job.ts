import { createHash, randomUUID } from 'crypto'
import { mkdir, writeFile, readFile } from 'fs/promises'
import path from 'path'
import { sql } from '@vercel/postgres'
import { put } from '@vercel/blob'
import type { ScoredScene } from '@/types/storyboard'

export type RenderJobStatus = 'queued' | 'rendering' | 'done' | 'error'

export type RenderJob = {
  id: string
  status: RenderJobStatus
  progress: number
  outputUrl: string | null
  error: string | null
  repoName: string | null
  createdAt: string
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS render_jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      output_url TEXT,
      error TEXT,
      repo_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function createRenderJob(repoName?: string): Promise<string> {
  await ensureTable()
  const id = randomUUID()
  await sql`
    INSERT INTO render_jobs (id, status, progress, repo_name)
    VALUES (${id}, 'queued', 0, ${repoName || null})
  `
  return id
}

export async function updateRenderJob(
  id: string,
  patch: Partial<{
    status: RenderJobStatus
    progress: number
    outputUrl: string | null
    error: string | null
  }>,
) {
  await ensureTable()
  const current = await getRenderJob(id)
  if (!current) return

  const status = patch.status ?? current.status
  const progress = patch.progress ?? current.progress
  const outputUrl = patch.outputUrl !== undefined ? patch.outputUrl : current.outputUrl
  const error = patch.error !== undefined ? patch.error : current.error

  await sql`
    UPDATE render_jobs
    SET status = ${status},
        progress = ${progress},
        output_url = ${outputUrl},
        error = ${error},
        updated_at = NOW()
    WHERE id = ${id}
  `
}

export async function getRenderJob(id: string): Promise<RenderJob | null> {
  await ensureTable()
  const result = await sql`
    SELECT id, status, progress, output_url, error, repo_name, created_at
    FROM render_jobs
    WHERE id = ${id}
    LIMIT 1
  `
  if (result.rows.length === 0) return null
  const r = result.rows[0]
  return {
    id: r.id,
    status: r.status,
    progress: Number(r.progress) || 0,
    outputUrl: r.output_url,
    error: r.error,
    repoName: r.repo_name,
    createdAt: r.created_at,
  }
}

export function sceneImageUrl(scene: ScoredScene): string | null {
  const asset = scene.selectedAsset
  if (!asset) return null
  if (asset.kind === 'image' && asset.url) return asset.url
  if (asset.thumbUrl) return asset.thumbUrl
  if (asset.url) return asset.url
  return null
}

export async function saveLocalFile(
  relativeDir: string,
  filename: string,
  data: Buffer,
): Promise<string> {
  const dir = path.join(process.cwd(), 'tmp', relativeDir)
  await mkdir(dir, { recursive: true })
  const full = path.join(dir, filename)
  await writeFile(full, data)
  return full
}

export async function storeOutputMp4(jobId: string, filePath: string): Promise<string> {
  const buf = await readFile(filePath)
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (token) {
    const blob = await put(`renders/${jobId}.mp4`, buf, {
      access: 'public',
      contentType: 'video/mp4',
      token,
    })
    return blob.url
  }
  // Local fallback — served by /api/render/[jobId]/download
  const localName = `${jobId}.mp4`
  await saveLocalFile('renders', localName, buf)
  return `/api/render/${jobId}/download`
}

export async function storeAudioUpload(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'audio.mp3'
  const hash = createHash('sha1').update(data).digest('hex').slice(0, 10)
  const key = `audio/${hash}-${safe}`

  if (token) {
    const blob = await put(key, data, {
      access: 'public',
      contentType: contentType || 'audio/mpeg',
      token,
    })
    return blob.url
  }

  await saveLocalFile('audio', `${hash}-${safe}`, data)
  return `/api/upload-audio?file=${encodeURIComponent(`${hash}-${safe}`)}`
}
