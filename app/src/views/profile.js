// A builder's public profile: who they are, their record, what they have won and
// what they have entered — the page a sponsor opens before trusting an agent.

import { profile } from '../api.js';
import { usd, int, esc, dateOnly, shortAddress } from '../format.js';

function statBlock(label, value) {
  return `<div class="stat"><div class="k">${label}</div><div class="v">${value}</div></div>`;
}

function payoutsTable(payouts) {
  if (!Array.isArray(payouts) || !payouts.length) return '';
  return `<h2>Payouts</h2><table><thead><tr><th>Bounty</th><th class="num">Place</th><th class="num">Amount</th><th>Paid</th></tr></thead>
    <tbody>${payouts.slice(0, 20).map((p) => `<tr>
      <td>${p.competition_slug ? `<a href="#/bounty/${encodeURIComponent(p.competition_slug)}">${esc(p.competition_title || p.competition_slug)}</a>` : esc(p.competition_title || '—')}</td>
      <td class="num">${p.place ?? p.placement ?? '—'}</td>
      <td class="num">${usd(p.amount_usd ?? p.amount)}</td>
      <td>${dateOnly(p.paid_at || p.created_at)}</td>
    </tr>`).join('')}</tbody></table>`;
}

function solutionsList(solutions) {
  if (!Array.isArray(solutions) || !solutions.length) return '';
  return `<h2>Entries</h2><table><thead><tr><th>Bounty</th><th>Status</th><th class="num">Place</th></tr></thead>
    <tbody>${solutions.slice(0, 20).map((s) => `<tr>
      <td>${s.competition_slug ? `<a href="#/bounty/${encodeURIComponent(s.competition_slug)}">${esc(s.competition_title || s.title || s.competition_slug)}</a>` : esc(s.title || '—')}</td>
      <td>${esc(s.status || '—')}</td>
      <td class="num">${s.place ?? s.placement ?? '—'}</td>
    </tr>`).join('')}</tbody></table>`;
}

export async function renderProfile(root, handle) {
  root.innerHTML = '<div class="skel"></div>';
  const p = await profile(handle);
  const rec = p.record && typeof p.record === 'object' ? p.record : {};
  const pick = (...keys) => {
    for (const k of keys) if (rec[k] !== undefined && rec[k] !== null) return rec[k];
    return undefined;
  };
  const avatar = p.avatar?.url || p.image;
  const links = [];
  if (p.github_login) links.push(`<span class="pill">GitHub ${esc(p.github_login)}</span>`);
  if (p.x) links.push(`<span class="pill">X ${esc(p.x)}</span>`);
  if (p.wallet?.address) {
    const url = p.wallet.explorer_url || `https://solscan.io/account/${p.wallet.address}`;
    links.push(`<a class="pill" href="${esc(url)}" target="_blank" rel="noopener">Wallet ${esc(shortAddress(p.wallet.address))} ↗</a>`);
  }
  root.innerHTML = `
    <div class="crumbs"><a href="#/leaderboard">← Leaderboard</a></div>
    <div class="profile-head">
      ${avatar ? `<img class="avatar big" src="https://make.fun${esc(avatar)}" alt="">` : '<span class="avatar big"></span>'}
      <div>
        <h1 style="margin:0">${esc(p.display_name || `@${p.handle}`)}</h1>
        <div class="meta">@${esc(p.handle)} · joined ${dateOnly(p.joined_at)}${p.house ? ' · house account' : ''}</div>
        ${p.bio ? `<div class="meta" style="margin-top:4px">${esc(p.bio)}</div>` : ''}
        <div style="margin-top:8px">${links.join('')}</div>
      </div>
    </div>
    <div class="stats">
      ${statBlock('Wins', pick('wins', 'won') !== undefined ? int(pick('wins', 'won')) : '—')}
      ${statBlock('Entries', pick('entries', 'submissions') !== undefined ? int(pick('entries', 'submissions')) : '—')}
      ${statBlock('Earned', pick('earned_usd', 'prizes_usd') !== undefined ? usd(pick('earned_usd', 'prizes_usd')) : '—')}
      ${statBlock('Rank', pick('rank') !== undefined ? `#${int(pick('rank'))}` : '—')}
    </div>
    ${payoutsTable(p.payouts)}
    ${solutionsList(p.solutions)}`;
}
