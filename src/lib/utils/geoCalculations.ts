/**
 * Calculate Great Circle distance between two points [lon, lat] using Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistanceKm(p1: [number, number], p2: [number, number]): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
  const lat1 = (p1[1] * Math.PI) / 180;
  const lat2 = (p2[1] * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total path distance for a line coordinate array [[lon, lat], ...]
 */
export function calculateLineDistanceKm(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += calculateDistanceKm(
      coordinates[i] as [number, number],
      coordinates[i + 1] as [number, number]
    );
  }
  return total;
}

/**
 * Approximate spherical polygon area in square meters.
 */
export function calculatePolygonAreaSqM(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 3) return 0;
  const R = 6378137; // Earth's radius in meters
  let area = 0;
  const len = coordinates.length;

  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];
    const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * R * R) / 4.0;
  return area;
}

/**
 * Generate a GeoJSON Polygon circle approximating given center [lon, lat] and radius in km.
 */
export function createGeoJSONCircle(
  center: [number, number],
  radiusInKm: number,
  points = 64
): number[][] {
  const coords: number[][] = [];
  const distanceX =
    radiusInKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    coords.push([
      center[0] + distanceX * Math.cos(theta),
      center[1] + distanceY * Math.sin(theta),
    ]);
  }
  coords.push(coords[0]);
  return coords;
}

/**
 * Midpoint between two coordinates
 */
export function getMidpoint(
  pt1: [number, number],
  pt2: [number, number]
): [number, number] {
  return [(pt1[0] + pt2[0]) / 2, (pt1[1] + pt2[1]) / 2];
}

/**
 * Line segment intersection check
 */
export function getLineIntersection(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): [number, number] | null {
  const denom =
    (p4[1] - p3[1]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[1] - p1[1]);
  if (Math.abs(denom) < 1e-12) return null;

  const ua =
    ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) /
    denom;
  const ub =
    ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) /
    denom;

  const EPS = 1e-9;
  if (ua >= -EPS && ua <= 1 + EPS && ub >= -EPS && ub <= 1 + EPS) {
    const clampedUa = Math.max(0, Math.min(1, ua));
    return [
      p1[0] + clampedUa * (p2[0] - p1[0]),
      p1[1] + clampedUa * (p2[1] - p1[1]),
    ];
  }
  return null;
}

/**
 * Find all intersection points between two polylines
 */
export function findLineIntersections(
  line1: number[][],
  line2: number[][]
): [number, number][] {
  if (!line1 || !line2 || line1.length < 2 || line2.length < 2) return [];
  const results: [number, number][] = [];

  for (let i = 0; i < line1.length - 1; i++) {
    const p1 = line1[i] as [number, number];
    const p2 = line1[i + 1] as [number, number];

    for (let j = 0; j < line2.length - 1; j++) {
      const p3 = line2[j] as [number, number];
      const p4 = line2[j + 1] as [number, number];

      const pt = getLineIntersection(p1, p2, p3, p4);
      if (pt) {
        const rounded: [number, number] = [
          parseFloat(pt[0].toFixed(6)),
          parseFloat(pt[1].toFixed(6)),
        ];
        if (
          !results.some(
            (existing) =>
              Math.hypot(existing[0] - rounded[0], existing[1] - rounded[1]) < 1e-5
          )
        ) {
          results.push(rounded);
        }
      }
    }
  }

  return results;
}

/**
 * Find all self-intersection points within a single polyline
 */
export function findPolylineSelfIntersections(
  line: number[][]
): [number, number][] {
  if (!line || line.length < 4) return [];
  const results: [number, number][] = [];

  for (let i = 0; i < line.length - 1; i++) {
    const p1 = line[i] as [number, number];
    const p2 = line[i + 1] as [number, number];

    // Skip adjacent segments since they share a vertex
    for (let j = i + 2; j < line.length - 1; j++) {
      if (i === 0 && j === line.length - 2) continue;

      const p3 = line[j] as [number, number];
      const p4 = line[j + 1] as [number, number];

      const pt = getLineIntersection(p1, p2, p3, p4);
      if (pt) {
        const rounded: [number, number] = [
          parseFloat(pt[0].toFixed(6)),
          parseFloat(pt[1].toFixed(6)),
        ];
        if (
          !results.some(
            (existing) =>
              Math.hypot(existing[0] - rounded[0], existing[1] - rounded[1]) < 1e-5
          )
        ) {
          results.push(rounded);
        }
      }
    }
  }

  return results;
}

