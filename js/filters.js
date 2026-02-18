// applyFilters(spots, filterState) -> filtered spots array
export function applyFilters(spots, filterState) {
  return spots.filter((s) => {
    // category (if provided)
    if (filterState.category && filterState.category !== 'any') {
      if (s.category !== filterState.category) return false;
    }

    // area
    if (filterState.area && filterState.area !== 'any') {
      if (s.area !== filterState.area) return false;
    }

    // noise level
    if (filterState.noise && filterState.noise !== 'any') {
      if (s.noiseLevel !== filterState.noise) return false;
    }

    // charging ports
    if (filterState.charging && filterState.charging !== 'any') {
      if (s.chargingPorts !== filterState.charging) return false;
    }

    // wifi
    if (filterState.wifi && filterState.wifi !== 'any') {
      if (s.wifi !== filterState.wifi) return false;
    }

    // search term (case-insensitive, searches name and description)
    if (filterState.search && filterState.search.trim()) {
      const query = filterState.search.toLowerCase();
      const nameMatch = (s.name || '').toLowerCase().includes(query);
      const descMatch = (s.description || '').toLowerCase().includes(query);
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });
}
