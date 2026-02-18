// Fetch spots JSON and expose a small API.
export async function getSpots() {
  const url = new URL('../data/spots.json', import.meta.url).href;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load spots.json: ${res.status}`);
  }
  const data = await res.json();
  return data;
}
