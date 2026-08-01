import React from 'react'
import { AbsoluteFill, Audio, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

export type DraftSceneInput = {
  index: number
  title: string
  narration: string
  estimatedDuration: number
  imageUrl: string
}

export type FacelessDraftProps = {
  scenes: DraftSceneInput[]
  audioUrl: string
  captions: boolean
}

const FPS = 30

export function sceneFrames(seconds: number) {
  return Math.max(1, Math.round(seconds * FPS))
}

export function totalFrames(scenes: DraftSceneInput[]) {
  return scenes.reduce((acc, s) => acc + sceneFrames(s.estimatedDuration || 5), 0)
}

function SceneSlide({
  scene,
  durationInFrames,
  captions,
}: {
  scene: DraftSceneInput
  durationInFrames: number
  captions: boolean
}) {
  const frame = useCurrentFrame()
  const opacity = interpolate(
    frame,
    [0, 8, Math.max(9, durationInFrames - 8), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  return (
    <AbsoluteFill style={{ backgroundColor: '#080808' }}>
      <AbsoluteFill style={{ opacity }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Img
          src={scene.imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.35) 100%)',
          }}
        />
      </AbsoluteFill>

      {captions && (
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '0 80px 64px',
          }}
        >
          <div
            style={{
              color: '#f0f0f0',
              fontSize: 42,
              fontFamily: 'Arial, Helvetica, sans-serif',
              textAlign: 'center',
              lineHeight: 1.35,
              textShadow: '0 2px 12px rgba(0,0,0,0.9)',
              maxWidth: 1500,
            }}
          >
            {scene.narration.slice(0, 220)}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}

export const FacelessDraft: React.FC<FacelessDraftProps> = ({
  scenes,
  audioUrl,
  captions,
}) => {
  useVideoConfig()
  let from = 0

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {scenes.map((scene) => {
        const durationInFrames = sceneFrames(scene.estimatedDuration || 5)
        const start = from
        from += durationInFrames
        return (
          <Sequence key={scene.index} from={start} durationInFrames={durationInFrames}>
            <SceneSlide scene={scene} durationInFrames={durationInFrames} captions={captions} />
          </Sequence>
        )
      })}
      {audioUrl ? <Audio src={audioUrl} /> : null}
    </AbsoluteFill>
  )
}

export const FACELESS_DRAFT_ID = 'FacelessDraft'
export const DRAFT_FPS = FPS
export const DRAFT_WIDTH = 1920
export const DRAFT_HEIGHT = 1080
