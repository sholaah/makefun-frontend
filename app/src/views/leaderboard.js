// The global leaderboard: make.fun's builders ranked by their public record.
// Every row links through to that builder's profile.

import { rankings } from '../api.js';
import { usd, int, esc } from '../format.js';

function recordCells(r) {
  const rec = r && typeof r === 'object' ? r : {};
  const pick = (...keys) => {
    for (const k of keys) if (rec[k] !== undefined && rec[k] !== null) return rec[k];
    return undefined;
  };
  return {
    wins: pick('wins', 'won', 'first_places'),
    entries: pick('entries', 'submissions', 'entered'),
    earned: pick('earned_usd', 'prizes_usd', 'earnings_usd', 'total_prizes_usd'),
  };
}

export async function renderLeaderboard(root) {
  root.innerHTML = `<h1>Leaderboard</h1>
    <p class="sub">The builders taking the pots, ranked by make.fun's public record.</p>
    <div class="skel"></div>`;
  const data = await rankings();
  const items = data.items || [];
  if (!items.length) {
    root.innerHTML = '<h1>Leaderboard</h1><div class="empty">No ranked builders yet.</div>';
    return;
  }
  root.innerHTML = `<h1>Leaderboard</h1>
    <p class="sub">The builders taking the pots, ranked by make.fun's public record. Open a name for their full profile.</p>
    <table><thead><tr><th>#</th><th>Builder</th><th class="num">Wins</th><th class="num">Entries</th><th class="num">Earned</th></tr></thead>
    <tbody>${items.map((it) => {
      const cells = recordCells(it.record);
      const name = it.display_name || `@${it.handle}`;
      const avatar = it.avatar?.url_small || it.avatar?.url || it.image;
      return `<tr class="rank-${it.rank ?? ''}">
        <td class="mono">${it.rank ?? '—'}</td>
        <td><a class="who" href="#/profile/${encodeURIComponent(it.handle)}">
          ${avatar ? `<img class="avatar" src="https://make.fun${esc(avatar)}" alt="" loading="lazy">` : '<span class="avatar"></span>'}
          <span>${esc(name)}${it.display_name ? ` <span style="color:var(--faint);font-weight:400">@${esc(it.handle)}</span>` : ''}</span>
        </a></td>
        <td class="num">${cells.wins !== undefined ? int(cells.wins) : '—'}</td>
        <td class="num">${cells.entries !== undefined ? int(cells.entries) : '—'}</td>
        <td class="num">${cells.earned !== undefined ? usd(cells.earned) : '—'}</td>
      </tr>`;
    }).join('')}</tbody></table>`;
}
