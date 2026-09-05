/**
 * Demo surveyor proposed/actual paths along a few parcel borders only.
 * Built from live cadastral geometry when the mobile map dataset loads.
 */

export type SurveyorRouteArrow = {
  id: string;
  lon: number;
  lat: number;
  headingRad: number;
  timestamp: string;
  kind: "proposed" | "actual";
};

export type SurveyorDemoRoute = {
  id: string;
  label: string;
  proposed: [number, number][];
  actual: [number, number][];
  arrows: SurveyorRouteArrow[];
};

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;

function polygonRing(feature: GeoFeature): [number, number][] | null {
  const geom = feature.geometry;
  if (!geom) return null;
  if (geom.type === "Polygon") return geom.coordinates[0] as [number, number][];
  if (geom.type === "MultiPolygon") return geom.coordinates[0][0] as [number, number][];
  return null;
}

function closedRing(ring: [number, number][]): [number, number][] {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring.slice(0, -1);
  return ring.slice();
}

/** Mid-sided walk of the parcel boundary (not the full perimeter). */
function borderSegment(ring: [number, number][], startFrac: number, takeFrac: number): [number, number][] {
  const open = closedRing(ring);
  if (open.length < 4) return open;
  const start = Math.floor(open.length * startFrac) % open.length;
  const take = Math.max(4, Math.floor(open.length * takeFrac));
  const out: [number, number][] = [];
  for (let i = 0; i <= take; i += 1) {
    out.push(open[(start + i) % open.length]);
  }
  return out;
}

/** Subsample so demos stay visually light. */
function subsample(coords: [number, number][], maxPts: number): [number, number][] {
  if (coords.length <= maxPts) return coords;
  const step = (coords.length - 1) / (maxPts - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < maxPts; i += 1) {
    out.push(coords[Math.round(i * step)]);
  }
  return out;
}

function bearingRad(from: [number, number], to: [number, number]): number {
  const dLon = ((to[0] - from[0]) * Math.PI) / 180;
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  // OpenLayers RegularShape rotation: clockwise from up (north).
  return Math.atan2(y, x);
}

/**
 * Story-driven detour: surveyor follows proposed path at start/end, but mid-route
 * leaves for the main-road tea stall, roams there, then rejoins the border walk.
 */
function deviateActualPath(proposed: [number, number][], routeIndex: number): [number, number][] {
  const n = proposed.length;
  if (n < 4) return proposed;

  const wanderSign = routeIndex % 2 === 0 ? 1 : -1;
  const leaveAt = Math.max(1, Math.floor(n * 0.28));
  const returnAt = Math.min(n - 1, Math.floor(n * 0.72));

  const [leaveLon, leaveLat] = proposed[leaveAt];
  const [returnLon, returnLat] = proposed[returnAt];

  const prev = proposed[Math.max(0, leaveAt - 1)];
  const next = proposed[Math.min(n - 1, leaveAt + 1)];
  const pathDx = next[0] - prev[0];
  const pathDy = next[1] - prev[1];
  const pathLen = Math.hypot(pathDx, pathDy) || 1;
  const perpLon = (-pathDy / pathLen) * wanderSign;
  const perpLat = (pathDx / pathLen) * wanderSign;

  const detourScale = 0.0011 + routeIndex * 0.00018;
  const teaLon = leaveLon + perpLon * detourScale;
  const teaLat = leaveLat + perpLat * detourScale;

  const out: [number, number][] = [];
  for (let i = 0; i <= leaveAt; i += 1) {
    out.push(proposed[i]);
  }

  const detourLoop: [number, number][] = [
    [leaveLon + perpLon * detourScale * 0.25, leaveLat + perpLat * detourScale * 0.25],
    [leaveLon + perpLon * detourScale * 0.62, leaveLat + perpLat * detourScale * 0.62],
    [teaLon, teaLat],
    [teaLon + perpLon * 0.00045, teaLat - 0.00032 * wanderSign],
    [teaLon - perpLon * 0.00038, teaLat + 0.00028],
    [teaLon + perpLon * 0.00035, teaLat + 0.0004],
    [teaLon - perpLon * 0.00022, teaLat - 0.00018 * wanderSign],
    [returnLon + perpLon * detourScale * 0.55, returnLat + perpLat * detourScale * 0.55],
    [returnLon + perpLon * detourScale * 0.22, returnLat + perpLat * detourScale * 0.22],
  ];
  out.push(...detourLoop);

  for (let i = returnAt; i < n; i += 1) {
    out.push(proposed[i]);
  }

  return out;
}

function arrowTimestamps(count: number, startHour: number, startMin: number): string[] {
  const out: string[] = [];
  let h = startHour;
  let m = startMin;
  for (let i = 0; i < count; i += 1) {
    out.push(
      `2026-06-10 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );
    m += 3 + (i % 3);
    if (m >= 60) {
      h += 1;
      m -= 60;
    }
  }
  return out;
}

function arrowsAlong(
  routeId: string,
  kind: "proposed" | "actual",
  coords: [number, number][],
  timestamps: string[],
): SurveyorRouteArrow[] {
  if (coords.length < 2) return [];
  const arrows: SurveyorRouteArrow[] = [];
  const step = Math.max(1, Math.floor(coords.length / (timestamps.length + 1)));
  for (let i = 0; i < timestamps.length; i += 1) {
    const idx = Math.min(coords.length - 2, (i + 1) * step);
    const from = coords[idx];
    const to = coords[idx + 1] ?? coords[idx];
    arrows.push({
      id: `${routeId}-${kind}-a${i}`,
      lon: from[0],
      lat: from[1],
      headingRad: bearingRad(from, to),
      timestamp: timestamps[i],
      kind,
    });
  }
  return arrows;
}

/** Pick a few parcels with enough vertices and build proposed/actual border walks. */
export function buildDemoSurveyorRoutes(
  parcels: GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>,
): SurveyorDemoRoute[] {
  const candidates = parcels.features
    .map((f, index) => {
      const ring = polygonRing(f as GeoFeature);
      const n = ring ? closedRing(ring).length : 0;
      return { feature: f as GeoFeature, index, n, ring };
    })
    .filter((c) => c.ring && c.n >= 8)
    .sort((a, b) => b.n - a.n);

  // Prefer a spread of medium rings — avoid covering the whole map.
  const picked = [candidates[1], candidates[4], candidates[8]].filter(Boolean).slice(0, 3);
  if (picked.length === 0 && candidates[0]) picked.push(candidates[0]);

  const configs = [
    { startFrac: 0.08, takeFrac: 0.28, hour: 8, min: 42 },
    { startFrac: 0.35, takeFrac: 0.22, hour: 9, min: 15 },
    { startFrac: 0.55, takeFrac: 0.25, hour: 10, min: 5 },
  ];

  return picked.map((item, i) => {
    const cfg = configs[i] ?? configs[0];
    const surveyNo = String(item.feature.properties?.surveyNo ?? item.feature.properties?.id ?? `P${i + 1}`);
    const proposed = subsample(borderSegment(item.ring!, cfg.startFrac, cfg.takeFrac), 14);
    const actual = subsample(deviateActualPath(proposed, i), 22);
    const routeId = `srv-route-${i + 1}`;
    const tsProposed = arrowTimestamps(3, cfg.hour, cfg.min);
    const tsActual = arrowTimestamps(4, cfg.hour, cfg.min + 4);

    return {
      id: routeId,
      label: surveyNo,
      proposed,
      actual,
      arrows: [
        ...arrowsAlong(routeId, "proposed", proposed, tsProposed),
        ...arrowsAlong(routeId, "actual", actual, tsActual),
      ],
    };
  });
}
