// bounty.js — one competition in full: brief, money, deadlines, grading.

import { fetchBounty } from "../api.js";
import { dateTime, esc, money, timeLeft, urgencyClass } from "../format.js";
import { link } from "../router.js";

function criteriaList(criteria) {
  const items = Array.isArray(criteria)
    ? criteria.map((c) => (typeof c === "string" ? c : c.name ?? c.title ?? JSON.stringify(c)))
    : [];
  if (!items.length) return "";
  return `
    <h2>How it is graded</h2>
    <ul>${items.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`;
}

export async function renderBounty(root, slug) {
  root.innerHTML = `<p class="loading">Loading the bounty…</p>`;
  const { bounty: b, demo } = await fetchBounty(slug);

  if (!b) {
    root.innerHTML = `
      <div class="error-box">No bounty called “${esc(slug)}” answered.
      <a href="${link("/")}">Back to the board</a>.</div>`;
    return;
  }

  root.innerHTML = `
    <p><a href="${link("/")}">← All bounties</a></p>
    ${demo ? `<span class="demo-note">Demo snapshot — showing sample data for this bounty.</span>` : ""}
    <section class="detail">
      <span class="tag">${esc(b.category)}</span>
      <h1>${esc(b.title)}</h1>
      <div class="stat-strip">
        <div class="stat"><b>${money(b.pot)}</b><span>prize pot (escrowed)</span></div>
        <div class="stat"><b>${b.fee > 0 ? money(b.fee) : "Free"}</b><span>entry fee</span></div>
        <div class="stat"><b>${b.entries}</b><span>entries so far</span></div>
        <div class="stat"><b class="${urgencyClass(b.closesAt)}" data-closes-at="${esc(b.closesAt ?? "")}">${timeLeft(b.closesAt)}</b><span>until entries close</span></div>
      </div>
      <p><b>Closes:</b> ${dateTime(b.closesAt)} · <b>Status:</b> ${esc(b.status)}</p>
      <h2>The brief</h2>
      <pre>${esc(b.brief || b.blurb || "The full brief lives on make.fun — open the competition page for the canonical text.")}</pre>
      ${criteriaList(b.criteria)}
      <p>
        <a href="https://make.fun/competitions/${encodeURIComponent(b.slug)}" target="_blank" rel="noopener">
          Open on make.fun and enter →
        </a>
      </p>
    </section>`;
}
