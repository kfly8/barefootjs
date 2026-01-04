import { defineConfig, presetWind } from 'unocss'

export default defineConfig({
  presets: [presetWind()],
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
