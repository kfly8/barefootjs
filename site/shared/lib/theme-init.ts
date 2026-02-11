/**
 * Theme initialization script string.
 *
 * Inline this in a <script> tag before any visible content to prevent FOUC.
 * Reads from localStorage and system preference to set the dark class on <html>.
 */
export const themeInitScript = `
(function() {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();
`
