// The cat: a black kitten with yellow eyes. Awake, it sits and stares,
// grooms, plays with yarn, drinks milk and hunts flies.

import {
  CAT_COAT,
  H,
  W,
  blank,
  ellipse,
  fill,
  inEllipse,
  mod,
  stamp,
  stampZs,
  type Grid,
  type Species,
  type Steps,
} from './pixels.ts'

// The head, 19 wide: ears, a tabby forehead, eyes, muzzle and chin.
const EARS = [
  '..o.............o..',
  '.olo...........olo.',
  '.ocpo.........opco.',
  'ocppcooooooooocppco',
  'occccldcdcdcdlcccco',
]
const EYES_OPEN = [
  'oclooooccdccoooolco',
  'ocoghegocccoghegoco',
  'ocogeegocccogeegoco',
  '.oooggoocccooggooo.',
]
const EYES_LOOK = [
  'oclooooccdccoooolco',
  'ocoghggocccoghggoco',
  'ocoeeggocccoeeggoco',
  '.oooegoocccooegooo.',
]
const EYES_LEFT = [
  'oclooooccdccoooolco',
  'ocoeeggocccoeeggoco',
  'ocoeeggocccoeeggoco',
  '.oooggoocccooggooo.',
]
const EYES_RIGHT = [
  'oclooooccdccoooolco',
  'ocoggeeocccoggeeoco',
  'ocoggeeocccoggeeoco',
  '.oooggoocccooggooo.',
]
const EYES_UP = [
  'oclooooccdccoooolco',
  'ocogeegocccogeegoco',
  'ocoggggocccoggggoco',
  '.oooggoocccooggooo.',
]
const EYES_HAPPY = [
  'oclcccdccdccdccclco',
  'occcoocccccccooccco',
  'occoccocccccoccocco',
  '.olccccccccccccclo.',
]
const EYES_HALF = [
  'oclooooccdccoooolco',
  'ocoooooocccooooooco',
  'ocogeegocccogeegoco',
  '.oooggoocccooggooo.',
]
const EYES_SHUT = [
  'oclcccdccdccdccclco',
  'occccccccccccccccco',
  'ocoddddocccoddddoco',
  '.oloooocccccoooolo.',
]
const NOSE = '..olccwwpppwwcclo..'
const MOUTH = [
  '...olcwwwowwwclo...',
  '....olwwowowwlo....',
]
const TONGUE = [
  '...olcwwwowwwclo...',
  '....olwwopowwlo....',
  '.....olwwpwwlo.....',
]
const CHIN = [
  '.....olwwwwwlo.....',
  '......ooooooo......',
]

const head = (eyes: readonly string[], mouth: readonly string[] = MOUTH) => {
  const rows = [...EARS, ...eyes, NOSE, ...MOUTH, ...CHIN]
  // The tongue's rows sit over the mouth and chin.
  mouth.forEach((row, i) => (rows[EARS.length + eyes.length + 1 + i] = row))
  return rows
}

const WHISKERS_L = ['yyyyy', '.....', '..yyyyy']
const WHISKERS_R = ['..yyyyy', '.......', 'yyyyy..']

const BODY_SIT = [
  '...ooooooooooooo...',
  '.oollllllllllllloo.',
  'occccccccccccccccco',
  'occccwwwwwwwwwcccco',
  'ocdccvwwwwwwwvccdco',
  'occdcvwwwwwwwvcdcco',
  'ocdccsvwwwwwvsccdco',
  'occccsvwwwwwvscccco',
  'osccowwwovowwwocsso',
  'osccowpwovowpwocsso',
  '.ooooooooooooooooo.',
]

const TAIL_DOWN = [
  '....oo',
  '...oco',
  '...oco',
  '..ocdo',
  '..oco.',
  '.ocdo.',
  'occso.',
  'ooso..',
  'ooo...',
]
const TAIL_UP = [
  '.ooo..',
  'oclco.',
  'ooodo.',
  '..oco.',
  '..ocdo',
  '..ocso',
  '.ocdo.',
  'ocso..',
  'ooo...',
]

const PAW = [
  '.ooo.',
  'owwwo',
  'owwwo',
  'opwpo',
  '.oco.',
  '.occo',
  '.occo',
]
// Raised to the eye, the foreleg reaches all the way down to the shoulder.
const PAW_LONG = [...PAW, '.occo', '.occo', '.occo', '.occo']

// Batting at the yarn: poised up high, then swiping down onto the ball.
const BAT_PAW_UP = [
  '.ooo...',
  'owwwo..',
  'opwpo..',
  '.occo..',
  '..oco..',
  '..occo.',
  '...oco.',
  '....oco',
]
const BAT_PAW_DOWN = [
  '....ooo',
  '...occo',
  '..occo.',
  '.owwo..',
  'owwwo..',
  'opwo...',
]

// A ball of yarn, about ten pixels across, resting on the floor at `cx`:
// strands wound one way, a band of strands crossing them, a highlight up
// top, a shadow below and a loose thread trailing off to the right.
// `turn` shifts the strands, so stepping it makes the ball roll.
const yarnBall = (g: Grid, cx: number, turn: number) => {
  const r = 5.6
  const cy = H - 0.6 - r
  const inside = (x: number, y: number) => Math.hypot(x - cx, y - cy) <= r
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue
      const u = x - cx
      const v = y - cy
      if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) {
        g[y][x] = 'o'
        continue
      }
      // Strands are arcs, as if wound round a tilted axis; across the middle
      // a band of them is wound the other way.
      const isCrossing = Math.abs(u * 0.8 + v + 0.5) < 1.7
      const arc = isCrossing ? Math.hypot(u - r * 1.7, v - r * 1.1) : Math.hypot(u + r * 1.7, v - r * 0.9)
      const isStrand = mod(Math.round(arc * 0.75 + turn), 2) === 0
      const isLit = Math.hypot(u + r * 0.4, v + r * 0.45) < r * 0.5
      const isShaded = u * 0.6 + v > r * 0.62
      g[y][x] = isShaded ? (isStrand ? 'P' : 'R') : isStrand ? (isLit ? 'r' : 'R') : isLit ? 'q' : 'r'
    }
  }
  stamp(g, ['...rq..', 'qr...rq'], Math.round(cx + 3), H - 2)
}

// A fly, its wings beating up and level.
const FLY_UP = ['W.W', 'WfW', '.f.']
const FLY_LEVEL = ['...', 'WfW', 'WfW']

// The pounce: a foreleg swept from the shoulder down onto the floor in front.
const PAW_POUNCE = [
  '......ooo',
  '.....occo',
  '....occo.',
  '...occo..',
  '..occo...',
  '.owwwo...',
  'owwwwo...',
  'opwpwo...',
  '.oooo....',
]

const BOWL = [
  '.ommmmmmmmmmmo.',
  'okmmmmmmmmmmmko',
  'obbbbbbbbbbbbbo',
  '.obbnnnnnnnbbo.',
  '..ooooooooooo..',
]

// The head's left edge, and the canvas row of its ear tips while sitting.
const X = 6
const Y = 1

type Extra = [rows: readonly string[], x: number, y: number]

const withWhiskers = (g: Grid, y: number) => {
  stamp(g, WHISKERS_L, X - 2, y + 9)
  stamp(g, WHISKERS_R, X + 14, y + 9)
}

const sitting = (
  eyes: readonly string[],
  tail: readonly string[],
  mouth = MOUTH,
  extras: Extra[] = [],
) => {
  const g = blank()
  stamp(g, BODY_SIT, X, Y + 12)
  stamp(g, tail, X + 18, Y + 14)
  // Whiskers go under the head so only their tips outside the cheeks show.
  withWhiskers(g, Y)
  stamp(g, head(eyes, mouth), X, Y)
  extras.forEach(([rows, x, y]) => stamp(g, rows, x, y))
  return g
}

const grooming = (
  pawX: number,
  pawY: number,
  mouth: readonly string[],
  paw: readonly string[] = PAW,
  eyes: readonly string[] = EYES_SHUT,
) => sitting(eyes, TAIL_DOWN, mouth, [[paw, pawX, pawY]])

// Sitting by the yarn ball, maybe with a paw up or swiping down onto it.
const playing = (
  eyes: readonly string[],
  tail: readonly string[],
  ballX: number,
  turn: number,
  paw?: Extra,
) => {
  const g = sitting(eyes, tail)
  yarnBall(g, ballX, turn)
  if (paw) stamp(g, ...paw)
  return g
}

// Crouched low with the head down, from half way (top 4) to the bowl (top 7).
const crouching = (
  top: number,
  eyes: readonly string[],
  mouth: readonly string[] = MOUTH,
  bowlX?: number,
  drop = false,
) => {
  const g = blank()
  const ry = 5.5 + (7 - top) * 0.5
  ellipse(g, X + 9, H - 0.5 - ry, 13 - (7 - top) * 0.6, ry, CAT_COAT)
  stamp(g, head(eyes, mouth), X, top)
  if (bowlX !== undefined) stamp(g, BOWL, bowlX, H - 5)
  if (drop) stamp(g, ['m'], X + 10, H - 7)
  return g
}

const sittingWithBowl = (bowlX: number) => sitting(EYES_LOOK, TAIL_DOWN, MOUTH, [[BOWL, bowlX, H - 5]])

// Curled up in a bun: a round body with a curl of sheen on its back, the
// tail wrapped along its front and the head tucked in on the left, resting
// on the tail. Lying down, the head starts higher and further in.
const sleeping = (
  breath: number,
  zs: [number, number][],
  isTwitching = false,
  headX = 1,
  headY = H - 14,
  eyes: readonly string[] = EYES_SHUT,
) => {
  const g = blank()
  const cx = 20
  const rx = 10.5
  const ry = 7.4 + 0.6 * breath
  const cy = H - 0.4 - ry
  const body = inEllipse(cx, cy, rx, ry)
  fill(g, body, CAT_COAT)

  // A curl of sheen around the back, the way a coiled cat's fur catches light.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry)
      if (g[y][x] === 'c' && Math.abs(d - 0.62) < 0.09 && (y < cy || x > cx + 2)) {
        g[y][x] = 'd'
      }
    }
  }

  // The tail: the band between the body's edge and the same edge lifted,
  // along the bottom, from the right side round to under the chin.
  const lifted = inEllipse(cx, cy - 3.6, rx + 0.5, ry)
  fill(g, (x, y) => body(x, y) && !lifted(x, y) && y > cy && x > 12, CAT_COAT)

  // The same head as when awake, tucked in on the left; on a twitch the
  // right ear folds down.
  const face = head(eyes)
  if (isTwitching) {
    face[0] = face[0].slice(0, 16) + '...'
    face[1] = face[1].slice(0, 15) + 'ooo.'
  }
  stamp(g, face, headX, headY)

  stampZs(g, zs)
  return g
}

// Where the fly buzzes, as it circles the kitten's head and comes down to land
// on the floor in front of it, and which way the kitten's eyes follow it.
const FLY_PATH: [x: number, y: number][] = [
  [29, 4], [27, 1], [24, 0], [20, 0], [15, 0], [14, 1], [15, 0], [13, 1], [14, 0],
  [9, 0], [5, 1], [2, 3], [1, 6], [2, 9], [0, 12], [3, 14], [1, 17], [2, 20],
]
const FLY_LANDED: [number, number] = [2, 21]
const eyesFor = ([x, y]: [number, number]) =>
  y >= 12 ? EYES_LOOK : x > 21 ? EYES_RIGHT : x < 9 ? EYES_LEFT : EYES_UP

const withFly = (g: Grid, [x, y]: [number, number], isUp: boolean) => {
  stamp(g, isUp ? FLY_UP : FLY_LEVEL, x, y)
  return g
}

const huntFrames = Object.fromEntries([
  ...FLY_PATH.map((at, i): [string, Grid] => [
    `fly${i}`,
    withFly(sitting(eyesFor(at), i % 4 < 2 ? TAIL_UP : TAIL_DOWN), at, i % 2 === 0),
  ]),
  ['flyLandedA', withFly(sitting(EYES_LOOK, TAIL_UP), FLY_LANDED, true)],
  ['flyLandedB', withFly(sitting(EYES_LOOK, TAIL_DOWN), FLY_LANDED, false)],
  ['pounce', sitting(EYES_LOOK, TAIL_UP, MOUTH, [[PAW_POUNCE, 0, 14]])],
  ['caught', sitting(EYES_HAPPY, TAIL_UP, MOUTH, [[PAW_POUNCE, 0, 14]])],
])

const FRAMES: Record<string, Grid> = {
  ...huntFrames,
  sleepA: sleeping(0, [[21, 8], [22, 4]]),
  sleepB: sleeping(1, [[22, 7], [23, 3]]),
  sleepC: sleeping(0, [[21, 8], [22, 4], [26, 0]], true),
  sit: sitting(EYES_OPEN, TAIL_DOWN),
  sitTail: sitting(EYES_OPEN, TAIL_UP),
  blinkHalf: sitting(EYES_HALF, TAIL_DOWN),
  blink: sitting(EYES_SHUT, TAIL_DOWN),
  lickA: grooming(X + 10, Y + 10, TONGUE),
  lickB: grooming(X + 10, Y + 11, MOUTH),
  wipe: grooming(X + 2, Y + 4, MOUTH, PAW_LONG),
  sipA: crouching(7, EYES_SHUT, MOUTH, X + 2),
  sipB: crouching(7, EYES_SHUT, TONGUE, X + 2, true),
  yarnLook: playing(EYES_LOOK, TAIL_UP, 5.6, 0),
  yarnReach: playing(EYES_LOOK, TAIL_UP, 5.6, 0, [BAT_PAW_UP, 0, 3]),
  yarnBat: playing(EYES_LOOK, TAIL_DOWN, 5, 1, [BAT_PAW_DOWN, 3, 7]),
  yarnRoll: playing(EYES_LOOK, TAIL_DOWN, 4.2, 2),
  yarnBack: playing(EYES_LOOK, TAIL_UP, 5, 1),

  // In-between frames for the transitions.
  pawLow: grooming(X + 10, Y + 15, MOUTH, PAW, EYES_HALF),
  pawMid: grooming(X + 10, Y + 13, MOUTH),
  bowlFar: sittingWithBowl(-10),
  bowlNear: sittingWithBowl(-3),
  bowlClose: sittingWithBowl(3),
  crouchBowl: crouching(4, EYES_HALF, MOUTH, X + 2),
  crouchHigh: crouching(4, EYES_HALF),
  crouchLow: crouching(7, EYES_HALF),
  lieDown: sleeping(0, [], false, 3, 9, EYES_HALF),
  settle: sleeping(0, []),
  ballFar: playing(EYES_OPEN, TAIL_DOWN, -4, 0),
  ballNear: playing(EYES_LOOK, TAIL_UP, 1.5, 1),
}

// Each activity loops through [frame, milliseconds] steps.
const SEQUENCES: Record<string, Steps> = {
  hunt: [], // filled in below, once its frames exist
  sleep: [['sleepA', 1400], ['sleepB', 1400], ['sleepA', 1400], ['sleepC', 1400]],
  sit: [['sit', 2200], ['sitTail', 500], ['sit', 1600], ['blinkHalf', 70], ['blink', 140], ['blinkHalf', 70], ['sit', 1800], ['sitTail', 500]],
  groom: [['lickA', 350], ['lickB', 350], ['lickA', 350], ['lickB', 350], ['wipe', 700], ['lickB', 400]],
  milk: [['sipA', 300], ['sipB', 300]],
  yarn: [
    ['yarnLook', 600], ['yarnReach', 250], ['yarnBat', 200], ['yarnRoll', 250], ['yarnBack', 250],
    ['yarnLook', 500], ['yarnReach', 200], ['yarnBat', 200], ['yarnRoll', 300], ['yarnBack', 300],
  ],
}

// The hunt plays once, start to finish: the fly circles, lands, the kitten
// wiggles, pounces, is pleased with itself and licks its paw.
SEQUENCES.hunt = [
  ...FLY_PATH.map((_, i): [string, number] => [`fly${i}`, i >= 4 && i <= 8 ? 220 : 260]),
  ['flyLandedA', 500],
  ...Array.from({ length: 6 }, (_, i): [string, number] => [i % 2 ? 'flyLandedB' : 'flyLandedA', 150]),
  ['pounce', 250],
  ['caught', 1100],
  ['lickA', 300],
  ['lickB', 300],
  ['lickA', 300],
  ['sit', 400],
]

// How each activity is entered from sitting; leaving it plays this backwards.
const ENTER: Record<string, Steps> = {
  sit: [],
  groom: [['blinkHalf', 120], ['pawLow', 180], ['pawMid', 180]],
  milk: [['bowlFar', 160], ['bowlNear', 160], ['bowlClose', 160], ['crouchBowl', 220]],
  sleep: [['crouchHigh', 220], ['crouchLow', 220], ['lieDown', 280], ['settle', 320]],
  yarn: [['ballFar', 160], ['ballNear', 160]],
  hunt: [],
}

const ALT: Record<string, string> = {
  sleep: 'A black kitten curled up asleep',
  sit: 'A black kitten sitting and staring at you',
  groom: 'A black kitten licking its paw',
  milk: 'A black kitten drinking milk from a bowl',
  yarn: 'A black kitten playing with a ball of yarn',
  hunt: 'A black kitten hunting a fly',
}

export const cat: Species = {
  frames: FRAMES,
  neutral: 'sit',
  sequences: SEQUENCES,
  enter: ENTER,
  awake: ['sit', 'groom', 'yarn', 'milk', 'hunt'],
  oneShot: ['hunt'],
  lengthMs: { sit: 3 * 60_000, groom: 3 * 60_000, yarn: 3 * 60_000, milk: 10_000 },
  alt: ALT,
}
