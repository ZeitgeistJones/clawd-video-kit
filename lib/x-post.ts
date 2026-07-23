// Fetches an X (Twitter) post / long-form Article via FxTwitter and
// builds fuel text for video generation.

const FXTWITTER_BASE = 'https://api.fxtwitter.com'

export type ParsedXStatus = {
  handle: string
  statusId: string
}

export type XAuthor = {
  name: string
  screen_name: string
  description?: string
  followers?: number
  following?: number
}

export type XArticleBlock = {
  text?: string
  type?: string
}

export type XArticle = {
  title?: string
  content?: {
    blocks?: XArticleBlock[]
  }
}

export type XTweet = {
  url: string
  text: string
  created_at?: string
  author: XAuthor
  likes?: number
  retweets?: number
  replies?: number
  views?: number
  article?: XArticle | null
}

export type XPostData = {
  handle: string
  statusId: string
  url: string
  author: XAuthor
  tweetText: string
  articleTitle: string | null
  body: string
  isArticle: boolean
  engagement: {
    likes?: number
    retweets?: number
    replies?: number
    views?: number
  }
}

type FxTwitterResponse = {
  code: number
  message?: string
  tweet?: XTweet
}

export function parseXStatusUrl(input: string): ParsedXStatus {
  const trimmed = input.trim()

  // https://x.com/handle/status/123 or twitter.com / mobile.twitter.com
  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com|mobile\.twitter\.com)\/([^/?#]+)\/status\/(\d+)/i,
  )
  if (urlMatch) {
    return { handle: urlMatch[1], statusId: urlMatch[2] }
  }

  // bare status id
  if (/^\d+$/.test(trimmed)) {
    return { handle: 'i', statusId: trimmed }
  }

  throw new Error(`Could not parse an X status URL or ID from: ${input}`)
}

function flattenArticleBlocks(article: XArticle): string {
  const blocks = article.content?.blocks
  if (!blocks || blocks.length === 0) return ''

  const lines: string[] = []
  for (const block of blocks) {
    const text = (block.text ?? '').trim()
    if (!text) continue

    switch (block.type) {
      case 'header-one':
        lines.push(`# ${text}`)
        break
      case 'header-two':
        lines.push(`## ${text}`)
        break
      case 'header-three':
        lines.push(`### ${text}`)
        break
      case 'blockquote':
        lines.push(`> ${text}`)
        break
      case 'unordered-list-item':
        lines.push(`- ${text}`)
        break
      case 'ordered-list-item':
        lines.push(`1. ${text}`)
        break
      case 'atomic':
        // media placeholder — skip empty atomics
        break
      default:
        lines.push(text)
    }
  }

  return lines.join('\n\n')
}

export async function fetchXPost(postUrlOrId: string): Promise<XPostData> {
  const { handle, statusId } = parseXStatusUrl(postUrlOrId)
  const apiUrl = `${FXTWITTER_BASE}/${encodeURIComponent(handle)}/status/${statusId}`

  const res = await fetch(apiUrl, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`FxTwitter returned HTTP ${res.status} for status ${statusId}`)
  }

  const data = (await res.json()) as FxTwitterResponse

  if (data.code !== 200 || !data.tweet) {
    throw new Error(
      data.message
        ? `FxTwitter error: ${data.message}`
        : `FxTwitter returned no tweet for status ${statusId}`,
    )
  }

  const tweet = data.tweet
  const article = tweet.article ?? null
  const articleBody = article ? flattenArticleBlocks(article) : ''
  const isArticle = Boolean(article && articleBody)
  const body = isArticle ? articleBody : (tweet.text || '').trim()

  if (!body) {
    throw new Error(
      `No readable text for status ${statusId}. FxTwitter returned an empty tweet/article body.`,
    )
  }

  const resolvedHandle = tweet.author?.screen_name || handle

  return {
    handle: resolvedHandle,
    statusId,
    url: tweet.url || `https://x.com/${resolvedHandle}/status/${statusId}`,
    author: tweet.author,
    tweetText: tweet.text || '',
    articleTitle: article?.title?.trim() || null,
    body,
    isArticle,
    engagement: {
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      views: tweet.views,
    },
  }
}

export function buildFuelText(
  post: XPostData,
  authorContext?: string,
  direction?: string,
): string {
  const parts: string[] = []

  parts.push(`X ${post.isArticle ? 'ARTICLE' : 'POST'}`)
  parts.push(`URL: ${post.url}`)
  parts.push(`Author: ${post.author?.name || 'Unknown'} (@${post.handle})`)
  if (post.author?.description) {
    parts.push(`Author bio: ${post.author.description}`)
  }
  if (post.articleTitle) {
    parts.push(`Title: ${post.articleTitle}`)
  }
  parts.push('')
  parts.push('CONTENT:')
  parts.push(post.body)
  parts.push('')

  const eng = post.engagement
  const engBits: string[] = []
  if (eng.likes != null) engBits.push(`likes=${eng.likes}`)
  if (eng.retweets != null) engBits.push(`reposts=${eng.retweets}`)
  if (eng.replies != null) engBits.push(`replies=${eng.replies}`)
  if (eng.views != null) engBits.push(`views=${eng.views}`)
  if (engBits.length > 0) {
    parts.push(`Engagement: ${engBits.join(', ')}`)
    parts.push('')
  }

  if (authorContext?.trim()) {
    parts.push('AUTHOR CONTEXT (pasted by video creator — use for who they are / angle; do not invent beyond this):')
    parts.push(authorContext.trim())
    parts.push('')
  }

  if (direction?.trim()) {
    parts.push('CREATIVE DIRECTION FROM VIDEO CREATOR:')
    parts.push(direction.trim())
  } else {
    parts.push('CREATIVE DIRECTION FROM VIDEO CREATOR:')
    parts.push('(none provided — use your best judgment based on the write-up)')
  }

  return parts.join('\n')
}
