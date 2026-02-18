import { getSpots } from './dataLoader.js';
import { renderCards } from './cardRenderer.js';

const container = document.getElementById('cards-container');
const loadingEl = document.getElementById('loading');
const emptyEl = document.getElementById('empty-message');

async function init() {
  try {
    loadingEl.style.display = 'block';
    
    // Get all spots
    const allSpots = await getSpots();
    
    // Get favorite IDs from localStorage
    const favoriteIds = JSON.parse(localStorage.getItem('studyspots_favorites') || '[]');
    
    // Filter to only show favorites
    const favorites = allSpots.filter(spot => favoriteIds.includes(spot.id));
    
    if (favorites.length === 0) {
      emptyEl.style.display = 'block';
      loadingEl.style.display = 'none';
      return;
    }
    
    // Render the favorite spots
    await renderCards(favorites, container);
    
  } catch (err) {
    container.textContent = 'Failed to load favorites.';
    console.error(err);
  } finally {
    loadingEl.style.display = 'none';
  }
}

init();
