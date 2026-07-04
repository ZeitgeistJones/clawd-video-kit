import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS generation_cache (
      id SERIAL PRIMARY KEY,
      repo_name TEXT NOT NULL UNIQUE,
      outputs JSONB NOT NULL,
      generated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function GET(req: Request) {
  try {
    await ensureTable()
    const { searchParams } = new URL(req.url)
    const repoName = searchParams.get('repoName')

    if (repoName) {
      const result = await sql`
        SELECT outputs, generated_at FROM generation_cache
        WHERE repo_name = ${repoName}
        LIMIT 1
      `
      if (result.rows.length === 0) return NextResponse.json({ cache: null })
      return NextResponse.json({ cache: result.rows[0].outputs })
    }

    const result = await sql`
      SELECT repo_name, generated_at FROM generation_cache
      ORDER BY generated_at DESC
    `
    return NextResponse.json({
      repos: result.rows.map(r => ({
        repoName: r.repo_name,
        generatedAt: r.generated_at,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { repoName, outputs } = await req.json()
    if (!repoName || !outputs) {
      return NextResponse.json({ error: 'repoName and outputs required' }, { status: 400 })
    }

    await ensureTable()
    await sql`
      INSERT INTO generation_cache (repo_name, outputs, generated_at)
      VALUES (${repoName}, ${JSON.stringify(outputs)}, NOW())
      ON CONFLICT (repo_name) DO UPDATE SET
        outputs = ${JSON.stringify(outputs)},
        generated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
