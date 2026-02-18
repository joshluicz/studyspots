// Renders cards into a container. Creates DOM nodes (no innerHTML for full card).
// Also loads malls data if needed for displaying mall information
export async function getMallsData() {
  try {
    const url = './data/malls.json';
    const res = await fetch(url);
    if (!res.ok) return {};
    const malls = await res.json();
    const mallMap = {};
    malls.forEach(m => {
      mallMap[m.id] = m;
    });
    return mallMap;
  } catch (err) {
    console.error('Failed to load malls:', err);
    return {};
  }
}

export async function renderCards(spotsArray, containerElement, onFavToggle) {
  // Clear existing
  while (containerElement.firstChild) containerElement.removeChild(containerElement.firstChild);

  // Load favorites from localStorage
  const favorites = JSON.parse(localStorage.getItem('studyspots_favorites') || '[]');
  
  // Load malls data
  let mallsMap = {};
  try {
    mallsMap = await getMallsData();
  } catch (err) {
    console.error('Error loading malls data:', err);
  }

  spotsArray.forEach((spot) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('role', 'listitem');

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-image';
    const img = document.createElement('img');
    img.alt = `${spot.name} photo`;
    img.src = spot.image || 'https://via.placeholder.com/400x300?text=Placeholder';
    img.loading = 'lazy';
    imgWrap.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h3');
    title.textContent = spot.name;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    let metaText = `${spot.area}`;
    if (spot.mallId && mallsMap[spot.mallId]) {
      metaText += ` • ${mallsMap[spot.mallId].name}`;
    }
    meta.textContent = metaText;

    const features = document.createElement('div');
    features.className = 'card-features';

    const noise = document.createElement('span');
    noise.className = `feature-badge noise-${spot.noiseLevel}`;
    const noiseLabels = { quiet: '🔇 Quiet', medium: '☕ Medium', noisy: '🎉 Noisy' };
    noise.textContent = noiseLabels[spot.noiseLevel] || spot.noiseLevel;

    const charging = document.createElement('span');
    charging.className = 'feature-badge charging';
    const chargingLabels = { none: '🔌 None', limited: '🔌 Limited', abundant: '🔌 Abundant' };
    charging.textContent = chargingLabels[spot.chargingPorts] || spot.chargingPorts;

    const wifi = document.createElement('span');
    wifi.className = 'feature-badge wifi';
    wifi.textContent = spot.wifi === 'yes' ? '📶 Wi-Fi' : '📶 No Wi-Fi';

    features.appendChild(noise);
    features.appendChild(charging);
    features.appendChild(wifi);

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = spot.description || '';

    // Favorites button
    const favBtn = document.createElement('button');
    favBtn.className = 'card-fav-btn';
    const isFav = favorites.includes(spot.id);
    favBtn.textContent = isFav ? '❤️' : '🤍';
    favBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
    
    favBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentFavs = JSON.parse(localStorage.getItem('studyspots_favorites') || '[]');
      const idx = currentFavs.indexOf(spot.id);
      
      if (idx > -1) {
        currentFavs.splice(idx, 1);
        favBtn.textContent = '🤍';
        favBtn.setAttribute('aria-label', 'Add to favorites');
      } else {
        currentFavs.push(spot.id);
        favBtn.textContent = '❤️';
        favBtn.setAttribute('aria-label', 'Remove from favorites');
      }
      
      localStorage.setItem('studyspots_favorites', JSON.stringify(currentFavs));
      if (onFavToggle) onFavToggle();
    });

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(features);
    body.appendChild(desc);
    body.appendChild(favBtn);

    card.appendChild(imgWrap);
    card.appendChild(body);

    containerElement.appendChild(card);
  });
}

export async function renderMallCards(mallsArray, containerElement) {
  // Clear existing
  while (containerElement.firstChild) containerElement.removeChild(containerElement.firstChild);

  mallsArray.forEach((mall) => {
    const card = document.createElement('article');
    card.className = 'card card-mall';
    card.setAttribute('role', 'listitem');
    card.style.cursor = 'pointer';
    
    card.addEventListener('click', () => {
      window.location.href = `mall_template.html?id=${mall.id}`;
    });

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-image';
    const img = document.createElement('img');
    img.alt = `${mall.name} photo`;
    img.src = mall.image || 'https://via.placeholder.com/400x300?text=Mall';
    img.loading = 'lazy';
    imgWrap.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h3');
    title.textContent = mall.name;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.textContent = mall.area;

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = mall.description || '';

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(desc);
    card.appendChild(imgWrap);
    card.appendChild(body);

    containerElement.appendChild(card);
  });
}
