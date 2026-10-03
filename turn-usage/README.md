# turn-usage

A dim line under each Claude reply that shows how much of your current session's usage limit is used, and how much the turn that just ended spent:

```
Session: 39% used · this turn: <1%
```

The "current session" figure is the five-hour usage window, the same one Claude's usage settings call "Current session".

## How it reads

| Shown | Meaning |
| --- | --- |
| `this turn: +2%` | The session figure rose 2 points during the turn |
| `this turn: <1%` | The turn didn't move the session figure a whole point |
| `this turn: —` | No reading from before the turn yet (the first turn of a session) |

The usage figure comes from the API's rate-limit headers, which report whole percentage points, so a turn's share is only as precise as that: a `+1%` can be a smaller turn that happened to cross a point. The figure is your account's, so other Claude sessions running at the same time count towards it too. With no subscription (an API key) there is no usage window and the line doesn't show.

## Language

The line is in English, or in Spanish when Claude Code's `language` setting is Spanish (`"language": "spanish"` in `~/.claude/settings.json`):

```
Sesión: 39% usado · este turno: <1%
```

## Requirements

- Claude Code on a Claude subscription, in the desktop app or the terminal.
- A Claude Code build with function-hook mods (`hooks/hooks.json` with `modules`).

## Install

In your shell:

```bash
claude plugin marketplace add gmorubio/claude-mods
claude plugin install turn-usage@claude-mods
```

Or both at once from inside a Claude Code session:

```
/plugin install turn-usage --marketplace gmorubio/claude-mods
```

Or load it from a local checkout for one session:

```
claude --plugin-dir /path/to/claude-mods/turn-usage
```

## How it's built

`hooks/register.tsx` is the whole mod. It reads the five-hour window when a turn starts and again when it completes, keeps the reply's final text with its usage line, and when the desktop or the terminal draws a reply's text block, adds the line under the block that ends that reply.

## License

[MIT](../LICENSE)
