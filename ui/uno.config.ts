import { defineConfig, presetWind } from 'unocss'

export default defineConfig({
  presets: [presetWind()],
  // Theme configuration with CSS variable references
  theme: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      success: {
        DEFAULT: 'hsl(var(--success))',
        foreground: 'hsl(var(--success-foreground))',
      },
      warning: {
        DEFAULT: 'hsl(var(--warning))',
        foreground: 'hsl(var(--warning-foreground))',
      },
      info: {
        DEFAULT: 'hsl(var(--info))',
        foreground: 'hsl(var(--info-foreground))',
      },
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
  },
  // Scan component files for class names
  content: {
    filesystem: [
      './*.tsx',
      './**/index.tsx',
      './pages/**/*.tsx',
      './_shared/**/*.tsx',
      './components/**/*.tsx',
      './dist/**/*.tsx',
    ],
  },
})
