export type LatLng = { lat: number; lng: number };

const WALK_SPEED_MPS = 1.35;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const r = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatWalkEta(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / WALK_SPEED_MPS / 60));
  if (minutes < 60) return `${minutes} min walk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** Demo survey block around Karaikal Green Belt — reject far-away start points. */
export const SURVEY_NAV_RADIUS_M = 1800;

export function isWithinSurveyArea(point: LatLng, origin: LatLng, radiusM = SURVEY_NAV_RADIUS_M): boolean {
  return haversineMeters(point, origin) <= radiusM;
}

export function defaultSurveyPin(origin: LatLng = { lat: 10.9254, lng: 79.8372 }): LatLng {
  return {
    lat: origin.lat + 0.0009,
    lng: origin.lng - 0.0007,
  };
}

export function nearbyTreesByDistance(
  from: LatLng,
  trees: Array<{ lat: number; lng: number } & Record<string, unknown>>,
  limit = 8,
) {
  return [...trees]
    .map((tree) => ({
      tree,
      distanceM: haversineMeters(from, { lat: tree.lat, lng: tree.lng }),
    }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}

function densifySegment(a: LatLng, b: LatLng, stepMeters = 14): LatLng[] {
  const dist = haversineMeters(a, b);
  const steps = Math.max(1, Math.ceil(dist / stepMeters));
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    pts.push({
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    });
  }
  return pts;
}

function densifyPath(points: LatLng[], stepMeters = 14): LatLng[] {
  if (points.length < 2) return points.slice();
  const out: LatLng[] = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const seg = densifySegment(points[i - 1], points[i], stepMeters);
    out.push(...seg.slice(1));
  }
  return out;
}

function dedupeNear(points: LatLng[], minGapM = 0.5): LatLng[] {
  const out: LatLng[] = [];
  for (const point of points) {
    if (!out.length || haversineMeters(out[out.length - 1], point) > minGapM) {
      out.push(point);
    }
  }
  return out;
}

/** Street-style fallback when online routing is unavailable (axis-aligned legs, dense points). */
export function fallbackRoute(from: LatLng, to: LatLng): LatLng[] {
  const dLat = Math.abs(to.lat - from.lat);
  const dLng = Math.abs(to.lng - from.lng);
  // Prefer two elbows so off-road destinations still get a clear final approach.
  const midA: LatLng = { lat: from.lat, lng: (from.lng + to.lng) / 2 };
  const midB: LatLng = { lat: to.lat, lng: (from.lng + to.lng) / 2 };
  const corner: LatLng =
    dLng >= dLat ? { lat: from.lat, lng: to.lng } : { lat: to.lat, lng: from.lng };

  // Short hops: simple L. Longer hops: shallow U so the last leg aims at the pin.
  const straight = haversineMeters(from, to);
  const spine =
    straight < 120
      ? [from, corner, to]
      : [from, midA, midB, to];

  return densifyPath(spine);
}

export type WalkingRoute = {
  coords: LatLng[];
  distanceM: number;
  durationS: number;
};

function pathLengthMeters(coords: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i += 1) {
    total += haversineMeters(coords[i - 1], coords[i]);
  }
  return total;
}

/**
 * Always start at blue `from` and finish exactly at black `to`.
 * Keeps road geometry in the middle; adds short stubs for off-road pins.
 */
function closeRouteEndpoints(from: LatLng, to: LatLng, mid: LatLng[]): LatLng[] {
  const road = dedupeNear(mid);
  if (road.length < 2) return fallbackRoute(from, to);

  const joined: LatLng[] = [];

  if (haversineMeters(from, road[0]) > 1) {
    joined.push(...densifySegment(from, road[0]));
    joined.push(...road.slice(1));
  } else {
    joined.push(from, ...road.slice(1));
  }

  const last = joined[joined.length - 1];
  if (haversineMeters(last, to) > 1) {
    joined.push(...densifySegment(last, to).slice(1));
  }

  // Hard guarantee — never leave a path hanging mid-road.
  const closed = densifyPath(dedupeNear(joined));
  if (closed.length < 2) return fallbackRoute(from, to);
  closed[0] = from;
  closed[closed.length - 1] = to;
  return closed;
}

function toWalkingRoute(from: LatLng, to: LatLng, mid: LatLng[]): WalkingRoute {
  const coords = closeRouteEndpoints(from, to, mid);
  const distanceM = pathLengthMeters(coords);
  return {
    coords,
    distanceM,
    durationS: distanceM / WALK_SPEED_MPS,
  };
}

async function fetchOsrmPolyline(
  from: LatLng,
  to: LatLng,
  profile: "foot" | "driving",
  radiusM: number,
): Promise<LatLng[] | null> {
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson&steps=false&annotations=false` +
    `&radiuses=${radiusM};${radiusM}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: { coordinates?: number[][] };
      }>;
    };
    const route = data.routes?.[0];
    const line = route?.geometry?.coordinates;
    if (data.code !== "Ok" || !route || !line || line.length < 2) return null;
    if (route.distance >= 6000) return null;

    const mid = line.map(([lng, lat]) => ({ lat, lng }));
    const endGap = haversineMeters(mid[mid.length - 1], to);
    const startGap = haversineMeters(mid[0], from);
    // Allow larger snap gaps — we always stitch stubs to the real pins.
    if (endGap > 320 || startGap > 320) return null;
    return mid;
  } catch {
    return null;
  }
}

/** Foot route along real OSM roads (OSRM). Always ends at the destination point. */
export async function fetchWalkingRoute(from: LatLng, to: LatLng): Promise<WalkingRoute> {
  const straight = haversineMeters(from, to);

  if (straight < 2) {
    return {
      coords: [from, to],
      distanceM: straight,
      durationS: Math.max(1, straight / WALK_SPEED_MPS),
    };
  }

  if (straight > SURVEY_NAV_RADIUS_M * 1.5) {
    return toWalkingRoute(from, to, fallbackRoute(from, to));
  }

  // Snap off-road trees/pins onto nearby carriageway; try generous radiuses.
  for (const profile of ["foot", "driving"] as const) {
    for (const radiusM of [120, 250]) {
      const mid = await fetchOsrmPolyline(from, to, profile, radiusM);
      if (!mid) continue;
      return toWalkingRoute(from, to, mid);
    }
  }

  return toWalkingRoute(from, to, fallbackRoute(from, to));
}

export function pointAlongRoute(coords: LatLng[], fraction: number): LatLng {
  if (coords.length === 0) return { lat: 0, lng: 0 };
  if (coords.length === 1 || fraction <= 0) return coords[0];
  if (fraction >= 1) return coords[coords.length - 1];

  const segments: number[] = [];
  let total = 0;
  for (let i = 1; i < coords.length; i += 1) {
    const d = haversineMeters(coords[i - 1], coords[i]);
    segments.push(d);
    total += d;
  }
  if (total <= 0) return coords[coords.length - 1];

  let remaining = total * fraction;
  for (let i = 0; i < segments.length; i += 1) {
    if (remaining <= segments[i]) {
      const t = segments[i] === 0 ? 1 : remaining / segments[i];
      return {
        lat: coords[i].lat + (coords[i + 1].lat - coords[i].lat) * t,
        lng: coords[i].lng + (coords[i + 1].lng - coords[i].lng) * t,
      };
    }
    remaining -= segments[i];
  }
  return coords[coords.length - 1];
}
