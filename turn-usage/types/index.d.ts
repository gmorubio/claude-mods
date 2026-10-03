/** One finished turn: the reply's final text and the usage line drawn under it. */
export type UsageNote = { answer: string; line: string }

declare module 'claude-code' {
  interface PluginState {
    'turn-usage': { notes: UsageNote[] }
  }
}
