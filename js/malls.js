import { renderMallCards } from './cardRenderer.js';

const container = document.getElementById('cards-container');
const loadingEl = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const areaSelect = document.getElementById('filter-area');
const favoritesBtn = document.getElementById('favorites-btn');

let allMalls = [];

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
  
  await renderMallCards(filtered, container);
}

function wireEvents() {
  [searchInput, areaSelect].forEach((el) => {
    el.addEventListener('change', () => {
      renderFiltered().catch(err => console.error('Render error:', err));
    });
    el.addEventListener('input', () => {
      renderFiltered().catch(err => console.error('Render error:', err));
    });
  });
  
  if (favoritesBtn) {
    favoritesBtn.addEventListener('click', () => {
      window.location.href = 'favorites.html';
    });
  }
}

async function init() {
  try {
    loadingEl.style.display = 'block';
    allMalls = await getMalls();
    populateAreaOptions();
    await renderFiltered();
    wireEvents();
  } catch (err) {
    container.textContent = 'Failed to load malls.';
    console.error(err);
  } finally {
    loadingEl.style.display = 'none';
  }
}

init();
