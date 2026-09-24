// Builds public/og.jpg, the 1200x630 card shown when the site is shared.
// Uses the same framed hero phone as the page, so the card never drifts from the site.
// Georgia stands in for Lora here because the card is rasterised outside the browser.
import sharp from 'sharp'
import path from 'node:path'

const PUBLIC = path.resolve('public')
const W = 1200
const H = 630
const INK = '#34221e'
const MUTED = '#75615a'

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="a" cx="18%" cy="6%" r="72%">
      <stop offset="0%" stop-color="#f1d8ce" stop-opacity="0.95"/>
      <stop offset="60%" stop-color="#f7e9e3" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#fcf6f1" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="88%" cy="88%" r="60%">
      <stop offset="0%" stop-color="#f7e9e3" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#fcf6f1" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#fcf6f1"/>
  <rect width="${W}" height="${H}" fill="url(#a)"/>
  <rect width="${W}" height="${H}" fill="url(#b)"/>
</svg>`)

const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <text x="164" y="132" font-family="Helvetica Neue, Helvetica, sans-serif" font-size="30" font-weight="500" letter-spacing="0.4" fill="${INK}">Luna Shift</text>
  <text x="112" y="286" font-family="Georgia, serif" font-size="62" fill="${INK}">Your perimenopause,</text>
  <text x="112" y="360" font-family="Georgia, serif" font-size="62" fill="${INK}">tracked privately.</text>
  <text x="112" y="430" font-family="Helvetica Neue, Helvetica, sans-serif" font-size="27" fill="${MUTED}">Log symptoms, hormone therapy and daily factors</text>
  <text x="112" y="470" font-family="Helvetica Neue, Helvetica, sans-serif" font-size="27" fill="${MUTED}">in seconds. Everything stays on your phone.</text>
  <rect x="112" y="516" width="196" height="3" rx="1.5" fill="#ad614d" opacity="0.5"/>
  <text x="112" y="560" font-family="Helvetica Neue, Helvetica, sans-serif" font-size="23" font-weight="500" fill="#955342">No account. Nothing uploaded.</text>
</svg>`)

const icon = await sharp(path.join(PUBLIC, 'apple-touch-icon.png')).resize(44, 44).png().toBuffer()

const PHONE_H = 560
const phone = await sharp(path.join(PUBLIC, 'screens/today-home-hero-870.webp'))
  .resize({ height: PHONE_H })
  .png()
  .toBuffer()
const { width: pw } = await sharp(phone).metadata()

await sharp(background)
  .composite([
    { input: phone, left: W - pw - 132, top: Math.round((H - PHONE_H) / 2) },
    { input: icon, left: 112, top: 88 },
    { input: text, left: 0, top: 0 },
  ])
  .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
  .toFile(path.join(PUBLIC, 'og.jpg'))

console.log('og.jpg written')
