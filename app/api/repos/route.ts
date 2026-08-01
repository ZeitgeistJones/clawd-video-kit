import { NextResponse } from 'next/server'

const OWNER = 'clawdbotatg'

type FetchCache =
  | { cache: 'no-store' }
  | { next: { revalidate: number } }

async function fetchPages(urlBase: string, headers: HeadersInit, cacheOpt: FetchCache) {
  const repos: any[] = []
  let page = 1

  while (true) {
    const sep = urlBase.includes('?') ? '&' : '?'
    const res = await fetch(`${urlBase}${sep}per_page=100&page=${page}`, {
      headers,
      ...cacheOpt,
    })
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    repos.push(...batch)
    if (batch.length < 100) break
    page++
  }

  return repos
}

function mergeById(lists: any[][]): any[] {
  const byId = new Map<number, any>()
  for (const list of lists) {
    for (const repo of list) {
      if (repo?.id != null) byId.set(repo.id, repo)
    }
  }
  return [...byId.values()].sort((a, b) => {
    const at = new Date(a.pushed_at || 0).getTime()
    const bt = new Date(b.pushed_at || 0).getTime()
    return bt - at
  })
}

async function fetchAllRepos(fresh: boolean) {
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  }
  const cacheOpt: FetchCache = fresh
    ? { cache: 'no-store' }
    : { next: { revalidate: 300 } }

  // Public profile list (always). /users/{user}/repos never includes privates.
  const publicRepos = await fetchPages(
    `https://api.github.com/users/${OWNER}/repos?sort=pushed`,
    headers,
    cacheOpt,
  )

  // Authenticated list can add private repos the token can access.
  let privateExtras: any[] = []
  try {
    const accessible = await fetchPages(
      `https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=pushed`,
      headers,
      cacheOpt,
    )
    privateExtras = accessible.filter(
      (r: any) => r?.owner?.login?.toLowerCase() === OWNER.toLowerCase(),
    )
  } catch {
    // Token may lack user scope — public list is enough.
  }

  return mergeById([publicRepos, privateExtras])
}

export async function GET(req: Request) {
  try {
    const fresh = new URL(req.url).searchParams.get('fresh') === '1'
    const repos = await fetchAllRepos(fresh)

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
      private: Boolean(r.private),
    }))

    return NextResponse.json(
      { repos: mapped },
      {
        headers: {
          'Cache-Control': fresh ? 'no-store' : 'private, max-age=300',
        },
      },
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
