import { getSpots } from './dataLoader.js';
import { renderCards } from './cardRenderer.js';
import { applyFilters } from './filters.js';
import { Paginator } from './pagination.js';
import { initCustomSelect } from './customSelect.js';
import { getViewPreferences, setViewPreferences } from './viewPreferences.js';

const container = document.getElementById('cards-container');
const loadingEl = document.getElementById('loading');
const pageInfoEl = document.getElementById('page-info');
const paginationEl = document.getElementById('pagination');

const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('filter-category');
const areaSelect = document.getElementById('filter-area');
const noiseSelect = document.getElementById('filter-noise');
const wifiSelect = document.getElementById('filter-wifi');
const chargingSelect = document.getElementById('filter-charging');
const favoritesBtn = document.getElementById('favorites-btn');
const toggleMoreBtn = document.getElementById('toggle-more-filters');
const filtersExtra = document.getElementById('filters-extra');

let allSpots = [];
let paginator = null;

let areaCustomSelect = null;

function populateAreaOptions() {
  const areas = [...new Set(allSpots.map(s => s.area))].sort();
  areaSelect.innerHTML = '<option value="any">All Areas</option>';
  areas.forEach(area => {
    const opt = document.createElement('option');
    opt.value = area;
    opt.textContent = area;
    areaSelect.appendChild(opt);
  });
  if (areaCustomSelect?.refresh) areaCustomSelect.refresh();
}

function getFilterState() {
  return {
    category: categorySelect.value,
    area: areaSelect.value,
    noise: noiseSelect.value,
    wifi: wifiSelect.value,
    charging: chargingSelect.value,
    search: searchInput.value
  };
}

function updatePaginationUI() {
  if (!paginator) return;
  
  const total = paginator.getTotalPages();
  const current = paginator.currentPage;
  
  if (pageInfoEl) {
    pageInfoEl.textContent = total > 0 ? `Page ${current} of ${total}` : '';
  }
  
  if (paginationEl) {
    paginationEl.innerHTML = '';
    if (total <= 0) return;
    
    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = current === 1;
    prevBtn.addEventListener('click', () => {
      paginator.prevPage();
      renderFiltered().catch(err => console.error('Render error:', err));
    });
    paginationEl.appendChild(prevBtn);
    
    // Page buttons
    for (let i = 1; i <= total; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === current ? 'active' : '';
      pageBtn.addEventListener('click', () => {
        paginator.goToPage(i);
        renderFiltered().catch(err => console.error('Render error:', err));
      });
      paginationEl.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = current === total;
    nextBtn.addEventListener('click', () => {
      paginator.nextPage();
      renderFiltered().catch(err => console.error('Render error:', err));
    });
    paginationEl.appendChild(nextBtn);
  }
}

async function renderFiltered() {
  try {
    const state = getFilterState();
    let filtered = applyFilters(allSpots, state);
    const prefs = getViewPreferences();
    paginator = new Paginator(filtered, prefs.itemsPerPage);
    const pageItems = paginator.getCurrentPageItems();
    
    await renderCards(pageItems, container);
    updatePaginationUI();
    applyColumnClass();
  } catch (err) {
    console.error('Error in renderFiltered:', err);
    container.textContent = 'Failed to render spots.';
    throw err;
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
      btns.forEach((b) => b.setAttribute('aria-pressed', parseInt(b.dataset.cols, 10) === cols ? 'true' : 'false'));
      applyColumnClass();
    });
  });
}

function wireEvents() {
  [searchInput, categorySelect, areaSelect, noiseSelect, wifiSelect, chargingSelect].forEach((el) => {
    el.addEventListener('change', () => {
      if (paginator) paginator.reset();
      renderFiltered().catch(err => console.error('Render error:', err));
    });
    el.addEventListener('input', () => {
      if (paginator) paginator.reset();
      renderFiltered().catch(err => console.error('Render error:', err));
    });
  });
  
  if (favoritesBtn) {
    favoritesBtn.addEventListener('click', () => {
      window.location.href = 'favorites.html';
    });
  }

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
    loadingEl.style.display = 'block';
    allSpots = await getSpots();
    areaCustomSelect = initCustomSelect(areaSelect);
    populateAreaOptions();
    await renderFiltered();
    wireEvents();
    wireViewToolbar();
  } catch (err) {
    container.textContent = 'Failed to load spots.';
    console.error(err);
  } finally {
    loadingEl.style.display = 'none';
  }
}

init();
