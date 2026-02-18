import { getSpots } from './dataLoader.js';
import { renderCards } from './cardRenderer.js';
import { Paginator } from './pagination.js';
import { getViewPreferences, setViewPreferences } from './viewPreferences.js';

const container = document.getElementById('cards-container');
const loadingEl = document.getElementById('loading');
const emptyEl = document.getElementById('empty-message');
const viewToolbar = document.getElementById('fav-view-toolbar');
const pageInfoEl = document.getElementById('page-info');
const paginationEl = document.getElementById('pagination');

let paginator = null;

function updatePaginationUI() {
  if (!paginator) return;
  const total = paginator.getTotalPages();
  const current = paginator.currentPage;
  if (pageInfoEl) pageInfoEl.textContent = total > 0 ? `Page ${current} of ${total}` : '';
  if (paginationEl) {
    paginationEl.innerHTML = '';
    if (total <= 0) return;
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = current === 1;
    prevBtn.addEventListener('click', () => { paginator.prevPage(); renderFavorites(); });
    paginationEl.appendChild(prevBtn);
    for (let i = 1; i <= total; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === current ? 'active' : '';
      pageBtn.addEventListener('click', () => { paginator.goToPage(i); renderFavorites(); });
      paginationEl.appendChild(pageBtn);
    }
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = current === total;
    nextBtn.addEventListener('click', () => { paginator.nextPage(); renderFavorites(); });
    paginationEl.appendChild(nextBtn);
  }
}

function applyColumnClass() {
  const prefs = getViewPreferences();
  container.className = 'cards-grid cols-' + prefs.columns;
}

function wireViewToolbar() {
  const btns = document.querySelectorAll('.view-col-btn');
  const prefs = getViewPreferences();
  btns.forEach((btn) => {
    const cols = parseInt(btn.dataset.cols, 10);
    btn.setAttribute('aria-pressed', cols === prefs.columns ? 'true' : 'false');
    btn.addEventListener('click', () => {
      setViewPreferences({ ...getViewPreferences(), columns: cols });
      document.querySelectorAll('.view-col-btn').forEach((b) => b.setAttribute('aria-pressed', parseInt(b.dataset.cols, 10) === cols ? 'true' : 'false'));
      applyColumnClass();
    });
  });
}

async function renderFavorites() {
  const pageItems = paginator.getCurrentPageItems();
  await renderCards(pageItems, container);
  updatePaginationUI();
  applyColumnClass();
}

async function init() {
  try {
    loadingEl.style.display = 'block';
    const allSpots = await getSpots();
    const favoriteIds = JSON.parse(localStorage.getItem('studyspots_favorites') || '[]');
    const favorites = allSpots.filter(spot => favoriteIds.includes(spot.id));
    if (favorites.length === 0) {
      emptyEl.style.display = 'block';
      viewToolbar.style.display = 'none';
    } else {
      viewToolbar.style.display = 'flex';
      const prefs = getViewPreferences();
      paginator = new Paginator(favorites, prefs.itemsPerPage);
      await renderFavorites();
      wireViewToolbar();
    }
  } catch (err) {
    container.textContent = 'Failed to load favorites.';
    console.error(err);
  } finally {
    loadingEl.style.display = 'none';
  }
}

init();
