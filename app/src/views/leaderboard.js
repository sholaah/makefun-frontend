// leaderboard.js — the global builder rankings.

import { fetchLeaderboard } from "../api.js";
import { esc, money } from "../format.js";
import { link } from "../router.js";

export async function renderLeaderboard(root) {
  root.innerHTML = `<p class="loading">Loading the leaderboard…</p>`;
  const { rows, demo } = await fetchLeaderboard();

  const totalPaid = rows.reduce((sum, r) => sum + r.winnings, 0);

  root.innerHTML = `
    <div class="page-head">
      <h1>Leaderboard</h1>
      <p>Builders ranked by lifetime winnings. ${rows.length} ranked · ${money(totalPaid)} paid out across this table.</p>
    </div>
    ${demo ? `<span class="demo-note">Demo snapshot — the live API did not answer, showing sample data.</span>` : ""}
    ${rows.length ? `
    <table class="board-table">
      <thead>
        <tr><th>#</th><th>Builder</th><th>Winnings</th><th>Wins</th><th>Entries</th></tr>
      </thead>
      <tbody>
        ${rows.map((r) => `
          <tr>
            <td class="rank">${r.rank}</td>
            <td><a href="${link("/u/" + encodeURIComponent(r.handle))}">@${esc(r.handle)}</a></td>
            <td><b>${money(r.winnings)}</b></td>
            <td>${r.wins}</td>
            <td>${r.entries}</td>
          </tr>`).join("")}
      </tbody>
    </table>` : `<p class="empty">No ranked builders yet. The first bounty you win puts you here.</p>`}`;
}
