import { renderMallCards } from './cardRenderer.js';
import { Paginator } from './pagination.js';
import { initCustomSelect } from './customSelect.js';
import { getViewPreferences, setViewPreferences } from './viewPreferences.js';

const container = document.getElementById('cards-container');
const loadingEl = document.getElementById('loading');
const pageInfoEl = document.getElementById('page-info');
const paginationEl = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const areaSelect = document.getElementById('filter-area');
const favoritesBtn = document.getElementById('favorites-btn');

let allMalls = [];
let paginator = null;
let areaCustomSelect = null;

// Fetch malls JSON
async function getMalls() {
  const url = './data/malls.json';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load malls.json: ${res.status}`);
  }
  const data = await res.json();
  return data;
}

function populateAreaOptions() {
  const areas = [...new Set(allMalls.map(m => m.area))].sort();
  areaSelect.innerHTML = '<option value="any">All Areas</option>';
  areas.forEach(area => {
    const opt = document.createElement('option');
    opt.value = area;
    opt.textContent = area;
    areaSelect.appendChild(opt);
  });
  if (areaCustomSelect?.refresh) areaCustomSelect.refresh();
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

function getFilterState() {
  return {
    area: areaSelect.value,
    search: searchInput.value
  };
}

function applyMallFilters(malls, filterState) {
  return malls.filter((m) => {
    // area
    if (filterState.area && filterState.area !== 'any') {
      if (m.area !== filterState.area) return false;
    }

    // search term (case-insensitive, searches name and description)
    if (filterState.search && filterState.search.trim()) {
      const query = filterState.search.toLowerCase();
      const nameMatch = (m.name || '').toLowerCase().includes(query);
      const descMatch = (m.description || '').toLowerCase().includes(query);
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });
}

async function renderFiltered() {
  const state = getFilterState();
  let filtered = applyMallFilters(allMalls, state);
  const prefs = getViewPreferences();
  paginator = new Paginator(filtered, prefs.itemsPerPage);
  const pageItems = paginator.getCurrentPageItems();
  await renderMallCards(pageItems, container);
  updatePaginationUI();
  applyColumnClass();
}

function wireEvents() {
  [searchInput, areaSelect].forEach((el) => {
    el.addEventListener('change', () => {
      if (paginator) paginator.reset();
      renderFiltered().catch(err => console.error('Render error:', err));
    });
    el.addEventListener('input', () => {
      if (paginator) paginator.reset();
      renderFiltered().catch(err => console.error('Render error:', err));
    });
  });
  if (favoritesBtn) favoritesBtn.addEventListener('click', () => { window.location.href = 'favorites.html'; });
}

async function init() {
  try {
    loadingEl.style.display = 'block';
    allMalls = await getMalls();
    areaCustomSelect = initCustomSelect(areaSelect);
    populateAreaOptions();
    await renderFiltered();
    wireEvents();
    wireViewToolbar();
  } catch (err) {
    container.textContent = 'Failed to load malls.';
    console.error(err);
  } finally {
    loadingEl.style.display = 'none';
  }
}

init();
