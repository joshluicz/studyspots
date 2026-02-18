const STORAGE_KEY = 'studyspots_view_prefs';

export function getViewPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        columns: Math.min(3, Math.max(1, parseInt(p.columns, 10) || 3)),
        itemsPerPage: Math.min(60, Math.max(12, parseInt(p.itemsPerPage, 10) || 30))
      };
    }
  } catch (_) {}
  return { columns: 3, itemsPerPage: 30 };
}

export function setViewPreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (_) {}
}
