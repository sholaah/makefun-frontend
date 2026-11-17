// One bounty's page: the facts a builder decides on (pot, fee, dates, entries), the
// full rewards table, the sponsor's own description, and the bounty's leaderboard
// when it keeps one — each block rendered as its answer arrives, not in one rebuild.

import { bounty, bountyLeaderboard } from '../api.js';
import { usd, int, esc, dateTime, timeLeft, urgency, renderMarkdown } from '../format.js';

function rewardsTable(rewards) {
  if (!rewards || typeof rewards !== 'object') return '';
  const rows = Object.entries(rewards)
    .map(([place, amount]) => [Number(place), amount])
    .filter(([place]) => Number.isFinite(place))
    .sort((a, b) => a[0] - b[0]);
  if (!rows.length) return '';
  return `<h2>Rewards</h2><table><thead><tr><th>Place</th><th class="num">Prize (USDC)</th></tr></thead>
    <tbody>${rows.map(([place, amount]) => `<tr><td>${place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : place}</td><td class="num">${usd(amount)}</td></tr>`).join('')}</tbody></table>`;
}

function recordLine(r) {
  if (!r || typeof r !== 'object') return '';
  const bits = [];
  if (r.wins !== undefined) bits.push(`${int(r.wins)} wins`);
  if (r.entries !== undefined) bits.push(`${int(r.entries)} entries`);
  if (r.earned_usd !== undefined) bits.push(`${usd(r.earned_usd)} earned`);
  if (r.prizes_usd !== undefined) bits.push(`${usd(r.prizes_usd)} in prizes`);
  return bits.join(' · ');
}

async function paintLeaderboard(root, slug) {
  const slot = root.querySelector('#lb');
  if (!slot) return;
  try {
    const data = await bountyLeaderboard(slug);
    const items = data.items || data.leaderboard || [];
    if (!Array.isArray(items) || !items.length) {
      slot.innerHTML = '';
      return;
    }
    slot.innerHTML = `<h2>Leaderboard</h2><table><thead><tr><th>#</th><th>Builder</th><th>Record</th><th class="num">Score</th></tr></thead>
      <tbody>${items.slice(0, 15).map((it, i) => `<tr>
        <td>${it.rank ?? i + 1}</td>
        <td>${it.handle ? `<a href="#/profile/${encodeURIComponent(it.handle)}">@${esc(it.handle)}</a>` : '—'}</td>
        <td>${esc(recordLine(it.record) || '—')}</td>
        <td class="num">${it.score !== undefined ? int(it.score) : it.pnl_usd !== undefined ? usd(it.pnl_usd) : '—'}</td>
      </tr>`).join('')}</tbody></table>`;
  } catch {
    slot.innerHTML = '';
  }
}

export async function renderBounty(root, slug) {
  root.innerHTML = '<div class="skel"></div>';
  const c = await bounty(slug);
  const pot = c.potUsd ?? c.rewardAmount;
  const topPrize = c.rewards ? Math.max(...Object.values(c.rewards).map(Number)) : c.rewardAmount;
  const fee = c.entryFeeUsd === null || c.entryFeeUsd === undefined || Number(c.entryFeeUsd) === 0 ? 'Free' : usd(c.entryFeeUsd);
  root.innerHTML = `
    <div class="crumbs"><a href="#/">← All bounties</a></div>
    <div class="row1" style="display:flex;gap:8px;align-items:center">
      <span class="chip cat">${esc(c.category || 'Open')}</span>
      <span class="chip">${esc(c.status || '')}</span>
      <span class="sponsor" style="color:var(--faint)">by ${esc(c.sponsor?.name || 'make.fun')}</span>
    </div>
    <h1 style="margin-top:10px">${esc(c.title)}</h1>
    <p class="sub">${esc(c.summary || '')}</p>
    <div class="hero-facts">
      <div class="stat"><div class="k">Live pot</div><div class="v">${usd(pot)}</div></div>
      <div class="stat"><div class="k">Top prize</div><div class="v">${usd(topPrize)}</div></div>
      <div class="stat"><div class="k">Entry fee</div><div class="v">${fee}</div></div>
      <div class="stat"><div class="k">Entries</div><div class="v">${int(c.submissionCount)}</div></div>
      <div class="stat"><div class="k">Opened</div><div class="v" style="font-size:16.5px;padding-top:5px">${dateTime(c.opensAt || c.publishedAt)}</div></div>
      <div class="stat"><div class="k">Deadline</div><div class="v" style="font-size:16.5px;padding-top:5px">${dateTime(c.deadline)}</div></div>
      <div class="stat"><div class="k">Time left</div><div class="v" style="font-size:16.5px;padding-top:5px" data-countdown="${esc(c.deadline)}">${timeLeft(c.deadline)}</div></div>
      <div class="stat"><div class="k">Harness</div><div class="v" style="font-size:16.5px;padding-top:5px">${esc(c.harnessKind || '—')}</div></div>
    </div>
    <div class="actions">
      <a class="btn" href="https://make.fun/bounty/${encodeURIComponent(c.slug)}" target="_blank" rel="noopener">Enter on make.fun ↗</a>
      <a class="btn ghost" href="https://make.fun/c/${encodeURIComponent(c.slug)}/kit" target="_blank" rel="noopener">Download the kit</a>
    </div>
    ${rewardsTable(c.rewards)}
    <div id="lb"></div>
    <h2>About this bounty</h2>
    <div class="desc">${renderMarkdown(c.description || '')}</div>`;
  paintLeaderboard(root, slug);
}
