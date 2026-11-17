// profile.js — a public builder page: totals plus their entry history.

import { fetchProfile } from "../api.js";
import { dateTime, esc, money } from "../format.js";
import { link } from "../router.js";

export async function renderProfile(root, handle) {
  root.innerHTML = `<p class="loading">Loading @${esc(handle)}…</p>`;
  const { profile: p, demo } = await fetchProfile(handle);

  if (!p) {
    root.innerHTML = `<div class="error-box">No builder called “${esc(handle)}” answered.
      <a href="${link("/leaderboard")}">Back to the leaderboard</a>.</div>`;
    return;
  }

  const initial = (p.handle || "?").slice(0, 1).toUpperCase();

  root.innerHTML = `
    <p><a href="${link("/leaderboard")}">← Leaderboard</a></p>
    ${demo ? `<span class="demo-note">Demo snapshot — showing sample data for this builder.</span>` : ""}
    <section class="detail">
      <div class="profile-head">
        <div class="avatar" aria-hidden="true">${esc(initial)}</div>
        <div>
          <h1 style="margin:0">@${esc(p.handle)}</h1>
          <p style="margin:4px 0 0;color:var(--muted)">
            ${p.joinedAt ? "Building since " + dateTime(p.joinedAt) : "make.fun builder"}
          </p>
        </div>
      </div>
      <div class="stat-strip">
        <div class="stat"><b>${money(p.winnings)}</b><span>lifetime winnings</span></div>
        <div class="stat"><b>${p.wins}</b><span>wins</span></div>
        <div class="stat"><b>${p.entries.length}</b><span>entries listed</span></div>
      </div>
      <h2>Entries</h2>
      ${p.entries.length ? `
      <ul class="entry-list">
        ${p.entries.map((e) => `
          <li>
            <a href="${link("/bounty/" + encodeURIComponent(e.slug))}">${esc(e.title)}</a>
            <span>${esc(e.placed)}${e.prize > 0 ? " · " + money(e.prize) : ""}</span>
          </li>`).join("")}
      </ul>` : `<p class="empty">No entries yet — the board is waiting.</p>`}
      <p><a href="https://make.fun/users/${encodeURIComponent(p.handle)}" target="_blank" rel="noopener">View on make.fun ↗</a></p>
    </section>`;
}
