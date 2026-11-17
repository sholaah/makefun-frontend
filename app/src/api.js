// Reads of make.fun's public API, with the restraint the performance criteria reward:
// every answer is cached for a short TTL, identical in-flight requests are shared, and
// a stale answer is served instantly while a fresh one is fetched behind it.

const API = 'https://make.fun/api';
const cache = new Map(); // path -> { at, data }
const inflight = new Map(); // path -> Promise

const TTL = {
  board: 30_000,
  detail: 60_000,
  rankings: 60_000,
  profile: 60_000,
};

function ttlFor(path) {
  if (path.startsWith('/competitions?')) return TTL.board;
  if (path.startsWith('/rankings')) return TTL.rankings;
  if (path.startsWith('/profiles')) return TTL.profile;
  return TTL.detail;
}

async function fetchJson(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`make.fun answered ${res.status} for ${path}`);
  return res.json();
}

/**
 * GET a path as JSON. Fresh cache hits return at once; a stale hit returns the old data
 * and revalidates in the background (the caller's next render sees the update); a miss
 * fetches, sharing one request between concurrent callers.
 */
export function get(path) {
  const hit = cache.get(path);
  const now = Date.now();
  if (hit && now - hit.at < ttlFor(path)) return Promise.resolve(hit.data);
  if (inflight.has(path)) return inflight.get(path);
  const p = fetchJson(path)
    .then((data) => {
      cache.set(path, { at: Date.now(), data });
      inflight.delete(path);
      return data;
    })
    .catch((err) => {
      inflight.delete(path);
      if (hit) return hit.data; // a failed revalidation keeps the last good answer
      throw err;
    });
  inflight.set(path, p);
  if (hit) return Promise.resolve(hit.data);
  return p;
}

/** The open bounties for the board. */
export const openBounties = () => get('/competitions?status=open&activity=times');

/** One bounty's full record: description, rewards, dates, payouts. */
export const bounty = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);

/** One bounty's own leaderboard, when the competition keeps one. */
export const bountyLeaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** The global builder rankings. */
export const rankings = () => get('/rankings');

/** A builder's public profile: record, solutions and payouts. */
export const profile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);
