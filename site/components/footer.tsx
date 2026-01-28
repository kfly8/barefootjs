/**
 * Footer component
 *
 * Displays copyright and attribution.
 */

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="py-8 border-t border-border mt-16">
      <div className="text-center text-sm text-muted-foreground">
        <p>
          MIT License {year}{' '}
          <a
            href="https://kobaken.co"
            className="hover:text-foreground transition-colors"
          >
            kobaken
          </a>
        </p>
      </div>
    </footer>
  )
}
