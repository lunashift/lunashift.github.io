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

await sharp(await cleanEdge(composed))
  .trim({ threshold: 1 })
  .resize({ width: OUT_WIDTH })
  .webp({ quality: 88, alphaQuality: 100 })
  .toFile(OUT)

const out = await sharp(OUT).metadata()
console.log(`hero ${out.width}x${out.height}`)
