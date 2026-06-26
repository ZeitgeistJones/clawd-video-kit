import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  try {
    const { repos, videos } = await req.json()

    const prompt = `You are analyzing a YouTube channel called "Clawd Explains" to find coverage gaps.

Here are all the clawdbotatg GitHub repos:
${JSON.stringify(repos.map((r: any) => ({ name: r.name, description: r.description, pushedAt: r.pushedAt })), null, 2)}

Here are all the YouTube videos with their descriptions:
${JSON.stringify(videos.map((v: any) => ({ title: v.title, description: v.description, publishedAt: v.publishedAt })), null, 2)}

For each repo, determine:
1. "uncovered" — no video exists for this repo
2. "stale" — a video exists but the repo has had significant commits since the video was published (more than 30 days newer)
3. "covered" — a video exists and is reasonably current

Match repo names against video titles AND descriptions. Repo names may appear as GitHub URLs, partial names, or references in descriptions. Be fuzzy but sensible.

Return ONLY valid JSON in this exact format, no explanation:
{
  "gaps": [
    {
      "repoName": "repo-name",
      "status": "uncovered" | "stale" | "covered",
      "matchedVideo": { "title": "...", "url": "...", "publishedAt": "..." } | null,
      "repoLastPushed": "ISO date",
      "priority": "high" | "medium" | "low"
    }
  ]
