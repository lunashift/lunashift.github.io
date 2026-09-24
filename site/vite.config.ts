import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Where the site will actually be served from. Social cards need absolute URLs. */
const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://solomon-69.github.io/UI-components/lunashift/').replace(/\/?$/, '/')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'luna-site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    },
  ],
  build: {
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion'
        },
      },
    },
  },
})
