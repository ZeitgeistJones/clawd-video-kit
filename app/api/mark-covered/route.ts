import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS covered_repos (
      id SERIAL PRIMARY KEY,
      repo_name TEXT NOT NULL UNIQUE,
      video_url TEXT,
      covered_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function POST(req: Request) {
  try {
    const { repoName, videoUrl } = await req.json()
    await ensureTable()

    await sql`
      INSERT INTO covered_repos (repo_name, video_url)
      VALUES (${repoName}, ${videoUrl || null})
      ON CONFLICT (repo_name) DO UPDATE SET video_url = ${videoUrl || null}, covered_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    await ensureTable()
    const result = await sql`SELECT repo_name, video_url, covered_at FROM covered_repos`
    return NextResponse.json({ covered: result.rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
