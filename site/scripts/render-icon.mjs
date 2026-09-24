// Renders the Luna Shift app icon (Icon Composer bundle: 3 crescent layers on a warm gradient)
// into flat PNGs for the site. Glass/refraction effects are approximated with soft shadows.
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const SRC = '/Volumes/Extreme2pro/Code/LunaShift/LunaShift/AppIcon.icon/Assets'
const N = 1024
const ART = 0.7 // artwork occupies ~70% of the tile, matching the composed icon
const LAYERS = [
  { file: 'crescent_outer.svg', fill: '#bd8071', scale: 1.15, dx: 21.6, dy: -7.2 },
  { file: 'crescent_middle.svg', fill: '#d9a697', scale: 1.12, dx: 18, dy: 0 },
  { file: 'crescent_core.svg', fill: '#f6efe3', scale: 1.08, dx: 9, dy: 8 },
]

const bg = Buffer.from(
  `<svg width="${N}" height="${N}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8cfb0"/><stop offset="1" stop-color="#dfaa9d"/></linearGradient></defs><rect width="${N}" height="${N}" rx="229" fill="url(#g)"/></svg>`,
)

async function layer({ file, fill, scale, dx, dy }) {
  const raw = await readFile(`${SRC}/${file}`, 'utf8')
  const svg = /<path[^>]*\sfill=/.test(raw) ? raw.replace(/(<path[^>]*?)\sfill="[^"]*"/, `$1 fill="${fill}"`) : raw.replace('<path ', `<path fill="${fill}" `)
  const size = Math.round(N * scale * ART)
  const art = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
  const left = Math.round((N - size) / 2 + dx * ART)
  const top = Math.round((N - size) / 2 + dy * ART)
  const blank = () => sharp({ create: { width: N, height: N, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  const shifted = await blank().composite([{ input: art, left, top }]).png().toBuffer()
  // soft drop shadow: alpha of the layer, darkened, blurred, offset
  const alpha = await sharp(shifted).extractChannel('alpha').toBuffer()
  const shadow = await sharp(alpha).blur(16).toBuffer()
  const shadowRGBA = await sharp({ create: { width: N, height: N, channels: 3, background: '#2a1512' } }).joinChannel(shadow).png().toBuffer()
  const shadowLayer = await blank().composite([{ input: shadowRGBA, left: 6, top: 14 }]).png().toBuffer()
  return [shadowLayer, shifted]
}

let comps = []
for (const l of LAYERS) {
  const [sh, img] = await layer(l)
  comps.push({ input: await sharp(sh).linear([1, 1, 1, 0.35], [0, 0, 0, 0]).png().toBuffer() })
  comps.push({ input: img })
}
const icon = await sharp(bg).composite(comps).png().toBuffer()
await sharp(icon).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp(icon).resize(64, 64).png().toFile('public/favicon.png')
console.log('icon rendered')
