import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { UsageNote } from '../types'

// The "current session" figure in Claude's usage settings is the five-hour window.
const WINDOW = 'five_hour'
const MAX_NOTES = 100

const notes = atom({ plugin: 'turn-usage', key: 'notes' } as const, [] as UsageNote[])

const formatPercent = (n: number) => `${Math.round(n * 10) / 10}%`

const LABELS = {
  es: { session: 'Sesión', used: 'usado', turn: 'este turno' },
  en: { session: 'Session', used: 'used', turn: 'this turn' },
}

// Spanish when Claude Code's `language` setting says so, English otherwise.
async function readLabels($: EngineInterface): Promise<(typeof LABELS)['en']> {
  const { language } = await $.settings.read()
  const isSpanish = typeof language === 'string' && /^\s*(es\b|es-|spanish|espa[nñ]ol|castellano)/i.test(language)
  return isSpanish ? LABELS.es : LABELS.en
}

async function readWindow($: EngineInterface): Promise<SessionRateLimit | undefined> {
  const { rateLimits } = await $.session.usage()
  return rateLimits.find((limit) => limit.kind === WINDOW)
}

export const register: Register = (on) => {
  // The window's reading when each turn began, by turn id.
  const atStart = new Map<string, SessionRateLimit | undefined>()
  on('turn.start', async ($, e, next) => {
    atStart.set(e.turnId, await readWindow($))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const before = atStart.get(e.turnId)
    atStart.delete(e.turnId)

    const answer = e.answer.trim()
    if (e.agentId !== undefined || answer === '') {
      return result
    }

    const after = await readWindow($)
    if (after === undefined) {
      return result
    }

    const labels = await readLabels($)
    let spentText = '—'
    if (before !== undefined) {
      // A window that reset during the turn started over from zero.
      const hasReset = before.resetsAt !== after.resetsAt
      const spent = hasReset ? after.percentUsed : Math.max(0, after.percentUsed - before.percentUsed)
      // The API reports whole points, so a turn that moved nothing spent under one.
      spentText = spent < 1 ? '<1%' : `+${formatPercent(spent)}`
    }

    const line = `${labels.session}: ${formatPercent(after.percentUsed)} ${labels.used} · ${labels.turn}: ${spentText}`
    await update($, notes, (list) => [...list, { answer, line }].slice(-MAX_NOTES))
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
