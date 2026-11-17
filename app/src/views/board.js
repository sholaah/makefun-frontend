// The board: every open bounty as a card that answers the only questions a builder
// asks first — how much, what does it cost to enter, how long is left, how crowded.
//
// The list renders once per data load; search, category and sort re-render only the
// cards grid from the copy already in memory, never a new request. Countdown labels
// carry data-deadline and are refreshed by the ticker in main.js, not by re-rendering.

import { openBounties } from '../api.js';
import { usd, int, esc, timeLeft, urgency } from '../format.js';

const state = { items: [], query: '', category: 'all', sort: 'ending' };

function cardHtml(c) {
  const pot = c.potUsd ?? c.rewardAmount;
  const fee = c.entryFeeUsd === null || c.entryFeeUsd === undefined || Number(c.entryFeeUsd) === 0 ? 'Free' : usd(c.entryFeeUsd);
  const skills = Array.isArray(c.skills) && c.skills.length ? `<div class="skills">${esc(c.skills.slice(0, 4).join(' · '))}</div>` : '';
  return `<a class="card" href="#/bounty/${encodeURIComponent(c.slug)}">
    <div class="row1">
      <span class="chip cat">${esc(c.category || 'Open')}</span>
      <span class="chip">${esc(c.harnessKind || 'program')}</span>
      <span class="sponsor">by ${esc(c.sponsor?.name || 'make.fun')}</span>
    </div>
    <h3>${esc(c.title)}</h3>
    <div class="pot"><small>LIVE POT</small>${usd(pot)}</div>
    ${skills}
    <div class="facts">
      <div class="fact"><div class="k">Entry fee</div><div class="v">${fee}</div></div>
      <div class="fact"><div class="k">Time left</div><div class="v" data-countdown="${esc(c.deadline)}" data-urgency="${urgency(c.deadline)}">${timeLeft(c.deadline)}</div></div>
      <div class="fact"><div class="k">Entries</div><div class="v">${int(c.submissionCount)}</div></div>
    </div>
  </a>`;
}

function visibleItems() {
  let items = state.items.slice();
  if (state.category !== 'all') items = items.filter((c) => (c.category || '') === state.category);
  if (state.query) {
    const q = state.query.toLowerCase();
    items = items.filter((c) => `${c.title} ${c.slug} ${c.category || ''} ${(c.skills || []).join(' ')}`.toLowerCase().includes(q));
  }
  const by = {
    ending: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    pot: (a, b) => (b.potUsd ?? b.rewardAmount ?? 0) - (a.potUsd ?? a.rewardAmount ?? 0),
    entries: (a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0),
    newest: (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0),
  }[state.sort];
  return items.sort(by);
}

function paintCards(root) {
  const items = visibleItems();
  root.querySelector('#cards').innerHTML = items.length
    ? items.map(cardHtml).join('')
    : '<div class="empty">No open bounties match. Loosen the filters — new ones land often.</div>';
  root.querySelector('#count').textContent = `${items.length} of ${state.items.length} open`;
  paintCountdowns(root);
}

/** Colour the countdown labels by urgency without touching anything else. */
export function paintCountdowns(root) {
  root.querySelectorAll('[data-countdown]').forEach((el) => {
    el.className = urgency(el.dataset.countdown);
    el.textContent = timeLeft(el.dataset.countdown);
  });
}

export async function renderBoard(root, query = '') {
  state.query = query;
  root.innerHTML = `<h1>Open bounties</h1>
    <p class="sub">Live from make.fun — every pot is escrowed USDC, paid in the open.</p>
    <div class="stats" id="stats">${'<div class="skel"></div>'.repeat(4)}</div>
    <div class="controls">
      <input id="q" type="search" placeholder="Filter by title, skill, category…" value="${esc(query)}" aria-label="Filter bounties">
      <select id="cat" aria-label="Category"><option value="all">All categories</option></select>
      <select id="sort" aria-label="Sort">
        <option value="ending">Ending soonest</option>
        <option value="pot">Biggest pot</option>
        <option value="entries">Most entries</option>
        <option value="newest">Newest</option>
      </select>
      <span class="count" id="count"></span>
    </div>
    <div class="cards" id="cards">${'<div class="skel"></div>'.repeat(6)}</div>`;

  const data = await openBounties();
  state.items = (data.items || []).filter((c) => (c.status === 'open' || !c.status) && new Date(c.deadline) > new Date());
  const cats = [...new Set(state.items.map((c) => c.category).filter(Boolean))].sort();
  const catSel = root.querySelector('#cat');
  for (const cat of cats) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSel.appendChild(opt);
  }
  const totalPot = state.items.reduce((s, c) => s + Number(c.potUsd ?? c.rewardAmount ?? 0), 0);
  const totalEntries = state.items.reduce((s, c) => s + Number(c.submissionCount ?? 0), 0);
  const closing = state.items.filter((c) => new Date(c.deadline) - Date.now() < 24 * 3600e3).length;
  root.querySelector('#stats').innerHTML = [
    ['Escrowed in open pots', usd(totalPot)],
    ['Live bounties', int(state.items.length)],
    ['Entries so far', int(totalEntries)],
    ['Closing within 24h', int(closing)],
  ].map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');

  root.querySelector('#q').addEventListener('input', (e) => {
    state.query = e.target.value;
    paintCards(root);
  });
  catSel.addEventListener('change', (e) => {
    state.category = e.target.value;
    paintCards(root);
  });
  root.querySelector('#sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    paintCards(root);
  });
  paintCards(root);
}
