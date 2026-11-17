// api.js — the data layer.
//
// Every read goes to the public make.fun API first. If a request fails
// (offline, CORS, a 5xx), the caller gets a small built-in sample set
// instead, flagged with `demo: true`, so the UI never renders empty and
// can honestly label what it is showing.

const BASE = "https://make.fun/api";

async function getJson(path) {
  const res = await fetch(BASE + path, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`make.fun API ${res.status} for ${path}`);
  return res.json();
}

function asArray(payload, keys) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

/** Normalise one competition record into the shape the views expect. */
export function normaliseBounty(raw) {
  return {
    slug: raw.slug ?? raw.id ?? "",
    title: raw.title ?? raw.name ?? "Untitled bounty",
    blurb: raw.summary ?? raw.description ?? "",
    pot: Number(raw.pot_usd ?? raw.prize_usd ?? raw.escrow_usd ?? 0),
    fee: Number(raw.entry_fee_usd ?? raw.fee_usd ?? 0),
    entries: Number(raw.entry_count ?? raw.entries ?? 0),
    category: raw.category ?? raw.kind ?? "build",
    closesAt: raw.entries_close_at ?? raw.deadline ?? raw.closes_at ?? null,
    opensAt: raw.entries_open_at ?? raw.opens_at ?? null,
    status: raw.status ?? "open",
    brief: raw.brief ?? raw.requirements ?? raw.description ?? "",
    criteria: raw.grading ?? raw.criteria ?? [],
  };
}

export async function fetchBounties() {
  try {
    const payload = await getJson("/competitions");
    const list = asArray(payload, ["competitions", "items", "data"]).map(normaliseBounty);
    if (list.length) return { list, demo: false };
    throw new Error("empty list");
  } catch {
    return { list: FALLBACK_BOUNTIES.map(normaliseBounty), demo: true };
  }
}

export async function fetchBounty(slug) {
  try {
    const raw = await getJson(`/competitions/${encodeURIComponent(slug)}`);
    return { bounty: normaliseBounty(raw?.competition ?? raw), demo: false };
  } catch {
    const hit = FALLBACK_BOUNTIES.find((b) => b.slug === slug);
    return { bounty: hit ? normaliseBounty(hit) : null, demo: true };
  }
}

export async function fetchLeaderboard() {
  try {
    const payload = await getJson("/leaderboard");
    const rows = asArray(payload, ["leaderboard", "rows", "data"]);
    if (rows.length) return { rows: rows.map(normaliseRow), demo: false };
    throw new Error("empty leaderboard");
  } catch {
    return { rows: FALLBACK_LEADERS.map(normaliseRow), demo: true };
  }
}

function normaliseRow(raw, i) {
  return {
    rank: Number(raw.rank ?? i + 1),
    handle: raw.handle ?? raw.username ?? "anon",
    winnings: Number(raw.winnings_usd ?? raw.total_winnings ?? 0),
    wins: Number(raw.wins ?? 0),
    entries: Number(raw.entries ?? raw.submissions ?? 0),
  };
}

export async function fetchProfile(handle) {
  try {
    const raw = await getJson(`/users/${encodeURIComponent(handle)}`);
    const user = raw?.user ?? raw;
    return {
      demo: false,
      profile: {
        handle: user.handle ?? handle,
        joinedAt: user.created_at ?? user.joined_at ?? null,
        winnings: Number(user.winnings_usd ?? 0),
        wins: Number(user.wins ?? 0),
        entries: asArray(user, ["entries", "submissions"]).map((e) => ({
          slug: e.competition_slug ?? e.slug ?? "",
          title: e.competition_title ?? e.title ?? "Entry",
          placed: e.placement ?? e.result ?? "—",
          prize: Number(e.prize_usd ?? 0),
        })),
      },
    };
  } catch {
    return { demo: true, profile: FALLBACK_PROFILE(handle) };
  }
}

// ---- fallback sample data (only used when the live API is unreachable) ----

const FALLBACK_BOUNTIES = [
  { slug: "demo-token-radar", title: "Build the best token launch radar", summary: "Track fresh Solana launches and score them for risk in real time.", pot_usd: 1325, entry_fee_usd: 0, entry_count: 212, category: "data", entries_close_at: "2026-12-14T10:00:00Z" },
  { slug: "demo-best-game", title: "Make the best game", summary: "A complete browser game, judged on fun, polish and originality.", pot_usd: 1000, entry_fee_usd: 0, entry_count: 486, category: "game", entries_close_at: "2026-11-19T18:00:00Z" },
  { slug: "demo-frontend", title: "Build the best make.fun frontend", summary: "Reimagine this very board: fast, clear, delightful.", pot_usd: 817, entry_fee_usd: 0.5, entry_count: 784, category: "frontend", entries_close_at: "2026-11-17T12:30:00Z" },
];

const FALLBACK_LEADERS = [
  { handle: "sholaah", winnings_usd: 0, wins: 0, entries: 3 },
  { handle: "demo-builder", winnings_usd: 2450, wins: 3, entries: 21 },
  { handle: "demo-solver", winnings_usd: 1800, wins: 2, entries: 14 },
];

function FALLBACK_PROFILE(handle) {
  return {
    handle,
    joinedAt: null,
    winnings: 0,
    wins: 0,
    entries: [
      { slug: "demo-best-game", title: "Make the best game", placed: "scored", prize: 0 },
      { slug: "demo-token-radar", title: "Build the best token launch radar", placed: "scored", prize: 0 },
    ],
  };
}
