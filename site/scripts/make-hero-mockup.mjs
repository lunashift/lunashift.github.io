// Builds the hero image from the photographic mockup in screens-src/.
//
// The mockup already has its background removed, so the only job left is the screen: the
// Today capture is perspective-mapped onto the screen's own four corners and masked to
// its exact rounded shape, leaving the bezel and Dynamic Island as the mockup's own.
//
//   npm run hero
import sharp from 'sharp'
import path from 'node:path'
import { findScreenQuad, readRGBA, warpOntoQuad } from './lib/mockup.mjs'

const SRC = path.resolve('screens-src')
const MOCKUP = path.join(SRC, 'mock-hero-cutout.png')
const CAPTURE = path.join(SRC, 'today-home-hero.jpg')
const OUT = path.resolve('public/hero-phone.webp')
const OUT_WIDTH = 1500

const mockup = await readRGBA(MOCKUP)
const { quad, mask, w, h } = findScreenQuad(mockup)
console.log('screen corners', quad.map((p) => p.join(',')).join('  '))

const warped = await warpOntoQuad(CAPTURE, quad, w, h)

// Clip the warped capture to the screen's real outline, so the bezel and the Dynamic
// Island stay the mockup's own.
const screen = await sharp(warped)
  .composite([{ input: mask, raw: { width: w, height: h, channels: 4 }, blend: 'dest-in' }])
  .png()
  .toBuffer()

// Two passes: sharp trims before it composites, so the trim has to follow in its own call.
const composed = await sharp(MOCKUP).composite([{ input: screen, left: 0, top: 0 }]).png().toBuffer()

/**
 * Drop the studio glint off the phone's thin black rail.
 *
 * Where the front phone is seen almost edge-on, its side is a narrow black rail, and the
 * mockup's lighting lays a bright strip of reflection along the outside of it. Against the
 * site's pale background that strip reads as a light fringe running down an otherwise dark
 * edge, so the edge does not match the rest of the phone. Cutting it away leaves the black
 * rail as the outline, which is what the eye expects.
 *
 * Only a bright pixel that sits within `RIM_DEPTH` of the outline *and* has the dark rail
 * directly behind it is cut. That test is what keeps the wide silver frame on the near side
 * — which is genuinely silver all the way in — untouched.
 *
 * On its own that test also nibbles the back phone wherever a dark side key happens to sit
 * near the outline, so a second test follows: a glint is a long unbroken strip down an edge,
 * and anything smaller than `MIN_GLINT` is some other dark detail and is put back.
 */
const RIM_DEPTH = 10 // how far in from the outline a pixel may be and still count as rim
const RIM_BRIGHT = 60 // a rim pixel this bright or brighter is reflection, not phone
const RAIL_DARK = 45 // luminance at or below this is the black rail
const RAIL_REACH = 13 // the rail has to lie within this many pixels to vouch for a cut
const MIN_GLINT = 400 // a run of cut pixels smaller than this is not a glint; keep it
function stripRailGlint({ data, w, h, c }) {
  const opaque = (i) => data[i * c + 3] > 128
  const lum = (i) => 0.2126 * data[i * c] + 0.7152 * data[i * c + 1] + 0.0722 * data[i * c + 2]

  // Depth of every opaque pixel below the outline, by flooding inwards from the transparent
  // side. Anything deeper than RIM_DEPTH is interior and is never considered.
  const depth = new Int32Array(w * h).fill(-1)
  let front = []
  for (let i = 0; i < w * h; i++) {
    if (!opaque(i)) {
      depth[i] = 0
      front.push(i)
    }
  }
  for (let d = 1; d <= RIM_DEPTH && front.length; d++) {
    const next = []
    for (const i of front) {
      const x = i % w
      const y = (i / w) | 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const n = ny * w + nx
        if (depth[n] !== -1) continue
        depth[n] = d
        next.push(n)
      }
    }
    front = next
  }

  const cut = []
  for (let i = 0; i < w * h; i++) {
    if (depth[i] < 1 || depth[i] > RIM_DEPTH || lum(i) < RIM_BRIGHT) continue
    const x = i % w
    const y = (i / w) | 0
    let backed = false
    for (let dy = -RAIL_REACH; dy <= RAIL_REACH && !backed; dy++) {
      const ny = y + dy
      if (ny < 0 || ny >= h) continue
      for (let dx = -RAIL_REACH; dx <= RAIL_REACH; dx++) {
        const nx = x + dx
        if (nx < 0 || nx >= w) continue
        const n = ny * w + nx
        if (opaque(n) && lum(n) <= RAIL_DARK) {
          backed = true
          break
        }
      }
    }
    if (backed) cut.push(i)
  }

  // Keep only the long strips: walk each connected run of candidates and drop the small ones.
  const candidate = new Uint8Array(w * h)
  for (const i of cut) candidate[i] = 1
  const seen = new Uint8Array(w * h)
  let removed = 0
  for (const start of cut) {
    if (seen[start]) continue
    const run = []
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const i = stack.pop()
      run.push(i)
      const x = i % w
      const y = (i / w) | 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const n = ny * w + nx
        if (candidate[n] && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
      }
    }
    if (run.length < MIN_GLINT) continue
    for (const i of run) data[i * c + 3] = 0
    removed += run.length
  }
  return removed
}

/**
 * Tidy the cut-out's outline.
 *
 * The supplied mockup was lifted off its backdrop by hand, and along the phone's long
 * diagonal rim the alpha stair-steps and speckles. Against the site's pale background
 * that fringe reads as a ragged, dirty edge. Smoothing the alpha and then pulling it in
 * drops the noisy half-transparent pixels and leaves a cleanly anti-aliased silhouette.
 * Only the alpha is touched — the phone's own pixels are untouched.
 */
const EDGE_SMOOTH = 0.9 // blur sigma applied to the alpha, to even out the staircase
const EDGE_CUT = 0.34 // alpha below this is dropped, eroding the outline by about a pixel
const EDGE_GAIN = 1.7 // re-steepens what is left, so the edge stays crisp rather than hazy
async function cleanEdge(png) {
  const rgb = await sharp(png).removeAlpha().png().toBuffer()
  const alpha = await sharp(png)
    .extractChannel('alpha')
    .blur(EDGE_SMOOTH)
    .linear(EDGE_GAIN, -EDGE_GAIN * EDGE_CUT * 255)
    .toColourspace('b-w')
    .png()
    .toBuffer()
  return sharp(rgb).joinChannel(alpha).png().toBuffer()
}

const railed = await readRGBA(composed)
console.log('rail glint pixels cut', stripRailGlint(railed))
const deglinted = await sharp(railed.data, {
  raw: { width: railed.w, height: railed.h, channels: railed.c },
})
  .png()
  .toBuffer()

await sharp(await cleanEdge(deglinted))
  .trim({ threshold: 1 })
  .resize({ width: OUT_WIDTH })
  .webp({ quality: 88, alphaQuality: 100 })
  .toFile(OUT)

const out = await sharp(OUT).metadata()
console.log(`hero ${out.width}x${out.height}`)
