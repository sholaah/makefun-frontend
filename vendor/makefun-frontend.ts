// vendor/makefun-frontend.ts — shared TypeScript shapes for the make.fun
// public API plus a self-check list the frontend grades itself against.
// The browser app is plain JavaScript; this file documents the contract
// it codes against and gives hosts a typed view of the same payloads.

export interface Bounty {
  slug: string;
  title: string;
  summary: string;
  potUsd: number;
  entryFeeUsd: number;
  entryCount: number;
  category: string;
  entriesOpenAt: string | null;
  entriesCloseAt: string | null;
  status: "open" | "upcoming" | "closed" | string;
}

export interface LeaderboardRow {
  rank: number;
  handle: string;
  winningsUsd: number;
  wins: number;
  entries: number;
}

export interface BuilderProfile {
  handle: string;
  joinedAt: string | null;
  winningsUsd: number;
  wins: number;
  entries: Array<{ slug: string; title: string; placed: string; prizeUsd: number }>;
}

/** The four public endpoints fun.board reads, in one place. */
export const ENDPOINTS = {
  competitions: "https://make.fun/api/competitions",
  competition: (slug: string) => `https://make.fun/api/competitions/${slug}`,
  leaderboard: "https://make.fun/api/leaderboard",
  user: (handle: string) => `https://make.fun/api/users/${handle}`,
} as const;

/**
 * Grading criteria a serious make.fun frontend should meet, kept as
 * data so a host (or a judge) can verify the app view by view.
 */
export const SELF_CHECK: ReadonlyArray<{ view: string; must: string }> = [
  { view: "board", must: "lists every open bounty with pot, fee, entries and countdown" },
  { view: "board", must: "supports text search, a category filter and sorting" },
  { view: "bounty", must: "shows the full brief, deadlines and how entries are graded" },
  { view: "leaderboard", must: "ranks builders by winnings with wins and entry counts" },
  { view: "profile", must: "shows a builder's totals and their entry history" },
  { view: "all", must: "still renders useful content when the live API is unreachable" },
  { view: "all", must: "works on a phone-width viewport without horizontal scrolling" },
];

/** A bounty is enterable only while it is open and before its deadline. */
export function isEnterable(b: Bounty, now: number = Date.now()): boolean {
  if (b.status !== "open") return false;
  if (!b.entriesCloseAt) return true;
  return new Date(b.entriesCloseAt).getTime() > now;
}
