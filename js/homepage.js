import { getSpots } from './dataLoader.js';
import { renderCards } from './cardRenderer.js';
import { applyFilters } from './filters.js';
import { Paginator } from './pagination.js';

const container = document.getElementById('cards-container');
const loadingEl = document.getElementById('loading');
const pageInfoEl = document.getElementById('page-info');
const paginationEl = document.getElementById('pagination');

const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('filter-category');
const areaSelect = document.getElementById('filter-area');
const noiseSelect = document.getElementById('filter-noise');

let allSpots = [];
let paginator = null;

function populateAreaOptions() {
  const areas = [...new Set(allSpots.map(s => s.area))].sort();
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
    category: categorySelect.value,
    area: areaSelect.value,
    noise: noiseSelect.value,
    search: searchInput.value
  };
}

function updatePaginationUI() {
  if (!paginator) return;
  
  const total = paginator.getTotalPages();
  const current = paginator.currentPage;
  
  if (pageInfoEl) {
    pageInfoEl.textContent = `Page ${current} of ${total}`;
  }
  
  if (paginationEl) {
    paginationEl.innerHTML = '';
    
    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = current === 1;
    prevBtn.addEventListener('click', () => {
      paginator.prevPage();
      renderFiltered();
    });
    paginationEl.appendChild(prevBtn);
    
    // Page buttons
    for (let i = 1; i <= total; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === current ? 'active' : '';
      pageBtn.addEventListener('click', () => {
        paginator.goToPage(i);
        renderFiltered();
      });
      paginationEl.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = current === total;
    nextBtn.addEventListener('click', () => {
      paginator.nextPage();
      renderFiltered();
    });
    paginationEl.appendChild(nextBtn);
  }
}

function renderFiltered() {
  const state = getFilterState();
  let filtered = applyFilters(allSpots, state);
  
  paginator = new Paginator(filtered, 30);
  const pageItems = paginator.getCurrentPageItems();
  
  renderCards(pageItems, container);
  updatePaginationUI();
}

function wireEvents() {
  [searchInput, categorySelect, areaSelect, noiseSelect].forEach((el) => {
    el.addEventListener('change', () => {
      if (paginator) paginator.reset();
      renderFiltered();
    });
    el.addEventListener('input', () => {
      if (paginator) paginator.reset();
      renderFiltered();
    });
  });
}

async function init() {
  try {
    loadingEl.style.display = 'block';
    allSpots = await getSpots();
    populateAreaOptions();
    renderFiltered();
    wireEvents();
  } catch (err) {
    container.textContent = 'Failed to load spots.';
    console.error(err);
  } finally {
    loadingEl.style.display = 'none';
  }
}

init();
