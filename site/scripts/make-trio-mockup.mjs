// Builds the "Log in seconds" image from the three-phone mockup in screens-src/.
//
// Like the hero, the mockup ships flattened, so each capture is perspective-mapped onto a
// detected screen. Two extra wrinkles here:
//
//  * The phones overlap, so the outer two screens are partly hidden behind the middle one.
//    Only three of their four edges are real; the fourth is just where the middle phone
//    cuts across. Each clipped screen is rebuilt to full size from its three good edges
//    and the capture's own proportions, then masked back to the part you can actually see.
//  * The backdrop is plain white rather than transparent, so the phones are cut off it.
//
//   npm run trio
import sharp from 'sharp'
import path from 'node:path'
import { findScreenQuads, readRGBA, warpOntoQuad } from './lib/mockup.mjs'

const SRC = path.resolve('screens-src')
const MOCKUP = path.join(SRC, 'mock-trio.webp')
const OUT = path.resolve('public/trio-log.webp')
const OUT_WIDTH = 1600

// Left to right, matching the order findScreenQuads returns.
const CAPTURES = ['today-home-hero', 'today-factors', 'patterns-apple-health']
const SCREEN_RATIO = 920 / 2000 // the captures' own shape, and the screen's

const img = await readRGBA(MOCKUP)
const { screens, w, h } = findScreenQuads(img, { count: 3, seal: 'backdrop', brightAbove: 232 })

/**
 * Rebuild a screen that the middle phone cuts across.
 *
 * These phones sit square on, so the visible region is an upright rectangle missing a
 * strip on whichever side faces the middle of the picture. The three surviving edges give
 * the height and one vertical edge; the capture's proportions give the width.
 */
function fullQuad(quad, imageCentreX) {
  const xs = quad.map((p) => p[0])
  const ys = quad.map((p) => p[1])
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const top = Math.min(...ys)
  const bottom = Math.max(...ys)
  const height = bottom - top
  const wanted = height * SCREEN_RATIO
  if (right - left >= wanted - 2) return quad // nothing hidden

  // The hidden strip is on the side facing the centre of the picture.
  const clippedOnRight = (left + right) / 2 < imageCentreX
  const x0 = clippedOnRight ? left : right - wanted
  const x1 = clippedOnRight ? left + wanted : right
  return [
    [x0, top],
    [x1, top],
    [x1, bottom],
    [x0, bottom],
  ]
}

/** Fill the pinholes the mockup's checkerboard labels leave, but keep the Dynamic Island. */
function fillPinholes(mask, minHole = 4000) {
  const inside = new Uint8Array(w * h)
  for (let p = 0; p < w * h; p++) inside[p] = mask[p * 4 + 3] ? 1 : 0
  const seen = new Uint8Array(w * h)
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || inside[start]) continue
    const blob = [start]
    const stack = [start]
    seen[start] = 1
    let touchesEdge = false
    while (stack.length) {
      const p = stack.pop()
      const x = p % w
      const y = (p / w) | 0
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesEdge = true
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const n = ny * w + nx
        if (seen[n] || inside[n]) continue
        seen[n] = 1
        blob.push(n)
        stack.push(n)
      }
    }
    if (!touchesEdge && blob.length < minHole) for (const p of blob) mask[p * 4 + 3] = 255
  }
  return mask
}

const layers = []
for (const [i, screen] of screens.entries()) {
  const quad = fullQuad(screen.quad, w / 2)
  const capture = path.join(SRC, `${CAPTURES[i]}.jpg`)
  const warped = await warpOntoQuad(capture, quad, w, h)
  const mask = fillPinholes(Buffer.from(screen.mask))
  layers.push(
    await sharp(warped)
      .composite([{ input: mask, raw: { width: w, height: h, channels: 4 }, blend: 'dest-in' }])
      .png()
      .toBuffer(),
  )
  console.log(`${CAPTURES[i]} -> screen ${i}`)
}

// Lift the phones off the plain white backdrop.
const { data, c } = img
const corner = [data[0], data[1], data[2]]
const alpha = Buffer.alloc(w * h)
const stack = []
for (let x = 0; x < w; x++) stack.push(x, 0, x, h - 1)
for (let y = 0; y < h; y++) stack.push(0, y, w - 1, y)
const isBackdrop = (i) => Math.max(...[0, 1, 2].map((ch) => Math.abs(data[i * c + ch] - corner[ch]))) <= 10
const bg = new Uint8Array(w * h)
while (stack.length) {
  const y = stack.pop()
  const x = stack.pop()
  if (x < 0 || y < 0 || x >= w || y >= h) continue
  const i = y * w + x
  if (bg[i] || !isBackdrop(i)) continue
  bg[i] = 1
  stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
}
for (let i = 0; i < w * h; i++) alpha[i] = bg[i] ? 0 : 255
const feathered = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } })
  .blur(1.1)
  .raw()
  .toBuffer({ resolveWithObject: true })
const stride = feathered.info.channels
const cut = Buffer.alloc(w * h * 4)
for (let i = 0; i < w * h; i++) {
  cut[i * 4] = data[i * c]
  cut[i * 4 + 1] = data[i * c + 1]
  cut[i * 4 + 2] = data[i * c + 2]
  cut[i * 4 + 3] = feathered.data[i * stride]
}

const composed = await sharp(cut, { raw: { width: w, height: h, channels: 4 } })
  .composite(layers.map((input) => ({ input, left: 0, top: 0 })))
  .png()
  .toBuffer()

await sharp(composed)
  .trim({ threshold: 1 })
  .resize({ width: OUT_WIDTH })
  .webp({ quality: 88, alphaQuality: 100 })
  .toFile(OUT)

const meta = await sharp(OUT).metadata()
console.log(`trio ${meta.width}x${meta.height}`)
