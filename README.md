# claude-mods

Mods for [Claude Code](https://claude.com/claude-code).

| Mod | What it does |
| --- | --- |
| [pet](pet/) | A pixel art cat, dog or otter above the prompt in the desktop app that sleeps while Claude is idle and plays while it works |
| [turn-usage](turn-usage/) | A dim line under each Claude reply with how much of your current session's usage limit is used and how much that turn spent |

## Install

This repository is a Claude Code plugin marketplace. In your shell:

```bash
claude plugin marketplace add gmorubio/claude-mods
claude plugin install pet@claude-mods
claude plugin install turn-usage@claude-mods
```

Or both at once from inside a Claude Code session:

```
/plugin install pet --marketplace gmorubio/claude-mods
/plugin install turn-usage --marketplace gmorubio/claude-mods
```

## License

[MIT](LICENSE)
