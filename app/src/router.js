// The hash router: every surface has its own address, and navigation swaps only the
// view's contents — the top bar, the footer and the scroll frame never rebuild.
//
//   #/                      the board
//   #/bounty/<slug>         one bounty's page
//   #/leaderboard           the global rankings
//   #/profile/<handle>      a builder's public profile

export function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [head, param] = raw.split('/');
  if (head === 'bounty' && param) return { name: 'bounty', param: decodeURIComponent(param) };
  if (head === 'leaderboard') return { name: 'leaderboard' };
  if (head === 'profile' && param) return { name: 'profile', param: decodeURIComponent(param) };
  return { name: 'board' };
}

/** Run `handler(route)` now and on every hash change. Returns an unsubscribe. */
export function onRoute(handler) {
  const run = () => handler(parseRoute());
  window.addEventListener('hashchange', run);
  run();
  return () => window.removeEventListener('hashchange', run);
}
