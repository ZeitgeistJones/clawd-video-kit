import { NextResponse } from 'next/server'

export const revalidate = 300 // cache 5 mins

export async function GET() {
  try {
    const res = await fetch('https://api.github.com/users/clawdbotatg/repos?per_page=100&sort=pushed', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

    const repos = await res.json()

    const mapped = repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      pushedAt: r.pushed_at,
      language: r.language,
      stars: r.stargazers_count,
      topics: r.topics || [],
    }))

    return NextResponse.json({ repos: mapped })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
