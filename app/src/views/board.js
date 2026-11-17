// board.js — the bounty board: searchable, filterable cards.

import { fetchBounties } from "../api.js";
import { esc, money, timeLeft, truncate, urgencyClass } from "../format.js";
import { link } from "../router.js";

const SORTS = {
  pot: (a, b) => b.pot - a.pot,
  closing: (a, b) => new Date(a.closesAt ?? 0) - new Date(b.closesAt ?? 0),
  entries: (a, b) => b.entries - a.entries,
  newest: (a, b) => new Date(b.opensAt ?? 0) - new Date(a.opensAt ?? 0),
};

function card(b) {
  return `
  <article class="card">
    <span class="tag">${esc(b.category)}</span>
    <h3><a href="${link("/bounty/" + encodeURIComponent(b.slug))}">${esc(b.title)}</a></h3>
    <p class="blurb">${esc(truncate(b.blurb, 150))}</p>
    <div class="pot">${money(b.pot)}</div>
    <div class="meta-row">
      <span>fee <b>${b.fee > 0 ? money(b.fee) : "free"}</b></span>
      <span><b>${b.entries}</b> entries</span>
      <span class="${urgencyClass(b.closesAt)}" data-closes-at="${esc(b.closesAt ?? "")}">${timeLeft(b.closesAt)}</span>
    </div>
  </article>`;
}

export async function renderBoard(root) {
  root.innerHTML = `<p class="loading">Loading the board…</p>`;
  const { list, demo } = await fetchBounties();

  const categories = [...new Set(list.map((b) => b.category))].sort();
  const state = { text: "", category: "all", sort: "pot" };

  root.innerHTML = `
    <div class="page-head">
      <h1>Open bounties</h1>
      <p>${list.length} competitions with escrowed USDC pots. Pick one, build, submit before the countdown ends.</p>
    </div>
    ${demo ? `<span class="demo-note">Demo snapshot — the live API did not answer, showing sample data.</span>` : ""}
    <div class="controls">
      <input type="search" id="q" placeholder="Search bounties…" aria-label="Search bounties">
      <select id="cat" aria-label="Category">
        <option value="all">All categories</option>
        ${categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}
      </select>
      <select id="sort" aria-label="Sort by">
        <option value="pot">Biggest pot</option>
        <option value="closing">Closing soonest</option>
        <option value="entries">Most entries</option>
        <option value="newest">Newest</option>
      </select>
    </div>
    <div id="grid"></div>`;

  const grid = root.querySelector("#grid");

  function paint() {
    const now = Date.now();
    const visible = list
      .filter((b) => !b.closesAt || new Date(b.closesAt).getTime() > now || state.text)
      .filter((b) => state.category === "all" || b.category === state.category)
      .filter((b) => (b.title + " " + b.blurb).toLowerCase().includes(state.text.toLowerCase()))
      .sort(SORTS[state.sort]);
    grid.innerHTML = visible.length
      ? `<div class="card-grid">${visible.map(card).join("")}</div>`
      : `<p class="empty">No bounties match that filter. Try clearing the search.</p>`;
  }

  root.querySelector("#q").addEventListener("input", (e) => { state.text = e.target.value; paint(); });
  root.querySelector("#cat").addEventListener("change", (e) => { state.category = e.target.value; paint(); });
  root.querySelector("#sort").addEventListener("change", (e) => { state.sort = e.target.value; paint(); });
  paint();
}
