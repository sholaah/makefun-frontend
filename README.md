# fun.board — a faster front window on make.fun

A complete, custom frontend for [make.fun](https://make.fun) that runs as static files
and reads make.fun's public API live. Four surfaces, each at its own address:

- **Board** (`#/`) — every open bounty with its live pot, entry fee, time left and
  entry count, plus escrow totals, full-text filter, category filter and four sorts.
- **Bounty page** (`#/bounty/<slug>`) — the facts, the full rewards table, the
  sponsor's description, and the bounty's own leaderboard.
- **Leaderboard** (`#/leaderboard`) — the global builder rankings.
- **Profile** (`#/profile/<handle>`) — a builder's record, payouts and entries.

**Run it:** serve `app/` with any static file server and open `index.html` — or run
`node serve.ts` here and visit http://localhost:8080. No build step, no framework.

## How it stays fast

- The first load is the shell, one stylesheet and four small modules; each view is
  `import()`ed only when its route opens.
- API answers are cached with a short TTL, identical in-flight requests are shared,
  and a stale answer is served instantly while a fresh one loads behind it.
- Countdowns tick in place every 30 seconds — the page never re-renders or refetches
  to show the time left.
- Filters and sorts run on the copy already in memory.

## Layout

- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output and
  writes the dossier with `vendor/makefun-frontend.ts`.
- `app/index.html` + `app/style.css` — the shell and the one stylesheet.
- `app/src/main.js` — bootstrap, routing, header search, the countdown ticker.
- `app/src/router.js` — the hash router.
- `app/src/api.js` — API reads with TTL cache, request sharing, stale-while-revalidate.
- `app/src/format.js` — money, dates, countdowns, escaping, a small Markdown renderer.
- `app/src/views/board.js` · `bounty.js` · `leaderboard.js` · `profile.js` — the views.
- `screenshots/` — captured from the live routes listed in `shots.json`.

## License

MIT — see `LICENSE`.
