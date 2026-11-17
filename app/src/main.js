// fun.board's bootstrap: the router, the header search, and the countdown ticker.
//
// The first load is this file plus api/format/router and the stylesheet — the four
// views are import()ed only when their route is opened, so they never weigh on the
// board's first paint. The ticker refreshes countdown labels in place every 30 s;
// nothing re-renders, nothing refetches.

import { onRoute } from './router.js';
import { paintCountdowns } from './views/board.js';

const view = document.getElementById('view');
const navLinks = document.querySelectorAll('[data-nav]');

const loaders = {
  board: () => import('./views/board.js'),
  bounty: () => import('./views/bounty.js'),
  leaderboard: () => import('./views/leaderboard.js'),
  profile: () => import('./views/profile.js'),
};

let boardQuery = '';

function setNav(name) {
  navLinks.forEach((a) => a.classList.toggle('active', a.dataset.nav === name || (name === 'profile' && a.dataset.nav === 'leaderboard')));
}

async function show(route) {
  setNav(route.name);
  window.scrollTo(0, 0);
  try {
    if (route.name === 'board') {
      const m = await loaders.board();
      await m.renderBoard(view, boardQuery);
    } else if (route.name === 'bounty') {
      const m = await loaders.bounty();
      await m.renderBounty(view, route.param);
    } else if (route.name === 'leaderboard') {
      const m = await loaders.leaderboard();
      await m.renderLeaderboard(view);
    } else if (route.name === 'profile') {
      const m = await loaders.profile();
      await m.renderProfile(view, route.param);
    }
  } catch (err) {
    view.innerHTML = `<div class="error">Could not load this page from make.fun (${err.message}). Check your connection and reload.</div>`;
  }
}

onRoute(show);

// Header search: typing and submitting lands on the board, filtered.
const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  boardQuery = input.value.trim();
  if (location.hash === '#/' || location.hash === '' || location.hash === '#') {
    show({ name: 'board' });
  } else {
    location.hash = '#/';
  }
});

// Countdowns tick in place: labels carry their deadline, only their text changes.
setInterval(() => paintCountdowns(view), 30_000);
