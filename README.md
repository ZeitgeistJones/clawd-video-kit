# clawd video kit

Private video production tool for the Clawd Explains YouTube channel.

## What it does

- Scans all clawdbotatg GitHub repos
- Pulls your Clawd Explains YouTube videos
- Gap analysis: finds uncovered + stale repos
- Repomixes selected repo server-side
- Generates NotebookLM source doc + YouTube description via Claude

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
ANTHROPIC_API_KEY=your_key
GITHUB_TOKEN=your_token
YOUTUBE_API_KEY=your_key
POSTGRES_URL=your_vercel_postgres_url
```

### 3. Vercel deployment
- Connect repo to Vercel
- Add all env vars in Vercel dashboard (Settings → Environment Variables)
- Add Vercel Postgres from the Storage tab — it auto-populates POSTGRES_URL

## Env vars on Vercel

| Key | Where to get it |
|-----|----------------|
| ANTHROPIC_API_KEY | console.anthropic.com |
| GITHUB_TOKEN | github.com → Settings → Developer Settings → Tokens |
| YOUTUBE_API_KEY | console.cloud.google.com → clawd-video-kit project |
| POSTGRES_URL | Vercel dashboard → Storage → Postgres |
