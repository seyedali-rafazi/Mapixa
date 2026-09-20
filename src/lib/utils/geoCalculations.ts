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
  if (denom === 0) return null;

  const ua =
    ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) /
    denom;
  const ub =
    ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) /
    denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return [p1[0] + ua * (p2[0] - p1[0]), p1[1] + ua * (p2[1] - p1[1])];
  }
  return null;
}
