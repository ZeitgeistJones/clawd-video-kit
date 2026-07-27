import { createHash } from 'crypto'
import { sql } from '@vercel/postgres'
import type { StoryboardResult } from '@/lib/storyboard'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS storyboard_cache (
      id SERIAL PRIMARY KEY,
      cache_key TEXT NOT NULL UNIQUE,
      repo_name TEXT,
      duration TEXT,
      script_hash TEXT NOT NULL,
      result JSONB NOT NULL,
      generated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export function storyboardCacheKey(
  repoName: string | undefined,
  duration: string | undefined,
  text: string,
): { key: string; scriptHash: string } {
  const scriptHash = createHash('sha256').update(text.trim()).digest('hex').slice(0, 16)
  const key = `${repoName || 'adhoc'}::${duration || 'full'}::${scriptHash}`
  return { key, scriptHash }
}

export async function getStoryboardCache(cacheKey: string): Promise<StoryboardResult | null> {
  await ensureTable()
  const result = await sql`
    SELECT result FROM storyboard_cache
    WHERE cache_key = ${cacheKey}
    LIMIT 1
  `
  if (result.rows.length === 0) return null
  return result.rows[0].result as StoryboardResult
}

export async function setStoryboardCache(opts: {
  cacheKey: string
  repoName?: string
  duration?: string
  scriptHash: string
  result: StoryboardResult
}): Promise<void> {
  await ensureTable()
  await sql`
    INSERT INTO storyboard_cache (cache_key, repo_name, duration, script_hash, result, generated_at)
    VALUES (
      ${opts.cacheKey},
      ${opts.repoName || null},
      ${opts.duration || null},
      ${opts.scriptHash},
      ${JSON.stringify(opts.result)},
      NOW()
    )
    ON CONFLICT (cache_key) DO UPDATE SET
      result = ${JSON.stringify(opts.result)},
      generated_at = NOW()
  `
}

export async function listStoryboardCache(opts?: {
  repoName?: string
  limit?: number
}) {
  await ensureTable()
  const limit = opts?.limit ?? 50

  if (opts?.repoName) {
    return sql`
      SELECT cache_key, duration, script_hash, generated_at
      FROM storyboard_cache
      WHERE repo_name = ${opts.repoName}
      ORDER BY generated_at DESC
      LIMIT ${limit}
    `
  }

  return sql`
    SELECT cache_key, repo_name, duration, generated_at
    FROM storyboard_cache
    ORDER BY generated_at DESC
    LIMIT ${limit}
  `
}
