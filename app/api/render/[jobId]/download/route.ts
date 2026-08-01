import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getRenderJob } from '@/lib/render-job'

export async function GET(
  _req: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const jobId = params.jobId
    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const job = await getRenderJob(jobId)
    if (!job) {
      return NextResponse.json({ error: 'job not found' }, { status: 404 })
    }

    // If blob URL, redirect
    if (job.outputUrl && /^https?:\/\//i.test(job.outputUrl)) {
      return NextResponse.redirect(job.outputUrl)
    }

    const full = path.join(process.cwd(), 'tmp', 'renders', `${jobId}.mp4`)
    const buf = await readFile(full)
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="clawd-draft-${jobId}.mp4"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Download failed' }, { status: 404 })
  }
}
