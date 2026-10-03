# turn-usage

A dim line under each Claude reply that shows how much of your current session's usage limit is used, and how much the turn that just ended spent:

```
Session: 39% used · this turn: <1%
```

The "current session" figure is the five-hour usage window, the same one Claude's usage settings call "Current session".

On pay as you go (an API key, Bedrock or Vertex) there is no usage window, so the line shows what the session and the turn cost instead, in US dollars, as `/cost` counts it:

```
Session: $1.84 · this turn: $0.12
```

## How it reads

On a subscription:

| Shown | Meaning |
| --- | --- |
| `this turn: +2%` | The session figure rose 2 points during the turn |
| `this turn: <1%` | The turn didn't move the session figure a whole point |
| `this turn: —` | Nothing to compare against: the session's first turn ended before any reading came |

Once a subscription window (the five-hour or the weekly one) is used up, a turn that still completes ran on extra usage, so the line shows that turn's cost instead of its points:

```
Session: 100% used · this turn: $0.12 (extra usage)
```

The turn that crosses 100% is still measured in points; the cost shows from the next one.

On pay as you go and extra usage, a turn under a cent shows `<$0.01`. The cost is Claude Code's estimate from the tokens and the public API prices, always in dollars whatever your billing currency, not your invoice.

A session's first turn has no reading from before it, since the figure only arrives with an API response. If the five-hour window began with that turn, the turn started it at 0%; otherwise the reading that came with the turn's first request stands in, which leaves out only that one request.

The usage figure comes from the API's rate-limit headers, which report whole percentage points, so a turn's share is only as precise as that: a `+1%` can be a smaller turn that happened to cross a point. The figure is your account's, so other Claude sessions running at the same time count towards it too.

## Language

The line is in English, or in Spanish when Claude Code's `language` setting is Spanish (`"language": "spanish"` in `~/.claude/settings.json`):

```
Sesión: 39% usado · este turno: <1%
```

## Requirements

- Claude Code in the desktop app or the terminal, on a Claude subscription or pay as you go.
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

`hooks/register.tsx` is the whole mod. It reads the five-hour window (or, with none, the session's cost) when a turn starts and again when it completes, keeps the reply's final text with its usage line, and when the desktop or the terminal draws a reply's text block, adds the line under the block that ends that reply.

## Privacy

turn-usage makes no network requests and sends nothing anywhere. See the [privacy policy](PRIVACY.md).

## License

[MIT](../LICENSE)
