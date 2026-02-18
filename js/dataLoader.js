// Fetch spots JSON and expose a small API.
export async function getSpots() {
  const url = './data/spots.json';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load spots.json: ${res.status}`);
  }
  const data = await res.json();
  return data;
}
