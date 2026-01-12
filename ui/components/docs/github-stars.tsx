/**
 * GitHub Stars Component
 *
 * Displays GitHub repository stars with Octocat icon.
 * Server provides initial star count via Suspense pattern.
 * No client-side reactivity needed - value comes from server.
 */

import { GitHubIcon } from '../ui/icon'

export interface GitHubStarsProps {
  repo?: string
  /** Star count from server */
  initialStars?: number | null
}

// Format star count (e.g., 1234 -> 1K)
function formatStars(count: number): string {
  if (count >= 1000) {
    return `${Math.round(count / 1000)}K`
  }
  return count.toString()
}

export function GitHubStars({ repo = 'kfly8/barefootjs', initialStars = null }: GitHubStarsProps) {
  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors no-underline"
      aria-label="View on GitHub"
    >
      <GitHubIcon size="md" class="text-foreground" />
      {/* Fixed width for 2 digits */}
      <span data-github-stars class="text-sm font-medium min-w-[1.25rem] text-right tabular-nums">
        {initialStars !== null ? formatStars(initialStars) : null}
      </span>
    </a>
  )
}
