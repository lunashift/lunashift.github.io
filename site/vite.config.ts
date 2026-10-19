import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Where the site will actually be served from. Social cards need absolute URLs. */
const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://solomon-69.github.io/UI-components/lunashift/').replace(/\/?$/, '/')

/**
 * Security rules for the built page (GitHub Pages cannot send headers, so they
 * go in meta tags). Only this site's own files may load; the one inline script
 * (the theme pick in index.html) is allowed by its hash, so editing it means
 * updating the hash. Build only: the dev server needs its own live-reload code.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'sha256-NPPu9sIctzAEaKPdJ8AJ+zJFpb0DK2pDA+0BGUWOaUc='",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ')
const SECURITY_META = `<meta http-equiv="Content-Security-Policy" content="${CSP}" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />`

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'luna-site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    },
    {
      name: 'luna-security-meta',
      apply: 'build',
      transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${SECURITY_META}`),
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
