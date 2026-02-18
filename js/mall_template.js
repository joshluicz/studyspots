import { getSpots } from './dataLoader.js';
import { renderCards } from './cardRenderer.js';

const container = document.getElementById('cards-container');
const loadingEl = document.getElementById('loading');
const mallContent = document.getElementById('mall-content');
const mallTitle = document.getElementById('mall-title');
const mallDescription = document.getElementById('mall-description');
const noSpotsEl = document.getElementById('no-spots');

// Get malls JSON
async function getMalls() {
  const url = './data/malls.json';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load malls.json: ${res.status}`);
  }
  const data = await res.json();
  const mallMap = {};
  data.forEach(m => {
    mallMap[m.id] = m;
  });
  return mallMap;
}

async function init() {
  try {
    // Get mall ID from URL parameters
    const params = new URLSearchParams(window.location.search);
    const mallId = params.get('id');
    
    if (!mallId) {
      container.textContent = 'Invalid mall ID.';
      loadingEl.style.display = 'none';
      return;
    }
    
    loadingEl.style.display = 'block';
    
    // Load malls data
    const mallsMap = await getMalls();
    const mall = mallsMap[mallId];
    
    if (!mall) {
      container.textContent = 'Mall not found.';
      loadingEl.style.display = 'none';
      return;
    }
    
    // Display mall information
    mallTitle.textContent = mall.name;
    mallDescription.textContent = mall.description;
    mallContent.style.display = 'block';
    
    // Load all spots
    const allSpots = await getSpots();
    
    // Filter spots that belong to this mall
    const mallSpots = allSpots.filter(spot => spot.mallId === mallId);
    
    if (mallSpots.length === 0) {
      noSpotsEl.style.display = 'block';
      loadingEl.style.display = 'none';
      return;
    }
    
    // Render the spots
    await renderCards(mallSpots, container);
    
  } catch (err) {
    container.textContent = 'Failed to load mall details.';
    console.error(err);
  } finally {
    loadingEl.style.display = 'none';
  }
}

init();
