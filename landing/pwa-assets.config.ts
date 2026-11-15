import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: {
      ...minimal2023Preset.transparent,
      padding: 0,
    },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: { fit: 'contain', background: '#0F172A' },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0,
      resizeOptions: { fit: 'contain', background: '#0F172A' },
    },
    png: { compressionLevel: 9, quality: 90 },
  },
  images: ['public/pwa-icon.svg'],
})
