import { NextResponse } from 'next/server'

export const revalidate = 300 // cache 5 mins

async function fetchAllRepos() {
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  }
  const repos: any[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://api.github.com/users/clawdbotatg/repos?per_page=100&sort=pushed&page=${page}`,
      { headers, next: { revalidate: 300 } },
    )
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    repos.push(...batch)
    if (batch.length < 100) break
    page++
  }

  return repos
}

export async function GET() {
  try {
    const repos = await fetchAllRepos()

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
