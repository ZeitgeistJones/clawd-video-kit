# clawd video kit

Private video production tool for the Clawd Explains YouTube channel.

## What it does

- Scans all clawdbotatg GitHub repos
- Pulls your Clawd Explains YouTube videos
- Gap analysis: finds uncovered + stale repos (local name matching — no LLM quota)
- Repomixes selected repo server-side
- Generates NotebookLM source doc + YouTube description via Gemini
- **Cinematic lane** — dual-source NotebookLM pack (repo pack + emphasis) + normie narrator customize paste
- `/larva-video` — larv.ai forum post → video pack
- `/x-video` — X post/article URL + optional author context → video pack
- Draft lane — storyboard, B-roll, strip audio from NotebookLM MP4, Remotion still draft

Gap **rescan** only needs `GITHUB_TOKEN` + `YOUTUBE_API_KEY`. Gemini/Anthropic are only used when you generate docs, storyboards, keywords, etc.

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

Optional: `GEMINI_MODEL=gemini-3.6-flash` (this is the default; override if needed)

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
| SCORE_BROLL_MOCK | `true` (default) = local scoring; `false` = Gemini relevance scoring |
| BLOB_READ_WRITE_TOKEN | Vercel Blob (optional — otherwise drafts/audio save under `tmp/` locally) |

## Lanes

| Lane | Generate API | NotebookLM use |
|------|----------------|----------------|
| Classic | `/api/generate` | Source doc + custom focus → Audio Overview |
| Cinematic | `/api/generate-cinematic` | **Repo pack** + **emphasis source** + **normie customize paste** → Video Overview → Cinematic |
| Draft | `/api/generate` then storyboard/render | Optional NLM MP4 for narration audio only |

Cinematic is dual-source: upload the downloaded repo pack (source 1) and emphasis brief (source 2). The customize paste steers the **narrator** in plain English (Talk Normie “normie” voice in `data/normieVoice.ts`) — not an animation tech dump. Cinematic has no Visual Style carousel; light FEEL lines live in the paste.

## Storyboard (faceless pre-production)

After generating a notebook doc / short brief on the kit dashboard, use **Generate storyboard**.

It returns:
1. Visual keywords for stock search
2. Scene-by-scene storyboard (title, narration, estimated duration, queries)
3. Matched free stock assets from Pexels + Pixabay (selected + backups)
4. Basic SRT from estimated scene timings

Cached in Postgres (`storyboard_cache`) keyed by `repoName + duration + script hash`.

### B-roll relevance scoring

`POST /api/score-broll` with `{ "scenes": [ ...storyboard scenes... ] }`.

On the kit dashboard, **Generate storyboard** calls this automatically. B-roll review defaults to needs-review scenes; toggle “show all scenes (with scores)” and click a thumb to swap the pick.

### Draft render (Remotion)

1. Finish storyboard + b-roll review  
2. In NotebookLM, download the **video** export (MP4 — audio inside is what we want)  
3. In **6 · draft video**, upload that MP4 — the kit strips audio via ffmpeg (`POST /api/upload-audio`)  
4. Toggle captions → **render draft** (`POST /api/render`)  
5. Download the Remotion still-sequence MP4  

Prefer local/`next dev` or a long-timeout host — Remotion + ffmpeg can exceed short serverless limits. Large NotebookLM exports may also hit request body limits on Vercel hobby.

### What it does NOT do
- No NotebookLM share-URL scrape (upload the MP4 file instead)
- No CapCut / Manus / full timeline editor
- SRT timings are estimated scene blocks, not word-level captions
- Video stock is burned in as stills (thumbs) in v1 drafts
- LeftClaw mascot PFP / thumbnail flow is unchanged
