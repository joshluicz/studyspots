import { getSpots } from './dataLoader.js';
import { renderCards } from './cardRenderer.js';
import { applyFilters } from './filters.js';
import { Paginator } from './pagination.js';
import { getViewPreferences, setViewPreferences } from './viewPreferences.js';

const container = document.getElementById('cards-container');
const loadingEl = document.getElementById('loading');
const mallContent = document.getElementById('mall-content');
const mallTitle = document.getElementById('mall-title');
const mallDescription = document.getElementById('mall-description');
const noSpotsEl = document.getElementById('no-spots');
const filtersSection = document.getElementById('mall-filters-section');
const viewToolbar = document.getElementById('mall-view-toolbar');
const pageInfoEl = document.getElementById('page-info');
const paginationEl = document.getElementById('pagination');

const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('filter-category');
const noiseSelect = document.getElementById('filter-noise');
const wifiSelect = document.getElementById('filter-wifi');
const chargingSelect = document.getElementById('filter-charging');
const toggleMoreBtn = document.getElementById('toggle-more-filters');
const filtersExtra = document.getElementById('filters-extra');

let mallSpots = [];
let mallName = '';
let paginator = null;

async function getMalls() {
  const url = './data/malls.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load malls');
  const data = await res.json();
  const mallMap = {};
  data.forEach(m => { mallMap[m.id] = m; });
  return mallMap;
}

function getFilterState() {
  return {
    category: categorySelect?.value || 'any',
    area: 'any',
    noise: noiseSelect?.value || 'any',
    wifi: wifiSelect?.value || 'any',
    charging: chargingSelect?.value || 'any',
    search: searchInput?.value || ''
  };
}

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
    prevBtn.addEventListener('click', () => { paginator.prevPage(); renderFiltered().catch(() => {}); });
    paginationEl.appendChild(prevBtn);
    for (let i = 1; i <= total; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === current ? 'active' : '';
      pageBtn.addEventListener('click', () => { paginator.goToPage(i); renderFiltered().catch(() => {}); });
      paginationEl.appendChild(pageBtn);
    }
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = current === total;
    nextBtn.addEventListener('click', () => { paginator.nextPage(); renderFiltered().catch(() => {}); });
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

async function renderFiltered() {
  const state = getFilterState();
  const filtered = applyFilters(mallSpots, state);
  const prefs = getViewPreferences();
  paginator = new Paginator(filtered, prefs.itemsPerPage);
  const pageItems = paginator.getCurrentPageItems();
  await renderCards(pageItems, container);
  updatePaginationUI();
  applyColumnClass();
}

function wireEvents() {
  [searchInput, categorySelect, noiseSelect, wifiSelect, chargingSelect].forEach((el) => {
    if (!el) return;
    el.addEventListener('change', () => { if (paginator) paginator.reset(); renderFiltered().catch(() => {}); });
    el.addEventListener('input', () => { if (paginator) paginator.reset(); renderFiltered().catch(() => {}); });
  });
  if (toggleMoreBtn && filtersExtra) {
    toggleMoreBtn.addEventListener('click', () => {
      const isExpanded = filtersExtra.hidden;
      filtersExtra.hidden = !isExpanded;
      toggleMoreBtn.setAttribute('aria-expanded', String(!isExpanded));
      toggleMoreBtn.querySelector('.btn-more-filters-text').textContent = isExpanded ? 'Show fewer filters' : 'Show more filters';
      toggleMoreBtn.querySelector('.btn-more-filters-chevron').textContent = isExpanded ? '▲' : '▼';
    });
  }
}

async function init() {
  try {
    const params = new URLSearchParams(window.location.search);
    const mallId = params.get('id');
    if (!mallId) {
      container.textContent = 'Invalid mall ID.';
      loadingEl.style.display = 'none';
      return;
    }
    loadingEl.style.display = 'block';
    const mallsMap = await getMalls();
    const mall = mallsMap[mallId];
    if (!mall) {
      container.textContent = 'Mall not found.';
      loadingEl.style.display = 'none';
      return;
    }
    mallName = mall.name;
    mallTitle.textContent = mall.name;
    mallDescription.textContent = mall.description;
    mallContent.style.display = 'block';
    searchInput.placeholder = `Search for study spots in ${mallName}`;
    const allSpots = await getSpots();
    mallSpots = allSpots.filter(spot => spot.mallId === mallId);
    if (mallSpots.length === 0) {
      noSpotsEl.style.display = 'block';
      filtersSection.style.display = 'none';
      viewToolbar.style.display = 'none';
    } else {
      filtersSection.style.display = 'block';
      viewToolbar.style.display = 'flex';
      await renderFiltered();
      wireEvents();
      wireViewToolbar();
    }
  } catch (err) {
    container.textContent = 'Failed to load mall details.';
    console.error(err);
  } finally {
    loadingEl.style.display = 'none';
  }
}

init();
