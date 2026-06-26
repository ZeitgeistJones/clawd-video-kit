import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { repoName } = await req.json()
    const repoUrl = `https://github.com/clawdbotatg/${repoName}`
    const outputPath = join(tmpdir(), `repomix-${repoName}-${Date.now()}.txt`)

    try {
      execSync(
        `npx repomix --remote ${repoUrl} --output ${outputPath} --style plain`,
        {
          timeout: 50000,
          env: {
            ...process.env,
            GITHUB_TOKEN: process.env.GITHUB_TOKEN,
          },
        }
      )
    } catch (execErr: any) {
      throw new Error(`Repomix failed: ${execErr.message}`)
    }

    const packed = readFileSync(outputPath, 'utf-8')

    try { unlinkSync(outputPath) } catch {}

    // trim to ~100k chars to stay within Claude context
    const trimmed = packed.length > 100000 ? packed.slice(0, 100000) + '\n\n[truncated for length]' : packed

    return NextResponse.json({ packed: trimmed, repoName, repoUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
