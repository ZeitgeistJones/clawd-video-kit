import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { repoName } = await req.json()
    const repoUrl = `https://github.com/clawdbotatg/${repoName}`

    // Use repomix programmatic API instead of CLI
    const { runCli } = await import('repomix')
    const os = await import('os')
    const path = await import('path')
    const fs = await import('fs')

    const outputPath = path.join(os.tmpdir(), `repomix-${repoName}-${Date.now()}.txt`)

    await runCli([
      '--remote', repoUrl,
      '--output', outputPath,
      '--style', 'plain',
    ], process.cwd())

    const packed = fs.readFileSync(outputPath, 'utf-8')
    try { fs.unlinkSync(outputPath) } catch {}

    const trimmed = packed.length > 100000
      ? packed.slice(0, 100000) + '\n\n[truncated for length]'
      : packed

    return NextResponse.json({ packed: trimmed, repoName, repoUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
