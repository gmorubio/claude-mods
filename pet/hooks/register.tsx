import type { EngineInterface, Register, Timer } from 'claude-code'

import type { PetSpecies } from '../types'
import { cat } from './cat.ts'
import { dog } from './dog.ts'
import { otter } from './otter.ts'
import { H, W, activityOf, durationOf, frameAt, lengthOf, svgFor, type Species } from './pixels.ts'

// The pets to pick from with /pet cat, /pet dog and /pet otter. While Claude works the pet
// is awake, moving between its activities; while Claude is idle it sleeps.
const PETS: Record<PetSpecies, Species> = { cat, dog, otter }
const isSpecies = (name: string): name is PetSpecies => name in PETS

const speciesRef = { plugin: 'pet', key: 'species' } as const
const sceneRef = { plugin: 'pet', key: 'scene' } as const
const isHidden = { plugin: 'pet', key: 'isHidden' } as const
const layoutRef = { plugin: 'pet', key: 'layout' } as const

let species: PetSpecies = 'cat'
let scene = 'sleep'
let sceneStartedAt = 0
let pending: Timer | undefined
let ticker: Timer | undefined
let bandId: string | undefined
let shownFrame = ''
let isWorking = false

const pet = () => PETS[species]

// What the other band mods drew, if anything: only a real element can be
// nested; anything else (the app's own empty band) is left out.
const DRAWABLE = ['Box', 'Text', 'Button', 'Input', 'Select', 'Link', 'Code', 'Markdown', 'Svg', 'Raster', 'Image', 'Client']
const isDrawable = (node: unknown) =>
  typeof node === 'object' && node !== null && DRAWABLE.includes((node as { type?: string }).type ?? '')

// A random awake activity other than the current one.
const pickOther = (now: string) => {
  const others = pet().awake.filter(one => one !== now)
  return others[Math.floor(Math.random() * others.length)]
}

async function show($: EngineInterface, next: string) {
  scene = next
  sceneStartedAt = performance.now()
  await $.state.set(sceneRef, next)
}

// Play the transition into `to` and hold it. Sleep lasts until Claude starts
// working; an awake activity lasts its time, then the pet moves on to
// another one, or back to sleep if Claude has gone idle meanwhile.
function switchTo($: EngineInterface, to: string) {
  pending?.cancel()
  const from = activityOf(scene)
  const settle = () => {
    void show($, to)
    if (to === 'sleep') return
    pending = $.clock.after(lengthOf(pet(), to), () => switchTo($, isWorking ? pickOther(to) : 'sleep'))
  }
  if (from === to) {
    settle()
    return
  }
  const transition = `${from}>${to}`
  void show($, transition)
  pending = $.clock.after(durationOf(pet(), transition), settle)
}

// Swap in another pet, straight into what it should be doing now.
async function adopt($: EngineInterface, next: PetSpecies) {
  pending?.cancel()
  species = next
  await $.state.set(speciesRef, next)
  await $.store.set('species', next)
  scene = 'sleep'
  switchTo($, isWorking ? pickOther('sleep') : 'sleep')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pet',
      description:
        'Switch the pet to another activity, or: /pet cat | dog | otter | sleep | <activity> | hide | show | layout [wrap | shrink]',
    })
    // The pet and the layout the person last picked, kept between sessions.
    const savedSpecies = String((await $.store.get('species')) ?? 'cat')
    species = isSpecies(savedSpecies) ? savedSpecies : 'cat'
    await $.state.set(speciesRef, species)
    const savedLayout = await $.store.get('layout')
    await $.state.set(layoutRef, savedLayout === 'shrink' ? 'shrink' : 'wrap')
    isWorking = false
    scene = 'sleep'
    switchTo($, 'sleep')

    // Animate: redraw the band whenever the frame changes.
    ticker?.cancel()
    ticker = $.clock.every(100, () => {
      const frame = frameAt(pet(), scene, performance.now() - sceneStartedAt)
      if (bandId && frame !== shownFrame) $.ui.invalidate('ui.render')
    })

    return next(e)
  })

  // Claude starts working: the pet wakes up, unless it already is.
  on('turn.start', ($, e, next) => {
    isWorking = true
    if (activityOf(scene) === 'sleep') switchTo($, pickOther('sleep'))

    return next(e)
  })

  // The main conversation's turn ends, however it ended: back to sleep.
  // Subagents' turns end on their own and are left out.
  on('turn.complete', ($, e, next) => {
    if (!e.agentId) {
      isWorking = false
      switchTo($, 'sleep')
    }

    return next(e)
  })

  on('command.run', { command: 'pet' }, async ($, e) => {
    const arg = e.args.trim()
    if (isSpecies(arg)) {
      await adopt($, arg)
      return { text: `Your pet is now the ${arg}.` }
    }
    if (arg === 'hide' || arg === 'show') {
      await $.state.set(isHidden, arg === 'hide')
      return { text: arg === 'hide' ? 'The pet is hidden.' : 'The pet is back.' }
    }
    if (arg === 'layout' || arg === 'layout wrap' || arg === 'layout shrink') {
      const asked = arg.split(' ')[1]
      const now =
        asked === 'wrap' || asked === 'shrink'
          ? asked
          : (await $.state.get(layoutRef)).value === 'shrink' ? 'wrap' : 'shrink'
      await $.state.set(layoutRef, now)
      await $.store.set('layout', now)
      return {
        text: now === 'shrink'
          ? 'Layout: shrink. The pet keeps its spot; other band content is cut short.'
          : 'Layout: wrap. The pet drops to its own line when the band is crowded.',
      }
    }
    if (arg === 'sleep' || pet().awake.includes(arg)) {
      switchTo($, arg)
      return { text: `The ${species} switches to: ${arg}.` }
    }
    if (arg) {
      return { text: `The ${species} can: sleep, ${pet().awake.join(', ')}. Pets: ${Object.keys(PETS).join(', ')}.` }
    }
    const next = pickOther(activityOf(scene))
    switchTo($, next)
    return { text: `The ${species} switches to: ${next}.` }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // The pet lives in the desktop app only; elsewhere the band is left as is.
    if (e.surface !== 'desktop' || e.props.hasSurvey || (await $.state.get(isHidden)).value) {
      bandId = undefined
      return next(e)
    }
    // Reading the pet and the scene subscribes the band, so each change of
    // either redraws it.
    await $.state.get(speciesRef)
    await $.state.get(sceneRef)
    bandId = e.requestId
    shownFrame = frameAt(pet(), scene, performance.now() - sceneStartedAt)

    // What the other band mods drew goes on the left, the pet on the right,
    // and the pet never shrinks. When both don't fit: in 'wrap' the row
    // wraps and the pet drops to a line of its own, still in the right
    // corner; in 'shrink' the left side gets what is left and is cut short.
    const below = await next(e)
    const others = isDrawable(below) ? below : null
    const isShrink = (await $.state.get(layoutRef)).value === 'shrink'

    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box width="100%" alignItems="flex-end" flexWrap={isShrink ? 'nowrap' : 'wrap'}>
        <Box flexGrow={1} flexShrink={1} flexDirection="column" overflow={isShrink ? 'hidden' : 'visible'}>
          {others}
        </Box>
        <Box flexGrow={isShrink ? 0 : 1} flexShrink={0} justifyContent="flex-end">
          <Svg
            source={svgFor(pet().frames[shownFrame], 2)}
            alt={pet().alt[activityOf(scene)] ?? `A ${species}`}
            width={W * 2}
            height={H * 2}
          />
        </Box>
      </Box>
    )
  })
}
