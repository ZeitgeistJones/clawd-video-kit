import React from 'react'
import { Composition } from 'remotion'
import {
  DRAFT_FPS,
  DRAFT_HEIGHT,
  DRAFT_WIDTH,
  FACELESS_DRAFT_ID,
  FacelessDraft,
  totalFrames,
  type FacelessDraftProps,
} from './FacelessDraft'

export const RemotionRoot: React.FC = () => {
  const defaultProps: FacelessDraftProps = {
    scenes: [
      {
        index: 0,
        title: 'Sample',
        narration: 'Sample narration for draft composition.',
        estimatedDuration: 5,
        imageUrl: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
      },
    ],
    audioUrl: '',
    captions: true,
  }

  return (
    <Composition
      id={FACELESS_DRAFT_ID}
      component={FacelessDraft}
      durationInFrames={totalFrames(defaultProps.scenes)}
      fps={DRAFT_FPS}
      width={DRAFT_WIDTH}
      height={DRAFT_HEIGHT}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }) => ({
        durationInFrames: Math.max(30, totalFrames(props.scenes || [])),
        fps: DRAFT_FPS,
        width: DRAFT_WIDTH,
        height: DRAFT_HEIGHT,
      })}
    />
  )
}
