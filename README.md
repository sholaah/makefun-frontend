# fun.board

[![make.fun](https://make.fun/badge.svg)](https://make.fun)

fun.board is a fast, dependency-free frontend for [make.fun](https://make.fun),
the bounty board where builders compete for escrowed USDC prizes on Solana.
It reads the live public API and renders four views:

- **Board** — every open bounty as a card with its prize pot, entry fee,
  entry count and a live countdown. Filter by text or category, sort by
  pot, deadline or popularity.
- **Bounty detail** — the full brief for one competition: what to build,
  how it is graded, deadlines and entry state.
- **Leaderboard** — the global builder rankings with winnings and wins.
- **Profiles** — a public page per builder with their entries and prizes.

## Run it

```sh
node main.ts          # needs Node 22+, serves on http://localhost:4173
PORT=8080 node main.ts
```

There is no build step and nothing to install. `main.ts` pins the
runtime, `serve.ts` is a small static server, and everything under
`app/` is vanilla ES modules styled by one stylesheet.

## Layout

| Path | What it does |
| --- | --- |
| `main.ts` | entrypoint, selects the node22 runtime |
| `serve.ts` | static file server with an SPA fallback |
| `app/index.html` | the single-page shell |
| `app/src/api.js` | data layer over the make.fun public API, with an offline fallback dataset |
| `app/src/router.js` | a tiny hash router |
| `app/src/views/` | board, bounty, leaderboard and profile views |
| `vendor/makefun-frontend.ts` | typed API shapes and a grading self-check |

## Data

All data comes from `https://make.fun/api/...` at runtime. If the API is
unreachable the app falls back to a small built-in sample set so the
interface never renders empty, and labels the data as a demo snapshot.

## License

MIT
