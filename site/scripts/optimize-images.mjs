// Builds the site's phone imagery from the official captures in screens-src/.
//
// Each capture is composited INTO the real iPhone render (iphone-frame.webp), which
// has a transparent screen cut-out plus a true Dynamic Island, side keys and titanium
// rim. That means the site never fakes a device frame in CSS.
//
// Also emits the clean, frame-free texture used by the 3D hero, whose model carries
// its own island mesh.
import sharp from 'sharp'
import { readdir, mkdir } from 'node:fs/promises'
import path from 'node:path'

const SRC = path.resolve('screens-src')
const OUT = path.resolve('public/screens')
await mkdir(OUT, { recursive: true })

// Measured from iphone-frame.webp (2000x2000). The device occupies this box, and the
// transparent screen sits at SX/SY inside it.
const FRAME = { left: 565, top: 25, width: 870, height: 1800 }
const SCREEN = { x: 37, y: 33, width: 796, height: 1735 }
export const WIDTHS = [520, 870]

const frame = await sharp(path.join(SRC, 'iphone-frame.webp')).extract(FRAME).png().toBuffer()

/**
 * The device silhouette, as an alpha mask.
 *
 * The capture is laid down as a plain rectangle, but the device has rounded corners, so
 * the rectangle's own corners stick out past them and show up as pale squares floating
 * beside each phone. Flood-filling the transparent area inwards from the border gives
 * everything that is *not* the device; the inverse clips the capture to the device.
 */
async function deviceMask() {
  const { data, info } = await sharp(frame).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels } = info
  const outside = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, 0, x, h - 1)
  for (let y = 0; y < h; y++) stack.push(0, y, w - 1, y)
  while (stack.length) {
    const y = stack.pop()
    const x = stack.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const i = y * w + x
    if (outside[i] || data[i * channels + 3] >= 8) continue
    outside[i] = 1
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }
  // Must carry a real alpha channel: a greyscale mask would be fully opaque to `dest-in`.
  const mask = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) mask[i * 4 + 3] = outside[i] ? 0 : 255
  return sharp(mask, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
}

const silhouette = await deviceMask()

/**
 * A softly-feathered rounded-rectangle mask the size of the device box.
 *
 * The iPhone render's titanium rim catches a bright highlight that pools at each rounded
 * corner and reads as a tiny "bump" against a dark panel. Trimming a few pixels off each
 * corner with a radius a touch tighter than the render's own removes that glinting tip and
 * leaves a clean, evenly rounded corner. The straight edges — and the side keys on them —
 * are untouched.
 */
const CORNER_RADIUS = 168
async function cornerMask() {
  const svg = `<svg width="${FRAME.width}" height="${FRAME.height}"><rect x="0" y="0" width="${FRAME.width}" height="${FRAME.height}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="#fff"/></svg>`
  return sharp(Buffer.from(svg)).blur(0.6).png().toBuffer()
}
const corners = await cornerMask()

const captures = (await readdir(SRC)).filter((f) => f.endsWith('.jpg')).sort()
if (captures.length === 0) throw new Error(`no .jpg captures found in ${SRC}`)

for (const file of captures) {
  const id = file.replace(/\.jpg$/, '')
  const src = path.join(SRC, file)
  const { width, height } = await sharp(src).metadata()
  // Captures must be close to the screen's own aspect, or cover-fit would crop content.
  const drift = Math.abs(width / height - SCREEN.width / SCREEN.height)
  if (drift > 0.01) throw new Error(`${file} is ${width}x${height}; aspect is off by ${drift.toFixed(3)}`)

  const screen = await sharp(src).resize(SCREEN.width, SCREEN.height, { fit: 'cover' }).png().toBuffer()
  // Clip the capture to the device before the frame goes on top, so no corner escapes it.
  const clipped = await sharp({
    create: { width: FRAME.width, height: FRAME.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: screen, left: SCREEN.x, top: SCREEN.y },
      { input: silhouette, blend: 'dest-in' },
    ])
    .png()
    .toBuffer()
  const framed = await sharp(clipped).composite([{ input: frame, left: 0, top: 0 }]).png().toBuffer()
  // Trim the bright rim glint off the four corners, keeping the straight edges and keys.
  const composed = await sharp(framed).composite([{ input: corners, blend: 'dest-in' }]).png().toBuffer()

  for (const w of WIDTHS) {
    await sharp(composed)
      .resize({ width: w })
      .webp({ quality: 84, alphaQuality: 100 })
      .toFile(path.join(OUT, `${id}-${w}.webp`))
  }
  console.log('framed', id)
}
