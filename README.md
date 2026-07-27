# clawd video kit

Private video production tool for the Clawd Explains YouTube channel.

## What it does

- Scans all clawdbotatg GitHub repos
- Pulls your Clawd Explains YouTube videos
- Gap analysis: finds uncovered + stale repos
- Repomixes selected repo server-side
- Generates NotebookLM source doc + YouTube description via Gemini
- `/larva-video` — larv.ai forum post → video pack
- `/x-video` — X post/article URL + optional author context → video pack
- Storyboard pre-production — keywords, scene board, Pexels/Pixabay B-roll matches, SRT export

## Setup

### 1. Clone and install
```bash
git clone https://github.com/ZeitgeistJones/clawd-video-kit
cd clawd-video-kit
npm install
```

### 2. Environment variables
Create `.env.local`:
```
GEMINI_API_KEY=your_key
GITHUB_TOKEN=your_token
YOUTUBE_API_KEY=your_key
POSTGRES_URL=your_vercel_postgres_url
PEXELS_API_KEY=your_key
PIXABAY_API_KEY=your_key
```

Optional: `GEMINI_MODEL=gemini-2.5-pro` (defaults to `gemini-2.5-flash`)

Compact aliases also work (`GITHUBTOKEN`, `YOUTUBEAPIKEY`, `POSTGRESURL`, etc.).

### 3. Vercel deployment
- Connect repo to Vercel
- Add all env vars in Vercel dashboard (Settings → Environment Variables)
- Add Vercel Postgres from the Storage tab — it auto-populates POSTGRES_URL
- Replace any old `ANTHROPIC_API_KEY` with `GEMINI_API_KEY`

## Env vars on Vercel

| Key | Where to get it |
|-----|----------------|
| GEMINI_API_KEY | aistudio.google.com/apikey |
| GITHUB_TOKEN | github.com → Settings → Developer Settings → Tokens |
| YOUTUBE_API_KEY | console.cloud.google.com → clawd-video-kit project |
| POSTGRES_URL | Vercel dashboard → Storage → Postgres |
| PEXELS_API_KEY | pexels.com/api |
| PIXABAY_API_KEY | pixabay.com/api/docs |

## Storyboard (faceless pre-production)

After generating a notebook doc / short brief on the kit dashboard, use **Generate storyboard**.

It returns:
1. Visual keywords for stock search
2. Scene-by-scene storyboard (title, narration, estimated duration, queries)
3. Matched free stock assets from Pexels + Pixabay (selected + backups)
4. Basic SRT from estimated scene timings

Cached in Postgres (`storyboard_cache`) keyed by `repoName + duration + script hash`.

### What it does NOT do (yet)
- NotebookLM audio is still manual
- No CapCut / Manus / Remotion renderer in this pass
- SRT timings are estimated scene blocks, not word-level captions
- LeftClaw mascot PFP / thumbnail flow is unchanged
