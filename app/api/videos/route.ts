import { NextResponse } from 'next/server'

const CHANNEL_ID = 'UCrYxeMAfEE3zWPx3D8euq8g'

type FetchCache =
  | { cache: 'no-store' }
  | { next: { revalidate: number } }

export async function GET(req: Request) {
  try {
    const fresh = new URL(req.url).searchParams.get('fresh') === '1'
    const cacheOpt: FetchCache = fresh
      ? { cache: 'no-store' }
      : { next: { revalidate: 600 } }
    const apiKey = process.env.YOUTUBE_API_KEY

    // get uploads playlist id
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`,
      cacheOpt,
    )
    const channelData = await channelRes.json()
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) throw new Error('Could not find uploads playlist')

    // paginate through all videos
    let videos: any[] = []
    let pageToken = ''

    do {
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${pageToken}&key=${apiKey}`,
        cacheOpt,
      )
      const playlistData = await playlistRes.json()

      const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',')

      // batch fetch descriptions (1 unit per call)
      const detailRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}&key=${apiKey}`,
        cacheOpt,
      )
      const detailData = await detailRes.json()

      const batch = detailData.items.map((v: any) => ({
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        publishedAt: v.snippet.publishedAt,
        url: `https://youtube.com/watch?v=${v.id}`,
      }))

      videos = [...videos, ...batch]
      pageToken = playlistData.nextPageToken || ''
    } while (pageToken)

    return NextResponse.json(
      { videos },
      {
        headers: {
          'Cache-Control': fresh ? 'no-store' : 'private, max-age=600',
        },
      },
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
