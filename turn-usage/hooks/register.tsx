import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { UsageNote } from '../types'

// The "current session" figure in Claude's usage settings is the five-hour window.
const WINDOW = 'five_hour'
// The subscription windows; with one used up, a turn that still completes ran on extra usage.
const SUBSCRIPTION_WINDOWS = ['five_hour', 'seven_day']
const MAX_NOTES = 100

const notes = atom({ plugin: 'turn-usage', key: 'notes' } as const, [] as UsageNote[])

const WINDOW_MS = 5 * 60 * 60 * 1000
// How long before a turn a window may have begun and still count as begun by it.
const FRESH_WINDOW_SLACK_MS = 15 * 60 * 1000

const formatPercent = (n: number) => `${Math.round(n * 10) / 10}%`
// Escaped, so a line with two amounts never reads as inline math.
const formatUsd = (n: number) => (n < 0.005 ? '<\\$0.01' : `\\$${n.toFixed(2)}`)

const LABELS = {
  es: { session: 'Sesión', used: 'usado', turn: 'este turno', extra: 'uso extra' },
  en: { session: 'Session', used: 'used', turn: 'this turn', extra: 'extra usage' },
}

// Spanish when Claude Code's `language` setting says so, English otherwise.
async function readLabels($: EngineInterface): Promise<(typeof LABELS)['en']> {
  const { language } = await $.settings.read()
  const isSpanish = typeof language === 'string' && /^\s*(es\b|es-|spanish|espa[nñ]ol|castellano)/i.test(language)
  return isSpanish ? LABELS.es : LABELS.en
}

// How many points of the window a turn spent, or undefined with nothing to compare against.
function spentThisTurn(
  after: SessionRateLimit,
  start: { reading: SessionRateLimit | undefined; usd: number | undefined; startedAt: number } | undefined,
  firstStep: SessionRateLimit | undefined,
): number | undefined {
  const since = (from: SessionRateLimit) =>
    // A window that reset during the turn started over from zero.
    from.resetsAt !== after.resetsAt ? after.percentUsed : Math.max(0, after.percentUsed - from.percentUsed)

  if (start?.reading !== undefined) {
    return since(start.reading)
  }
  // A window that began with this turn started it at zero.
  const windowStart = after.resetsAt === undefined ? NaN : Date.parse(after.resetsAt) - WINDOW_MS
  if (start !== undefined && windowStart >= start.startedAt - FRESH_WINDOW_SLACK_MS) {
    return after.percentUsed
  }
  // Otherwise the first request's reading is the closest to the turn's start.
  return firstStep === undefined ? undefined : since(firstStep)
}

// Keeps a finished reply's line, for the drawing of the block that ends it.
async function addNote($: EngineInterface, answer: string, line: string): Promise<void> {
  await update($, notes, (list) => [...list, { answer, line }].slice(-MAX_NOTES))
}

async function readWindow($: EngineInterface): Promise<SessionRateLimit | undefined> {
  const { rateLimits } = await $.session.usage()
  return rateLimits.find((limit) => limit.kind === WINDOW)
}

export const register: Register = (on) => {
  // The window's reading, the session's cost and the time when each turn began, by turn id.
  const atStart = new Map<
    string,
    { reading: SessionRateLimit | undefined; usd: number | undefined; startedAt: number }
  >()
  // For a turn that began with no reading (a session's first): the one its first request brought.
  const afterFirstStep = new Map<string, SessionRateLimit>()

  on('turn.start', async ($, e, next) => {
    const { rateLimits, cost } = await $.session.usage()
    atStart.set(e.turnId, {
      reading: rateLimits.find((limit) => limit.kind === WINDOW),
      usd: cost?.usd,
      startedAt: await $.clock.now(),
    })
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const start = atStart.get(e.turnId)
    if (e.agentId === undefined && e.index === 0 && start !== undefined && start.reading === undefined) {
      const reading = await readWindow($)
      if (reading !== undefined) {
        afterFirstStep.set(e.turnId, reading)
      }
    }
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const start = atStart.get(e.turnId)
    const firstStep = afterFirstStep.get(e.turnId)
    atStart.delete(e.turnId)
    afterFirstStep.delete(e.turnId)

    const answer = e.answer.trim()
    if (e.agentId !== undefined || answer === '') {
      return result
    }

    const labels = await readLabels($)
    const { rateLimits, cost } = await $.session.usage()
    const after = rateLimits.find((limit) => limit.kind === WINDOW)
    const usd = cost?.usd
    const turnUsd = usd === undefined || start?.usd === undefined ? '—' : formatUsd(Math.max(0, usd - start.usd))

    if (after === undefined) {
      // No usage window after a turn that reached the API: pay as you go, so show the cost.
      if (e.usage === undefined || usd === undefined) {
        return result
      }
      const line = `${labels.session}: ${formatUsd(usd)} · ${labels.turn}: ${turnUsd}`
      await addNote($, answer, line)
      return result
    }

    const isExtraUsage = rateLimits.some(
      (limit) => SUBSCRIPTION_WINDOWS.includes(limit.kind) && limit.percentUsed >= 100,
    )
    if (isExtraUsage) {
      const line = `${labels.session}: ${formatPercent(after.percentUsed)} ${labels.used} · ${labels.turn}: ${turnUsd} (${labels.extra})`
      await addNote($, answer, line)
      return result
    }

    const spent = spentThisTurn(after, start, firstStep)
    let spentText = '—'
    if (spent !== undefined) {
      // The API reports whole points, so a turn that moved nothing spent under one.
      spentText = spent < 1 ? '<1%' : `+${formatPercent(spent)}`
    }

    const line = `${labels.session}: ${formatPercent(after.percentUsed)} ${labels.used} · ${labels.turn}: ${spentText}`
    await addNote($, answer, line)
    return result
  })

  // The reply's last text block is the one the turn's answer ends with.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const text = e.props.text.trim()
    const list = await read($, notes)
    const note = text === '' ? undefined : list.findLast((n) => n.answer.endsWith(text))
    if (note === undefined) {
      return next(e)
    }

    // Line up with the reply's text: the terminal indents it past the bullet,
    // the desktop half a cell in from the message's edge.
    const indent = e.surface === 'terminal' ? 2 : 0.5
    const { Box, Markdown } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {await next(e)}
        <Box marginTop={1} paddingLeft={indent}>
          <Markdown dimColor text={note.line} />
        </Box>
      </Box>
    )
  })
}
