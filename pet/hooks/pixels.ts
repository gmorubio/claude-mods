// The pets' shared pixel engine: frames are W x H grids of palette letters,
// '.' being transparent, stamped together from small parts; a species lists
// its frames and how its activities play them.

export const W = 32
export const H = 24

export const PALETTE: Record<string, number> = {
  // The cat.
  o: 0x0a080c, // outline
  c: 0x25212a, // fur
  l: 0x4b4556, // fur highlight
  d: 0x2f2a36, // fur sheen
  s: 0x16131a, // fur shadow
  w: 0x343039, // muzzle, chest, paws
  v: 0x2b2730, // muzzle shadow
  g: 0xf5cf3a, // irises
  y: 0xa6a3ae, // whiskers
  // The dog.
  O: 0x2b1a0e, // outline
  D: 0x8e5a2e, // fur
  G: 0xb07740, // fur highlight
  F: 0x5e3818, // ears
  S: 0x6f4422, // fur shadow
  E: 0xd2a06a, // muzzle, chest, paws
  V: 0xb7864f, // muzzle shadow
  N: 0x1a1210, // nose
  T: 0xd4e157, // tennis ball
  U: 0x9aab2c, // tennis ball seam
  K: 0xf0e6d2, // bone
  J: 0xc9b896, // bone shadow
  A: 0x4f9fd6, // water
  a: 0xa8d8f8, // water highlight
  Q: 0xb9ab98, // dust
  // The otter.
  I: 0x24170e, // outline
  B: 0x6b4a32, // fur
  L: 0x8f6a4a, // fur highlight
  M: 0x4e3422, // fur shadow
  C: 0xe8d3b0, // face, belly
  Y: 0x8c939c, // rock
  Z: 0x5f666f, // rock shadow
  X: 0xb8bec6, // rock highlight
  j: 0x3a7fb4, // deep water
  i: 0xdff1ff, // splash
  // Shared.
  e: 0x0a080c, // pupils
  h: 0xffffff, // eye glints
  p: 0xe48aa0, // ears, nose, tongue, toe beans
  b: 0x6a9fd8, // bowl
  n: 0x4a78b0, // bowl shadow
  k: 0xa9cdf2, // bowl rim
  m: 0xfffdf8, // milk
  z: 0x9aa7c7, // the z's
  r: 0xd9566b, // yarn
  R: 0xa53a50, // yarn shadow
  q: 0xf29aa8, // yarn highlight
  P: 0x7a2236, // yarn deep shadow
  f: 0x8a8f9c, // fly
  W: 0xc4e0ff, // fly wings
}

export type Grid = string[][]

export const blank = (): Grid =>
  Array.from({ length: H }, () => Array.from({ length: W }, () => '.'))

export const stamp = (grid: Grid, rows: readonly string[], x: number, y: number) => {
  rows.forEach((row, dy) => {
    ;[...row].forEach((ch, dx) => {
      const gx = x + dx
      const gy = y + dy
      if (ch !== '.' && gx >= 0 && gx < W && gy >= 0 && gy < H) {
        grid[gy][gx] = ch
      }
    })
  })
}

export const mirror = (grid: Grid): Grid => grid.map(row => [...row].reverse())

export const mod = (n: number, m: number) => ((n % m) + m) % m

export type Inside = (x: number, y: number) => boolean

export const inEllipse = (cx: number, cy: number, rx: number, ry: number): Inside => (x, y) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1

// The letters a shape is filled with: its outline, the highlight along its
// top, the shadow along its bottom, its stripes or sheen, and the fur.
export type Coat = { edge: string; light: string; shade: string; stripe: string; base: string }

export const CAT_COAT: Coat = { edge: 'o', light: 'l', shade: 's', stripe: 'd', base: 'c' }
export const DOG_COAT: Coat = { edge: 'O', light: 'G', shade: 'S', stripe: 'D', base: 'D' }
export const OTTER_COAT: Coat = { edge: 'I', light: 'L', shade: 'M', stripe: 'B', base: 'B' }

// Fills a shape with an outline, a highlight along its top, a shadow along
// its bottom and, optionally, stripes every fourth column from `stripeFrom`.
export const fill = (grid: Grid, inside: Inside, coat: Coat, stripeFrom?: number) => {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
      grid[y][x] = edge
        ? coat.edge
        : !inside(x, y - 2)
          ? coat.light
          : !inside(x, y + 2)
            ? coat.shade
            : stripeFrom !== undefined && Math.round(x - stripeFrom) % 4 === 0
              ? coat.stripe
              : coat.base
    }
  }
}

// A filled, outlined, shaded ellipse with stripes across its upper half.
export const ellipse = (grid: Grid, cx: number, cy: number, rx: number, ry: number, coat: Coat) => {
  fill(grid, inEllipse(cx, cy, rx, ry), coat, cx)
  for (let y = Math.ceil(cy + 1); y < H; y++) {
    for (let x = 0; x < W; x++) if (grid[y][x] === coat.stripe) grid[y][x] = coat.base
  }
}

// A thick line from (x1, y1) to (x2, y2), as a shape `fill` can take.
export const inSegment = (x1: number, y1: number, x2: number, y2: number, radius: number): Inside => (x, y) => {
  const dx = x2 - x1
  const dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) <= radius
}

export const Z_BIG = ['zzzzz', '...z.', '..z..', '.z...', 'zzzzz']
export const Z_MID = ['zzzz', '..z.', '.z..', 'zzzz']
export const Z_SMALL = ['z']

export const stampZs = (grid: Grid, zs: [number, number][]) =>
  zs.forEach(([zx, zy], i) => stamp(grid, [Z_SMALL, Z_MID, Z_BIG][i], zx, zy))

// The SVG for one frame: runs of same-colored pixels as rects, no background.
export const svgFor = (grid: Grid, scale: number) => {
  const rects: string[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < W) {
      const ch = row[x]
      let end = x + 1
      while (end < W && row[end] === ch) end++
      if (ch !== '.') {
        const color = '#' + PALETTE[ch].toString(16).padStart(6, '0')
        rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${color}"/>`)
      }
      x = end
    }
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * scale}" height="${H * scale}" shape-rendering="crispEdges">${rects.join('')}</svg>`
}

export type Steps = [frame: string, ms: number][]

// A pet: its frames, and how its activities play them. Every species sleeps
// ('sleep'); the others are its awake activities. An awake activity either
// loops for its `lengthMs`, or is in `oneShot` and plays once, start to end.
// Moving between two activities plays the first one's `enter` backwards, its
// `neutral` frame, then the second one's `enter`.
export type Species = {
  frames: Record<string, Grid>
  neutral: string
  sequences: Record<string, Steps>
  enter: Record<string, Steps>
  awake: readonly string[]
  oneShot: readonly string[]
  lengthMs: Record<string, number>
  alt: Record<string, string>
}

// A scene is an activity ('yarn') or a transition between two ('sit>yarn').
export const isTransition = (scene: string) => scene.includes('>')

export const activityOf = (scene: string) => scene.split('>').pop() ?? 'sleep'

const stepsOf = (pet: Species, scene: string): Steps => {
  if (!isTransition(scene)) return pet.sequences[scene] ?? pet.sequences.sleep
  const [from, to] = scene.split('>')
  return [...[...(pet.enter[from] ?? [])].reverse(), [pet.neutral, 200], ...(pet.enter[to] ?? [])]
}

export const durationOf = (pet: Species, scene: string) =>
  stepsOf(pet, scene).reduce((sum, [, ms]) => sum + ms, 0)

// How long an awake activity lasts before the pet moves on.
export const lengthOf = (pet: Species, activity: string) =>
  pet.oneShot.includes(activity) ? durationOf(pet, activity) : (pet.lengthMs[activity] ?? 60_000)

// The frame a scene shows `elapsedMs` after it began: an activity loops, a
// transition or a one-shot activity plays once and holds its last frame.
export const frameAt = (pet: Species, scene: string, elapsedMs: number) => {
  const steps = stepsOf(pet, scene)
  const total = durationOf(pet, scene)
  const isOnce = isTransition(scene) || pet.oneShot.includes(scene)
  let t = isOnce ? Math.min(elapsedMs, total - 1) : elapsedMs % total
  for (const [name, ms] of steps) {
    if (t < ms) return name
    t -= ms
  }
  return steps[steps.length - 1][0]
}
