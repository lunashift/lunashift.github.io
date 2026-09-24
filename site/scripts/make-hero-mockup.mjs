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

await sharp(composed)
  .trim({ threshold: 1 })
  .resize({ width: OUT_WIDTH })
  .webp({ quality: 88, alphaQuality: 100 })
  .toFile(OUT)

const out = await sharp(OUT).metadata()
console.log(`hero ${out.width}x${out.height}`)
