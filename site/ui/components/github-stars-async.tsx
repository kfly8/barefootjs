/**
 * Async GitHub Stars Wrapper (Server Component)
 *
 * Fetches star count from GitHub API on server side.
 * This component should be wrapped in Suspense.
 */

import { GitHubStars } from './github-stars'

// Server-side cache (in-memory, resets on server restart)
const cache = new Map<string, { count: number; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour for server cache

async function fetchGitHubStars(repo: string): Promise<number | null> {
  // Check server-side cache
  const cached = cache.get(repo)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.count
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add User-Agent to avoid rate limiting
        'User-Agent': 'barefootjs-ui',
      },
    })

    if (response.ok) {
      const data = await response.json()
      const count = data.stargazers_count
      // Update server cache
      cache.set(repo, { count, timestamp: Date.now() })
      return count
    }
  } catch {
    // Return cached value if available, even if expired
    if (cached) return cached.count
  }

  return null
}

export interface AsyncGitHubStarsProps {
  repo?: string
}

export async function AsyncGitHubStars({ repo = 'kfly8/barefootjs' }: AsyncGitHubStarsProps) {
  const stars = await fetchGitHubStars(repo)
  return <GitHubStars repo={repo} initialStars={stars} />
}
