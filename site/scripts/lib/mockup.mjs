// Helpers for turning a flattened photographic mockup into a usable site asset.
//
// The supplied mockups are previews, not editable templates: the "transparent" screen is
// a painted checkerboard and the phone sits on an opaque grey backdrop. So two jobs:
// find the screen's four corners and perspective-map a capture onto them, then lift the
// phone off the backdrop.
import sharp from 'sharp'

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b

export async function readRGBA(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height, c: info.channels }
}

/** Pixels reachable from the image border while `passable` holds. */
function floodFromBorder(w, h, passable) {
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, 0, x, h - 1)
  for (let y = 0; y < h; y++) stack.push(0, y, w - 1, y)
  while (stack.length) {
    const y = stack.pop()
    const x = stack.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const i = y * w + x
    if (seen[i] || !passable(x, y, i)) continue
    seen[i] = 1
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }
  return seen
}

/**
 * The screen quad: the bright region sealed off from the backdrop by the dark bezel.
 * Returned corners are ordered top-left, top-right, bottom-right, bottom-left.
 */
export function findScreenQuads(
  { data, w, h, c },
  { darkBelow = 95, brightAbove = 150, count = 1, seal = 'dark', backdropTolerance = 14 } = {},
) {
  const isDark = (i) => lum(data[i * c], data[i * c + 1], data[i * c + 2]) < darkBelow

  // What stops the backdrop from flowing into a screen. 'dark' relies on the bezel, which
  // is enough for one phone. Where phones overlap, an inner bezel is hidden and the
  // backdrop can slip through the silver rim instead, so 'backdrop' floods only pixels
  // that still match the corner colour and stops at the first thing that is not backdrop.
  const passable =
    seal === 'backdrop'
      ? (() => {
          const corner = [0, 1, 2].map((ch) => data[ch])
          return (i) =>
            Math.max(...[0, 1, 2].map((ch) => Math.abs(data[i * c + ch] - corner[ch]))) <= backdropTolerance
        })()
      : (i) => !isDark(i)
  const outside = floodFromBorder(w, h, (_x, _y, i) => passable(i))

  // Every bright blob the backdrop cannot reach: one per screen.
  const label = new Int32Array(w * h).fill(-1)
  const blobs = []
  let id = 0
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1 || outside[start] || isDark(start)) continue
    if (lum(data[start * c], data[start * c + 1], data[start * c + 2]) < brightAbove) continue
    const stack = [start]
    label[start] = id
    let size = 0
    while (stack.length) {
      const p = stack.pop()
      size++
      const x = p % w
      const y = (p / w) | 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const n = ny * w + nx
        if (label[n] !== -1 || outside[n] || isDark(n)) continue
        if (lum(data[n * c], data[n * c + 1], data[n * c + 2]) < brightAbove) continue
        label[n] = id
        stack.push(n)
      }
    }
    blobs.push({ size, id })
    id++
  }
  const screens = blobs.sort((a, b) => b.size - a.size).slice(0, count)
  if (screens.length < count) throw new Error(`found ${screens.length} screen regions, expected ${count}`)

  const results = []
  for (const { id: blobId, size } of screens) {
    // Extreme points are a starting guess only. On a rounded rectangle they land part way
    // round the corner arcs, not on the true corners, which skews the whole mapping. So fit
    // a line to each of the four straight sides and intersect them for the real corners.
    let tl = null, br = null, tr = null, bl = null
    for (let p = 0; p < w * h; p++) {
      if (label[p] !== blobId) continue
      const x = p % w
      const y = (p / w) | 0
      if (!tl || x + y < tl[0] + tl[1]) tl = [x, y]
      if (!br || x + y > br[0] + br[1]) br = [x, y]
      if (!tr || x - y > tr[0] - tr[1]) tr = [x, y]
      if (!bl || x - y < bl[0] - bl[1]) bl = [x, y]
    }
    const rough = [tl, tr, br, bl]

    // Outer boundary pixels of the screen region. The Dynamic Island is a hole punched in
    // the middle of the top edge, and its outline would drag that edge's fit inward, so only
    // boundary pixels facing the world outside the screen count.
    const exterior = floodFromBorder(w, h, (_x, _y, i) => label[i] !== blobId)
    const edge = []
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x
        if (label[p] !== blobId) continue
        if (exterior[p - 1] || exterior[p + 1] || exterior[p - w] || exterior[p + w]) {
          edge.push(x, y)
        }
      }
    }

    // Total-least-squares line through a set of points, returned as a point and a direction.
    const fitLine = (pts) => {
      let sx = 0, sy = 0
      for (let i = 0; i < pts.length; i += 2) {
        sx += pts[i]
        sy += pts[i + 1]
      }
      const n = pts.length / 2
      const mx = sx / n
      const my = sy / n
      let xx = 0, yy = 0, xy = 0
      for (let i = 0; i < pts.length; i += 2) {
        const dx = pts[i] - mx
        const dy = pts[i + 1] - my
        xx += dx * dx
        yy += dy * dy
        xy += dx * dy
      }
      const theta = 0.5 * Math.atan2(2 * xy, xx - yy)
      return { p: [mx, my], d: [Math.cos(theta), Math.sin(theta)] }
    }

    // Fit each side in two passes. The rough line runs between points that sit part way
    // round the corner arcs, so it lies well inside the true edge: pass one casts a wide
    // net to find roughly the right line, pass two tightens around it. Both passes skip the
    // arcs, which curve inward and would drag the fit off the straight run.
    const sides = []
    for (let i = 0; i < 4; i++) {
      const a = rough[i]
      const b = rough[(i + 1) % 4]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      let line = { p: a, d: [(b[0] - a[0]) / len, (b[1] - a[1]) / len] }

      for (const [band, lo, hi] of [
        [Math.max(30, len * 0.08), 0.28, 0.72],
        [Math.max(6, len * 0.02), 0.18, 0.82],
      ]) {
        const ux = line.d[0]
        const uy = line.d[1]
        const picked = []
        for (let k = 0; k < edge.length; k += 2) {
          const px = edge[k] - a[0]
          const py = edge[k + 1] - a[1]
          const along = (px * ux + py * uy) / len
          if (along < lo || along > hi) continue
          const qx = edge[k] - line.p[0]
          const qy = edge[k + 1] - line.p[1]
          if (Math.abs(qx * uy - qy * ux) > band) continue
          picked.push(edge[k], edge[k + 1])
        }
        if (picked.length >= 40) line = fitLine(picked)
      }
      sides.push(line)
    }

    const intersect = (l1, l2) => {
      const det = l1.d[0] * -l2.d[1] - -l2.d[0] * l1.d[1]
      if (Math.abs(det) < 1e-9) return null
      const rx = l2.p[0] - l1.p[0]
      const ry = l2.p[1] - l1.p[1]
      const t = (rx * -l2.d[1] - -l2.d[0] * ry) / det
      return [l1.p[0] + t * l1.d[0], l1.p[1] + t * l1.d[1]]
    }

    // corner i is where side (i-1) meets side i
    const corners = []
    for (let i = 0; i < 4; i++) {
      const hit = intersect(sides[(i + 3) % 4], sides[i])
      corners.push(hit ?? rough[i])
    }

    // The blob itself is the exact screen shape: rounded corners, island excluded.
    const mask = Buffer.alloc(w * h * 4)
    for (let p = 0; p < w * h; p++) if (label[p] === blobId) mask[p * 4 + 3] = 255
    results.push({ quad: corners, area: size, mask, centroidX: corners.reduce((t, q) => t + q[0], 0) / 4 })
  }
  // Left to right, so callers can pair screens with captures in reading order.
  results.sort((x, y) => x.centroidX - y.centroidX)
  return { screens: results, w, h }
}

/** Convenience wrapper for the single-screen case. */
export function findScreenQuad(img, opts = {}) {
  const { screens, w, h } = findScreenQuads(img, { ...opts, count: 1 })
  return { ...screens[0], w, h }
}

/** Homography mapping the unit square onto the quad, as used for inverse sampling. */
function homography([tl, tr, br, bl]) {
  // Solve for the 8 unknowns of the projective map from (0,0),(1,0),(1,1),(0,1).
  const src = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const dst = [tl, tr, br, bl]
  const A = []
  const b = []
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i]
    const [x, y] = dst[i]
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x])
    b.push(x)
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y])
    b.push(y)
  }
  // Gaussian elimination.
  for (let i = 0; i < 8; i++) {
    let pivot = i
    for (let r = i + 1; r < 8; r++) if (Math.abs(A[r][i]) > Math.abs(A[pivot][i])) pivot = r
    ;[A[i], A[pivot]] = [A[pivot], A[i]]
    ;[b[i], b[pivot]] = [b[pivot], b[i]]
    for (let r = 0; r < 8; r++) {
      if (r === i) continue
      const f = A[r][i] / A[i][i]
      for (let ccol = i; ccol < 8; ccol++) A[r][ccol] -= f * A[i][ccol]
      b[r] -= f * b[i]
    }
  }
  const m = b.map((v, i) => v / A[i][i])
  return [m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], 1]
}

/** Inverse of a 3x3, for going from page pixel back to capture pixel. */
function invert3(m) {
  const [a, b, c, d, e, f, g, h, i] = m
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
  return [
    (e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det,
  ]
}

/**
 * Draws `capture` onto `quad` inside a transparent canvas of w x h, with bilinear
 * sampling so the warped text stays readable.
 */
export async function warpOntoQuad(captureFile, quad, w, h, { overscan = 1.004 } = {}) {
  const cap = await readRGBA(captureFile)
  // A hair of overscan covers rounding at the very edge; the screen-shaped mask trims it.
  const cx = quad.reduce((a, p) => a + p[0], 0) / 4
  const cy = quad.reduce((a, p) => a + p[1], 0) / 4
  quad = quad.map(([x, y]) => [cx + (x - cx) * overscan, cy + (y - cy) * overscan])
  const H = homography(quad)
  const Hi = invert3(H)
  const out = Buffer.alloc(w * h * 4)

  const xs = quad.map((p) => p[0])
  const ys = quad.map((p) => p[1])
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 2)
  const x1 = Math.min(w - 1, Math.ceil(Math.max(...xs)) + 2)
  const y0 = Math.max(0, Math.floor(Math.min(...ys)) - 2)
  const y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)) + 2)

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5
      const dy = y + 0.5
      const wz = Hi[6] * dx + Hi[7] * dy + Hi[8]
      const u = (Hi[0] * dx + Hi[1] * dy + Hi[2]) / wz
      const v = (Hi[3] * dx + Hi[4] * dy + Hi[5]) / wz
      if (u < 0 || v < 0 || u >= 1 || v >= 1) continue
      const sx = u * (cap.w - 1)
      const sy = v * (cap.h - 1)
      const ix = Math.floor(sx)
      const iy = Math.floor(sy)
      const fx = sx - ix
      const fy = sy - iy
      const ix2 = Math.min(ix + 1, cap.w - 1)
      const iy2 = Math.min(iy + 1, cap.h - 1)
      const o = (y * w + x) * 4
      for (let ch = 0; ch < 3; ch++) {
        const p00 = cap.data[(iy * cap.w + ix) * cap.c + ch]
        const p10 = cap.data[(iy * cap.w + ix2) * cap.c + ch]
        const p01 = cap.data[(iy2 * cap.w + ix) * cap.c + ch]
        const p11 = cap.data[(iy2 * cap.w + ix2) * cap.c + ch]
        out[o + ch] = p00 * (1 - fx) * (1 - fy) + p10 * fx * (1 - fy) + p01 * (1 - fx) * fy + p11 * fx * fy
      }
      out[o + 3] = 255
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
}

/**
 * Lifts the phone off its backdrop.
 *
 * Brightness alone cannot separate a silver phone from a light grey backdrop, so the test
 * is structural rather than tonal: the backdrop is the smooth, untextured region the image
 * border can reach, and the device is whatever that region encloses. A blur-and-threshold
 * pass then shaves off the thin fringes where the baked shadow breaks that smoothness,
 * since a neutral grey shadow would read as a cold halo against a warm page. The site
 * casts its own shadow in CSS instead.
 */
export async function matteFromBackdrop(file, { seedTolerance = 14, open = 16, keep = 160 } = {}) {
  const { data, w, h, c } = await readRGBA(file)
  const blurred = await sharp(file).removeAlpha().blur(60).raw().toBuffer()

  const flat = (i) =>
    Math.max(
      Math.abs(data[i * c] - blurred[i * 3]),
      Math.abs(data[i * c + 1] - blurred[i * 3 + 1]),
      Math.abs(data[i * c + 2] - blurred[i * 3 + 2]),
    ) < seedTolerance
  const backdrop = floodFromBorder(w, h, (_x, _y, i) => flat(i))

  // Morphological opening: blur then threshold, which drops thin fringes and specks while
  // leaving the solid body of the device untouched.
  const rough = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) rough[i] = backdrop[i] ? 0 : 255
  const opened = await sharp(rough, { raw: { width: w, height: h, channels: 1 } })
    .blur(open)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const stride = opened.info.channels
  const solid = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) if (opened.data[i * stride] > keep) solid[i] = 1

  // Re-fill anything the opening hollowed out, so interior detail never punches through.
  const outside = floodFromBorder(w, h, (_x, _y, i) => !solid[i])
  const inside = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) inside[i] = outside[i] ? 0 : 1

  const minArea = Math.round(w * h * 0.002)
  const seen = new Uint8Array(w * h)
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !inside[start]) continue
    const blob = [start]
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const p = stack.pop()
      const x = p % w
      const y = (p / w) | 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const n = ny * w + nx
        if (seen[n] || !inside[n]) continue
        seen[n] = 1
        blob.push(n)
        stack.push(n)
      }
    }
    if (blob.length < minArea) for (const p of blob) inside[p] = 0
  }

  const alpha = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) alpha[i] = inside[i] ? 255 : 0
  const feathered = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } })
    .blur(1.1)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const fStride = feathered.info.channels

  const out = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = data[i * c]
    out[i * 4 + 1] = data[i * c + 1]
    out[i * 4 + 2] = data[i * c + 2]
    out[i * 4 + 3] = feathered.data[i * fStride]
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
}
