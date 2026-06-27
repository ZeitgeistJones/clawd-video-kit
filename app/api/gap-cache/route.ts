import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS gap_cache (
      id SERIAL PRIMARY KEY,
      gaps JSONB NOT NULL,
      scanned_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function GET() {
  try {
    await ensureTable()
    const result = await sql`SELECT gaps, scanned_at FROM gap_cache ORDER BY scanned_at DESC LIMIT 1`
    if (result.rows.length === 0) return NextResponse.json({ cache: null })
    return NextResponse.json({ cache: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { gaps } = await req.json()
    await ensureTable()
    await sql`
      INSERT INTO gap_cache (id, gaps, scanned_at)
      VALUES (1, ${JSON.stringify(gaps)}, NOW())
      ON CONFLICT (id) DO UPDATE SET gaps = ${JSON.stringify(gaps)}, scanned_at = NOW()
    `
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
