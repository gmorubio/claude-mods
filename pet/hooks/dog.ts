// The dog: a brown pup with floppy ears and a tan muzzle. Awake, it looks at
// you panting, chews a bone, plays catch, gets the zoomies and drinks water.

import {
  DOG_COAT,
  H,
  W,
  blank,
  ellipse,
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

// The head, 19 wide: a round crown, floppy ears down both sides, eyes, a tan
// muzzle with a black nose, and a mouth shut or open.
const CROWN = [
  '....OOOOOOOOOOO....',
  '..OOGGGGGGGGGGGOO..',
  '.OFFODDDDDDDDDOFFO.',
  'OFFFODDDDDDDDDOFFFO',
]
const EYES_OPEN = ['OFFFODheDDDheDOFFFO', 'OFFFODeeDDDeeDOFFFO']
const EYES_UP = ['OFFFODheDDDheDOFFFO', 'OFFFODDDDDDDDDOFFFO']
const EYES_HALF = ['OFFFODOODDDOODOFFFO', 'OFFFODeeDDDeeDOFFFO']
const EYES_SHUT = ['OFFFODDDDDDDDDOFFFO', 'OFFFODOODDDOODOFFFO']
const EYES_HAPPY = ['OFFFODOODDDOODOFFFO', 'OFFFOODDODODDOOFFFO']
const MUZZLE = [
  'OFFFODDEEEEEDDOFFFO',
  'OFFFODEENNNEEDOFFFO',
  '.OFFOEEEENEEEEOFFO.',
]
const MOUTH_SHUT = [
  '.OFFOEEEOEOEEEOFFO.',
  '..OFOOEEEEEEEOOFO..',
  '...OO.OOEEEOO.OO...',
  '........OOO........',
]
const MOUTH_OPEN = [
  '.OFFOEEOOOOOEEOFFO.',
  '..OFOOEOOOOOEOOFO..',
  '...OO.OOEEEOO.OO...',
  '........OOO........',
]
// Panting, the tongue hanging out, at two lengths.
const TONGUE_LONG = [
  '.OFFOEEOOOOOEEOFFO.',
  '..OFOOEOpppOEOOFO..',
  '...OO.OOOpOOO.OO...',
  '........OpO........',
  '........OpO........',
  '.........O.........',
]
const TONGUE_SHORT = [
  '.OFFOEEOOOOOEEOFFO.',
  '..OFOOEOpppOEOOFO..',
  '...OO.OOOpOOO.OO...',
  '........OpO........',
  '.........O.........',
]

const head = (eyes: readonly string[], mouth: readonly string[] = MOUTH_SHUT) => [
  ...CROWN,
  ...eyes,
  ...MUZZLE,
  ...mouth,
]

const BODY_SIT = [
  '...OOOOOOOOOOOOO...',
  '..OGGGGGGGGGGGGGO..',
  '.ODDDDDDDDDDDDDDDO.',
  'ODDDDDEEEEEEEDDDDDO',
  'ODDDDEEEEEEEEEDDDDO',
  'ODSDDEEEEEEEEEDDSDO',
  'ODSDDVEEEEEEEVDDSDO',
  'ODSDDOVEEEEEVODDSDO',
  'OSSDOEEEOEOEEEODSSO',
  'OSSDOEEEOEOEEEODSSO',
  '.OOOOOOOOOOOOOOOOO.',
]

// The tail, wagging between up-and-out and straight up.
const WAG_OUT = ['....OO', '...ODO', '..ODO.', '.ODO..', 'ODO...', 'OO....']
const WAG_UP = ['.OO..', 'ODO..', 'ODO..', 'ODO..', 'ODO..', 'OO...']

const BALL = ['..OOO..', '.OTTUO.', 'OUTTTUO', 'OTUTTTO', 'OTTUTTO', '.OTTUO.', '..OOO..']

const BONE = [
  '.OO.....OO.',
  'OKKOOOOOKKO',
  'OKKKKKKKKJO',
  'OKJOOOOOJJO',
  '.OO.....OO.',
]

const WATER_BOWL = [
  '.oaaaaaaaaaao.',
  'okAAAAAAAAAAko',
  'obbbbbbbbbbbbo',
  '.obbnnnnnnbbo.',
  '..oooooooooo..',
]

// The head's left edge, and the canvas row of its crown while sitting.
const X = 6
const Y = 1

type Extra = [rows: readonly string[], x: number, y: number]

const sitting = (
  eyes: readonly string[],
  tail: readonly string[],
  mouth: readonly string[] = MOUTH_SHUT,
  extras: Extra[] = [],
  lift = 0,
) => {
  const g = blank()
  stamp(g, BODY_SIT, X, Y + 12 - lift)
  stamp(g, tail, X + 18, Y + 15 - lift)
  stamp(g, head(eyes, mouth), X, Y - lift)
  extras.forEach(([rows, x, y]) => stamp(g, rows, x, y))
  return g
}

// Lying down with the head low, from half way (top 4) to the floor (top 7),
// the tail wagging over the back.
const crouching = (
  top: number,
  eyes: readonly string[],
  mouth: readonly string[] = MOUTH_SHUT,
  extras: Extra[] = [],
  tail?: readonly string[],
) => {
  const g = blank()
  const ry = 5.5 + (7 - top) * 0.5
  const rx = 13 - (7 - top) * 0.6
  ellipse(g, X + 9, H - 0.5 - ry, rx, ry, DOG_COAT)
  if (tail) stamp(g, tail, Math.round(X + 9 + rx - 3), Math.round(H - 0.5 - ry * 2) - 3)
  stamp(g, head(eyes, mouth), X, top)
  extras.forEach(([rows, x, y]) => stamp(g, rows, x, y))
  return g
}

// Curled up asleep like the cat: a round body, the tail wrapped along its
// front and the head tucked in on the left.
const sleeping = (
  breath: number,
  zs: [number, number][],
  headX = 1,
  headY = H - 13,
  eyes: readonly string[] = EYES_SHUT,
) => {
  const g = blank()
  const cx = 20
  const rx = 10.5
  const ry = 7.4 + 0.6 * breath
  const cy = H - 0.4 - ry
  const body = inEllipse(cx, cy, rx, ry)
  fill(g, body, DOG_COAT)
  const lifted = inEllipse(cx, cy - 3.6, rx + 0.5, ry)
  fill(g, (x, y) => body(x, y) && !lifted(x, y) && y > cy && x > 12, DOG_COAT)
  stamp(g, head(eyes), headX, headY)
  stampZs(g, zs)
  return g
}

// The zoomies: the dog spins round in tight circles, seen from the front,
// the side, behind and the other side in turn. The side and back views share
// the sitting dog's chunky build: a big head, a round body, short thick legs.

// Paints the inside of a shape (its outline left as drawn) with one letter.
const tint = (g: Grid, inside: Inside, letter: string) => {
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      if (inside(px, py) && g[py][px] !== 'O') g[py][px] = letter
    }
  }
}
const EAR_COAT = { edge: 'O', light: 'F', shade: 'F', stripe: 'F', base: 'F' }

// Running seen from the side, facing right, its left edge at `x`. `stride` 0
// has the legs reaching out, 1 has them gathered under.
const runningSide = (x: number, stride: 0 | 1) => {
  const g = blank()
  const legs: Inside[] =
    stride === 0
      ? [inSegment(x + 14, 18, x + 16.5, 22.2, 1.5), inSegment(x + 7, 18, x + 4.5, 22.2, 1.5)]
      : [inSegment(x + 14, 18, x + 12.5, 22.3, 1.5), inSegment(x + 7, 18, x + 9, 22.3, 1.5)]
  const parts: Inside[] = [
    inEllipse(x + 10.5, 16.2, 7.5, 4.6),
    inEllipse(x + 18, 10.5, 5.4, 5),
    inEllipse(x + 22.6, 12.4, 3, 2.1),
    ...legs,
  ]
  fill(g, (px, py) => parts.some(part => part(px, py)), DOG_COAT)
  tint(g, inEllipse(x + 22.6, 12.4, 3, 2.1), 'E')
  tint(g, inEllipse(x + 15.5, 18, 3.2, 1.8), 'E')
  // The tail, wagging up behind, and the floppy ear over the side of the head.
  const tail = stride === 0 ? inSegment(x + 3.5, 14, x + 0.5, 9.5, 1.2) : inSegment(x + 3.5, 14, x + 1.5, 9, 1.2)
  fill(g, tail, DOG_COAT)
  fill(g, inEllipse(x + 15.8, 11.4, 2, 3.8), EAR_COAT)
  stamp(g, ['he', 'ee'], x + 19, 8)
  stamp(g, ['NN'], x + 24, 11)
  stamp(g, ['p', 'p'], x + 22, 14)
  return g
}

// Running seen from behind, centred: the back of the head with both ears up
// behind the round rump, the hind legs, and the tail swinging out to a side.
const runningBack = (stride: 0 | 1) => {
  const g = blank()
  const cx = 16
  fill(g, inEllipse(cx, 7.5, 5.2, 4.4), DOG_COAT)
  fill(g, inEllipse(cx - 5, 9, 1.9, 3.4), EAR_COAT)
  fill(g, inEllipse(cx + 5, 9, 1.9, 3.4), EAR_COAT)
  const legs: Inside[] =
    stride === 0
      ? [inSegment(cx - 4, 19, cx - 4.5, 22.3, 1.6), inSegment(cx + 4, 19, cx + 4.5, 21.2, 1.6)]
      : [inSegment(cx - 4, 19, cx - 4.5, 21.2, 1.6), inSegment(cx + 4, 19, cx + 4.5, 22.3, 1.6)]
  fill(g, (px, py) => inEllipse(cx, 16, 7.2, 5.2)(px, py) || legs.some(leg => leg(px, py)), DOG_COAT)
  const side = stride === 0 ? -1 : 1
  fill(g, inSegment(cx + side * 2, 12.5, cx + side * 8.5, 6.5, 1.3), DOG_COAT)
  return g
}

// Dust kicked up at the feet, behind the dog.
const DUST = ['.QQ..', 'QQQQ.', '.QQ.Q']
const withDust = (g: Grid, x: number) => {
  stamp(g, DUST, x, H - 3)
  return g
}

// One lap's four views, a stride each, each nudged so the lap reads as a
// small circle: in front, off to the right, further back, off to the left.
const lap = (stride: 0 | 1): Grid[] => [
  sitting(EYES_HAPPY, stride ? WAG_UP : WAG_OUT, TONGUE_LONG, [], stride),
  withDust(runningSide(4, stride), 0),
  withDust(runningBack(stride), stride ? 24 : 4),
  withDust(mirror(runningSide(4, stride)), 26),
]

// Where the ball flies in a throw, from the top right into the dog's mouth.
const THROW: [number, number][] = [
  [29, 9], [27, 4], [25, 1], [22, 1], [20, 4], [18, 8],
]
const CAUGHT_AT: [number, number] = [X + 6, Y + 8]

const FRAMES: Record<string, Grid> = {
  sit: sitting(EYES_OPEN, WAG_UP),
  pantA: sitting(EYES_OPEN, WAG_OUT, TONGUE_LONG),
  pantB: sitting(EYES_OPEN, WAG_UP, TONGUE_SHORT),
  pantBlink: sitting(EYES_SHUT, WAG_OUT, TONGUE_LONG),
  sleepA: sleeping(0, [[21, 8], [22, 4]]),
  sleepB: sleeping(1, [[22, 7], [23, 3]]),
  sleepC: sleeping(0, [[21, 8], [22, 4], [26, 0]]),
  chewA: crouching(6, EYES_SHUT, MOUTH_OPEN, [[BONE, X + 4, 15]], WAG_OUT),
  chewB: crouching(7, EYES_HALF, MOUTH_OPEN, [[BONE, X + 4, 16]], WAG_UP),
  lapA: crouching(7, EYES_SHUT, MOUTH_SHUT, [[WATER_BOWL, X + 2, H - 5]]),
  lapB: crouching(7, EYES_SHUT, TONGUE_SHORT, [[WATER_BOWL, X + 2, H - 5], [['a'], X + 9, H - 7]]),
  ...Object.fromEntries(
    THROW.map(([bx, by], i): [string, Grid] => [
      `throw${i}`,
      sitting(EYES_UP, i % 2 ? WAG_OUT : WAG_UP, i >= THROW.length - 2 ? MOUTH_OPEN : MOUTH_SHUT, [[BALL, bx, by]]),
    ]),
  ),
  caughtA: sitting(EYES_HAPPY, WAG_OUT, MOUTH_OPEN, [[BALL, CAUGHT_AT[0], CAUGHT_AT[1] - 1]], 1),
  caughtB: sitting(EYES_HAPPY, WAG_UP, MOUTH_OPEN, [[BALL, CAUGHT_AT[0], CAUGHT_AT[1]]]),
  dropA: sitting(EYES_OPEN, WAG_OUT, MOUTH_OPEN, [[BALL, X + 6, H - 7]]),
  dropB: sitting(EYES_OPEN, WAG_UP, TONGUE_SHORT, [[BALL, X + 15, H - 7]]),
  dropC: sitting(EYES_OPEN, WAG_OUT, TONGUE_SHORT, [[BALL, X + 23, H - 7]]),
  ...Object.fromEntries(
    [...lap(0), ...lap(1)].map((grid, i): [string, Grid] => [`spin${i}`, grid]),
  ),

  // In-between frames for the transitions.
  ready: sitting(EYES_UP, WAG_OUT, TONGUE_SHORT, [], 1),
  bowlFar: sitting(EYES_OPEN, WAG_UP, MOUTH_SHUT, [[WATER_BOWL, -10, H - 5]]),
  bowlNear: sitting(EYES_OPEN, WAG_UP, MOUTH_SHUT, [[WATER_BOWL, -3, H - 5]]),
  bowlClose: sitting(EYES_OPEN, WAG_UP, MOUTH_SHUT, [[WATER_BOWL, 3, H - 5]]),
  crouchBowl: crouching(4, EYES_HALF, MOUTH_SHUT, [[WATER_BOWL, X + 2, H - 5]]),
  boneFar: sitting(EYES_OPEN, WAG_OUT, MOUTH_SHUT, [[BONE, -8, H - 5]]),
  boneNear: sitting(EYES_OPEN, WAG_UP, TONGUE_SHORT, [[BONE, -1, H - 5]]),
  crouchBone: crouching(4, EYES_OPEN, MOUTH_OPEN, [[BONE, X + 4, 14]], WAG_OUT),
  crouchHigh: crouching(4, EYES_HALF),
  crouchLow: crouching(7, EYES_HALF),
  lieDown: sleeping(0, [], 3, 9, EYES_HALF),
  settle: sleeping(0, []),
}

const SEQUENCES: Record<string, Steps> = {
  sleep: [['sleepA', 1400], ['sleepB', 1400], ['sleepA', 1400], ['sleepC', 1400]],
  look: [
    ['pantA', 260], ['pantB', 260], ['pantA', 260], ['pantB', 260], ['pantA', 260], ['pantB', 260],
    ['pantA', 260], ['pantBlink', 160], ['pantA', 260], ['pantB', 260],
  ],
  bone: [['chewA', 320], ['chewB', 320], ['chewA', 320], ['chewB', 320], ['chewA', 600], ['chewB', 320]],
  water: [['lapA', 300], ['lapB', 300]],
  // Plays once: the throw, the catch, a happy bounce, then the ball dropped
  // and rolling away.
  catch: [
    ['sit', 500],
    ...THROW.map((_, i): [string, number] => [`throw${i}`, 160]),
    ['caughtA', 220], ['caughtB', 220], ['caughtA', 220], ['caughtB', 220], ['caughtA', 220], ['caughtB', 400],
    ['dropA', 250], ['dropB', 250], ['dropC', 250], ['pantA', 300],
  ],
  // Plays once: three seconds spinning round in circles, six laps.
  zoomies: Array.from({ length: 24 }, (_, i): [string, number] => [`spin${i % 8}`, 125]),
}

const ENTER: Record<string, Steps> = {
  look: [],
  sleep: [['crouchHigh', 220], ['crouchLow', 220], ['lieDown', 280], ['settle', 320]],
  bone: [['boneFar', 160], ['boneNear', 160], ['crouchBone', 220]],
  water: [['bowlFar', 160], ['bowlNear', 160], ['bowlClose', 160], ['crouchBowl', 220]],
  catch: [],
  zoomies: [['ready', 250]],
}

const ALT: Record<string, string> = {
  sleep: 'A brown dog curled up asleep',
  look: 'A brown dog looking at you, panting and wagging its tail',
  bone: 'A brown dog chewing a bone',
  water: 'A brown dog drinking water',
  catch: 'A brown dog catching a ball',
  zoomies: 'A brown dog running in circles',
}

export const dog: Species = {
  frames: FRAMES,
  neutral: 'sit',
  sequences: SEQUENCES,
  enter: ENTER,
  awake: ['look', 'bone', 'catch', 'zoomies', 'water'],
  oneShot: ['catch', 'zoomies'],
  lengthMs: { look: 3 * 60_000, bone: 3 * 60_000, water: 10_000 },
  alt: ALT,
}
