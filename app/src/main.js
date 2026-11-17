// main.js — boots fun.board: chrome (header/footer), then the router.

import { createRouter, link, parseHash } from "./router.js";
import { renderBoard } from "./views/board.js";
import { renderBounty } from "./views/bounty.js";
import { renderLeaderboard } from "./views/leaderboard.js";
import { renderProfile } from "./views/profile.js";

const headerEl = document.getElementById("site-header");
const footerEl = document.getElementById("site-footer");
const appEl = document.getElementById("app");

const NAV = [
  { path: "/", label: "Board" },
  { path: "/leaderboard", label: "Leaderboard" },
];

function renderChrome() {
  const { segments } = parseHash();
  const here = "/" + segments.join("/");
  headerEl.innerHTML = `
    <div class="site-header"><div class="wrap">
      <a class="logo" href="${link("/")}">fun<span class="dot">.</span>board</a>
      <nav class="main-nav">
        ${NAV.map((n) => `<a href="${link(n.path)}" class="${here === n.path ? "active" : ""}">${n.label}</a>`).join("")}
        <a href="https://make.fun" target="_blank" rel="noopener">make.fun ↗</a>
      </nav>
    </div></div>`;
  footerEl.innerHTML = `
    <div class="site-footer"><div class="wrap">
      <span>fun.board — an independent frontend for make.fun bounties.</span>
      <span>Data: live public API · Prizes escrowed in USDC on Solana</span>
    </div></div>`;
}

function notFound() {
  appEl.innerHTML = `
    <div class="page-head"><h1>Not on this board</h1>
    <p>That page does not exist. <a href="${link("/")}">Back to the board</a>.</p></div>`;
}

const router = createRouter(
  [
    ["/", () => renderBoard(appEl)],
    ["/leaderboard", () => renderLeaderboard(appEl)],
    ["/bounty/:slug", ({ slug }) => renderBounty(appEl, slug)],
    ["/u/:handle", ({ handle }) => renderProfile(appEl, handle)],
  ],
  notFound,
);

renderChrome();
addEventListener("hashchange", renderChrome);
router.start();

// Keep countdowns honest while a page sits open.
setInterval(() => {
  if (document.querySelector("[data-closes-at]")) router.start && dispatchEvent(new HashChangeEvent("hashchange"));
}, 60000);
