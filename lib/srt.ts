import type { Asset } from '@/lib/stock'

/** Format seconds as SRT timestamp HH:MM:SS,mmm */
export function formatSrtTime(totalSeconds: number): string {
  const msTotal = Math.max(0, Math.round(totalSeconds * 1000))
  const hours = Math.floor(msTotal / 3_600_000)
  const minutes = Math.floor((msTotal % 3_600_000) / 60_000)
  const seconds = Math.floor((msTotal % 60_000) / 1000)
  const millis = msTotal % 1000
  return (
    String(hours).padStart(2, '0') +
    ':' +
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    ',' +
    String(millis).padStart(3, '0')
  )
}

export type SrtScene = {
  narration: string
  estimatedDuration: number
}

/**
 * Build basic SRT from storyboard scenes using estimated durations.
 * Not word-level accurate — v1 timing only.
 */
export function scenesToSrt(scenes: SrtScene[]): string {
  let cursor = 0
  const blocks: string[] = []

  scenes.forEach((scene, i) => {
    const start = cursor
    const dur = Math.max(1, Number(scene.estimatedDuration) || 5)
    const end = start + dur
    const text = (scene.narration || '').trim() || `(scene ${i + 1})`
    blocks.push(
      `${i + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${text}`,
    )
    cursor = end
  })

  return blocks.join('\n\n') + (blocks.length ? '\n' : '')
}
