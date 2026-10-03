// The otter: a round brown otter with a cream face and belly that never lets
// go of its favorite rock. Asleep, it floats on its back holding the rock;
// awake, it swims in its pond or plays with the rock.

import {
  H,
  OTTER_COAT,
  W,
  blank,
  fill,
  inEllipse,
  inSegment,
  mirror,
  stamp,
  stampZs,
  type Grid,
  type Inside,
  type Species,
  type Steps,
} from './pixels.ts'

// Paints the inside of a shape (its outline left as drawn) with one letter.
const tint = (g: Grid, inside: Inside, letter: string) => {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (inside(x, y) && g[y][x] !== 'I') g[y][x] = letter
    }
  }
}

const ROCK = ['.III.', 'IXYYI', 'IYYZI', '.III.']
const PAW = ['III', 'IMI', '.I.']

// The pond: a surface of light ripples from row `top` down, deep streaks
// below; `shift` moves the ripples so the water moves.
const pond = (g: Grid, top: number, shift: number) => {
  for (let y = top; y < H; y++) {
    for (let x = 0; x < W; x++) {
      g[y][x] =
        y === top
          ? (x + shift) % 6 < 2
            ? 'a'
            : 'A'
          : (x * 2 + y * 3 + shift * 2) % 13 === 0
            ? 'j'
            : 'A'
    }
  }
}

// The head, 17 wide, drawn by hand: small round ears on a wide flat crown,
// big wide-set eyes, a big cream muzzle with puffy whisker pads, a broad nose.
const CROWN = [
  '.III.........III.',
  'IMMBIIIIIIIIIBMMI',
  'IMBLLLLLLLLLLLBMI',
  '.IBBBBBBBBBBBBBI.',
]
const EYES = {
  open: ['IBBheeBBBBBheeBBI', 'IBBeeeBBBBBeeeBBI', 'IBBeeeBBBBBeeeBBI'],
  up: ['IBBheeBBBBBheeBBI', 'IBBeeeBBBBBeeeBBI', 'IBBBBBBBBBBBBBBBI'],
  happy: ['IBBBIBBBBBBBIBBBI', 'IBBIBIBBBBBIBIBBI', 'IBBBBBBBBBBBBBBBI'],
  shut: ['IBBBBBBBBBBBBBBBI', 'IBBBBBBBBBBBBBBBI', 'IBBIIIBBBBBIIIBBI'],
  half: ['IBBIIIBBBBBIIIBBI', 'IBBeeeBBBBBeeeBBI', 'IBBeeeBBBBBeeeBBI'],
}
type Eyes = keyof typeof EYES
const MUZZLE = [
  'IBBBBCCCCCCCBBBBI',
  'IBBBCCCNNNCCCBBBI',
  '.IBCCXCCNCCXCCBI.',
  '.IBCCCCICICCCCBI.',
  '..IICCCCCCCCCII..',
  '....IIIIIIIII....',
]
const head = (eyes: Eyes) => [...CROWN, ...EYES[eyes], ...MUZZLE]

// Sitting up, facing you: the head over a tall round body, the tail curled
// along the ground. `paws` and `rock` place them by their top left corners;
// the rock is left out when `rock` is null.
const sitting = (
  eyes: Eyes,
  paws: [number, number, number, number],
  rock: [number, number] | null,
  lift = 0,
) => {
  const g = blank()
  const cx = 15
  const parts: Inside[] = [
    inEllipse(cx, 16.5 - lift, 6.6, 7),
    inSegment(cx + 4, 22.5, cx + 13, 21.5, 1.7),
    inSegment(cx + 13, 21.5, cx + 15, 19, 1.3),
  ]
  fill(g, (x, y) => parts.some(part => part(x, y)), OTTER_COAT)
  tint(g, inEllipse(cx, 18 - lift, 4.2, 4.8), 'C')
  // Whiskers either side of the muzzle.
  stamp(g, ['yyy', '...', '.yy'], cx - 10, 10 - lift)
  stamp(g, ['yyy', '...', 'yy.'], cx + 8, 10 - lift)
  stamp(g, head(eyes), cx - 8, 1 - lift)
  if (rock) stamp(g, ROCK, rock[0], rock[1] - lift)
  stamp(g, PAW, paws[0], paws[1] - lift)
  stamp(g, PAW, paws[2], paws[3] - lift)
  return g
}

// The paws holding the rock to the chest, and raised up after a toss.
const PAWS_HOLD: [number, number, number, number] = [10, 14, 18, 14]
const PAWS_UP: [number, number, number, number] = [8, 9, 20, 9]
const ROCK_HELD: [number, number] = [13, 14]

// Floating on its back in the pond, seen from the front like the sitting
// otter: eyes shut, paws holding the rock on its belly, little feet poking
// out of the water, ripples round it. `bob` lifts it a row.
const floating = (bob: number, shift: number, eyes: Eyes, zs: [number, number][]) => {
  const g = blank()
  const y = -bob
  const cx = 15
  const parts: Inside[] = [
    inEllipse(cx, 16 + y, 7, 6),
    inEllipse(cx - 5.5, 18.6 + y, 1.7, 1.9),
    inEllipse(cx + 5.5, 18.6 + y, 1.7, 1.9),
  ]
  fill(g, (x, py) => parts.some(part => part(x, py)), OTTER_COAT)
  tint(g, inEllipse(cx, 16.5 + y, 4.6, 4.2), 'C')
  stamp(g, ['yyy', '...', '.yy'], cx - 10, 10 + y)
  stamp(g, ['yyy', '...', 'yy.'], cx + 8, 10 + y)
  stamp(g, head(eyes), cx - 8, 1 + y)
  stamp(g, ROCK, cx - 2, 14 + y)
  stamp(g, PAW, cx - 5, 14 + y)
  stamp(g, PAW, cx + 3, 14 + y)
  pond(g, 19, shift)
  // The feet sticking up out of the water, the tail tip beside them, and
  // ripples round the otter.
  stamp(g, ['.II.', 'IMMI', 'IMMI'], cx - 5, 17 + y)
  stamp(g, ['.II.', 'IMMI', 'IMMI'], cx + 2, 17 + y)
  fill(g, inSegment(cx + 8, 19.5, cx + 13, 17.5 + y, 1.4), OTTER_COAT)
  stamp(g, ['.aa', 'a..'], cx - 11, 18)
  stamp(g, ['aa.', '..a'], cx + 9, 18)
  stampZs(g, zs)
  return g
}

// Swimming, seen from the front: the head above the water at `cx`, the body
// a dark shape under the surface with its paws paddling, ripples round the
// neck and a wake behind as it moves. `heading` is -1 left, 1 right, 0 still;
// `depth` sinks the head below the surface for a dive.
const swimming = (cx: number, bob: number, shift: number, heading: number, eyes: Eyes = 'open', depth = 0) => {
  const g = blank()
  const top = 2 + bob + depth
  stamp(g, ['yyy', '...', '.yy'], cx - 10, top + 9)
  stamp(g, ['yyy', '...', 'yy.'], cx + 8, top + 9)
  stamp(g, head(eyes), cx - 8, top)
  const water = 14
  pond(g, water, shift)
  // The body under the water, and its paws splashing in turn either side.
  const body = inEllipse(cx, 19.5, 6.5, 4.2)
  for (let y = water + 1; y < H; y++) {
    for (let x = 0; x < W; x++) if (body(x, y)) g[y][x] = 'j'
  }
  stamp(g, bob ? ['i.', '.a'] : ['.i', 'a.'], cx - 8, water + 1)
  stamp(g, bob ? ['.i', 'a.'] : ['i.', '.a'], cx + 7, water + 1)
  stamp(g, ['aa', '..a'], cx - 10, water - 1)
  stamp(g, ['.aa', 'a..'], cx + 8, water - 1)
  if (heading) {
    const behind = heading > 0 ? cx - 15 : cx + 11
    stamp(g, heading > 0 ? ['a.a.aa', '.a.a..'] : ['aa.a.a', '..a.a.'], behind, water)
  }
  return g
}

// Diving: the tail flips up out of the water where the otter went under,
// then rings spread where it was.
const diving = (cx: number, step: 0 | 1, shift: number) => {
  const g = blank()
  pond(g, 14, shift)
  if (step === 0) {
    fill(g, (x, y) => inSegment(cx, 15, cx + 2.5, 10, 2.2)(x, y) || inSegment(cx + 2.5, 10, cx + 4.5, 7, 1.3)(x, y), OTTER_COAT)
    stamp(g, ['i.aaa.i', '.aaaaa.'], cx - 3, 13)
  } else {
    stamp(g, ['...aaaa...', '.aa....aa.', 'a........a'], cx - 5, 12)
  }
  return g
}

// Jumping into the pond from its edge: crouched at the water, leaping up,
// arcing down head first, the splash.
const leaping = (step: 0 | 1 | 2 | 3) => {
  if (step === 0) {
    const g = sitting('up', PAWS_HOLD, ROCK_HELD, 0)
    pond(g, 21, 0)
    return g
  }
  const g = blank()
  if (step === 1) {
    fill(g, (x, y) => inSegment(8, 15, 15, 9, 2.8)(x, y) || inEllipse(17.5, 7.5, 3.6, 3.2)(x, y) || inSegment(8, 15, 3, 17, 1.2)(x, y), OTTER_COAT)
    tint(g, inSegment(9, 15.5, 15, 10.5, 1.3), 'C')
    stamp(g, ['he'], 17, 6)
    stamp(g, ['N'], 20, 7)
  } else if (step === 2) {
    fill(g, (x, y) => inSegment(13, 9, 20, 13, 2.8)(x, y) || inEllipse(22, 15, 3.4, 3)(x, y) || inSegment(13, 9, 9, 6, 1.2)(x, y), OTTER_COAT)
    tint(g, inSegment(13, 10.5, 19.5, 14, 1.3), 'C')
    stamp(g, ['ee'], 22, 14)
  }
  pond(g, 17, step)
  if (step === 3) stamp(g, ['i...i...i', '.i.i.i.i.', '..iiiii..', 'iiaaaaaii'], 17, 13)
  return g
}

// Where the swimming otter's head is, and which way it is heading: across
// to the right, a pause, back to the left, a pause.
const SWIM_PATH: [cx: number, heading: number][] = [
  [9, 1], [11, 1], [13, 1], [15, 1], [17, 1], [19, 1], [21, 0], [21, 0],
  [19, -1], [17, -1], [15, -1], [13, -1], [11, -1], [9, 0], [9, 0],
]

const FRAMES: Record<string, Grid> = {
  sit: sitting('open', PAWS_HOLD, ROCK_HELD),
  blink: sitting('shut', PAWS_HOLD, ROCK_HELD),
  sleepA: floating(0, 0, 'shut', [[24, 6], [25, 2]]),
  sleepB: floating(1, 2, 'shut', [[25, 5], [26, 1]]),
  sleepC: floating(0, 4, 'shut', [[24, 6], [25, 2], [27, -3]]),

  // Playing with the rock: held, tossed up past its nose, caught, clacked.
  rockHold: sitting('open', PAWS_HOLD, ROCK_HELD),
  rockToss1: sitting('up', PAWS_UP, [13, 3], 1),
  rockToss2: sitting('up', PAWS_UP, [13, 0], 1),
  rockToss3: sitting('up', PAWS_UP, [13, 4]),
  rockCatch: sitting('happy', PAWS_HOLD, ROCK_HELD),
  rockClack: sitting('happy', [11, 15, 17, 15], [13, 16]),

  // Swimming back and forth across the pond, then ducking under: the head
  // sinks, the tail flips up, rings spread, and it pops back up.
  ...Object.fromEntries(
    SWIM_PATH.map(([cx, heading], i): [string, Grid] => [`swim${i}`, swimming(cx, i % 2, i, heading)]),
  ),
  swimBlink: swimming(15, 0, 3, 0, 'shut'),
  sink: swimming(15, 0, 4, 0, 'shut', 4),
  dive0: diving(15, 0, 5),
  dive1: diving(15, 1, 6),
  surface: swimming(15, 1, 7, 0, 'shut', 2),

  // In-between frames for the transitions.
  edge: leaping(0),
  leapUp: leaping(1),
  leapDown: leaping(2),
  splash: leaping(3),
  lieBack: floating(1, 0, 'half', []),
}

const SEQUENCES: Record<string, Steps> = {
  sleep: [['sleepA', 1500], ['sleepB', 1500], ['sleepA', 1500], ['sleepC', 1500]],
  swim: [
    ...SWIM_PATH.map((_, i): [string, number] => [`swim${i}`, 340]),
    ['swim10', 300], ['swimBlink', 160], ['swim10', 300],
    ['sink', 260], ['dive0', 400], ['dive1', 500], ['surface', 300],
  ],
  rock: [
    ['rockHold', 900], ['blink', 140], ['rockHold', 500],
    ['rockToss1', 160], ['rockToss2', 260], ['rockToss3', 160], ['rockCatch', 600],
    ['rockClack', 220], ['rockCatch', 220], ['rockClack', 220], ['rockCatch', 600],
  ],
}

const ENTER: Record<string, Steps> = {
  rock: [],
  swim: [['edge', 300], ['leapUp', 200], ['leapDown', 200], ['splash', 300], ['dive1', 300], ['surface', 300]],
  sleep: [['edge', 300], ['lieBack', 500]],
}

const ALT: Record<string, string> = {
  sleep: 'An otter asleep, floating on its back holding its rock',
  swim: 'An otter swimming in its pond',
  rock: 'An otter playing with its rock',
}

export const otter: Species = {
  frames: FRAMES,
  neutral: 'sit',
  sequences: SEQUENCES,
  enter: ENTER,
  awake: ['swim', 'rock'],
  oneShot: [],
  lengthMs: { swim: 3 * 60_000, rock: 3 * 60_000 },
  alt: ALT,
}
