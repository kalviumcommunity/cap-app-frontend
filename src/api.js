// sessionStorage = one login per browser tab, so you can test rider + driver side by side.
export const getToken = () => sessionStorage.getItem('token');

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const fmt = (n) => `₹${Number(n).toFixed(0)}`;

export function distKm(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const x = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

// Free OpenStreetMap services (fine for development; use a paid/self-hosted one in production)
export async function reverseGeocode(p) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}`);
    return ((await r.json()).display_name || '').split(',').slice(0, 3).join(',').trim();
  } catch {
    return '';
  }
}

export async function getRoute(a, b) {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`);
    const j = await r.json();
    return j.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch {
    return [[a.lat, a.lng], [b.lat, b.lng]];
  }
}
