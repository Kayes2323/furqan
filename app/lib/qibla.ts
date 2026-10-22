// ═══════════════════════════════════════════
// FURQAN — Qibla direction math (pure functions, no I/O)
// ═══════════════════════════════════════════

/**
 * Coordinates of the Kaaba (Masjid al-Haram), Mecca, Saudi Arabia.
 * This is the commonly published reference value used by Qibla
 * calculators (e.g. 21.4225° N, 39.8262° E).
 */
export const KAABA_LAT = 21.4225;
export const KAABA_LNG = 39.8262;

const EARTH_RADIUS_KM = 6371;

export interface Coordinates {
  lat: number;
  lng: number;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Initial great-circle bearing (forward azimuth) from `from` to the Kaaba,
 * in degrees clockwise from true north, normalized to [0, 360).
 *
 * Standard forward-azimuth formula:
 *   θ = atan2( sin(Δλ)·cos(φ2), cos(φ1)·sin(φ2) − sin(φ1)·cos(φ2)·cos(Δλ) )
 */
export function calculateQiblaBearing(from: Coordinates): number {
  const phi1 = toRad(from.lat);
  const phi2 = toRad(KAABA_LAT);
  const deltaLambda = toRad(KAABA_LNG - from.lng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);

  return (toDeg(theta) + 360) % 360;
}

/**
 * Great-circle distance from `from` to the Kaaba, in kilometers, via the
 * haversine formula.
 */
export function calculateDistanceToKaaba(from: Coordinates): number {
  const phi1 = toRad(from.lat);
  const phi2 = toRad(KAABA_LAT);
  const deltaPhi = toRad(KAABA_LAT - from.lat);
  const deltaLambda = toRad(KAABA_LNG - from.lng);

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Given the Qibla's absolute bearing (degrees from true north) and the
 * device's current absolute compass heading (degrees from true north),
 * returns how many degrees clockwise the on-screen needle/arrow should be
 * rotated so that it visually points at the Qibla once the dial's N marker
 * is drawn at a fixed "up" position.
 */
export function qiblaArrowRotation(qiblaBearingDeg: number, deviceHeadingDeg: number): number {
  return (qiblaBearingDeg - deviceHeadingDeg + 360) % 360;
}

/**
 * Formats a bearing (0-360) as a whole-degree string, e.g. "278°".
 */
export function formatBearing(bearingDeg: number): string {
  return `${Math.round(bearingDeg)}°`;
}

/**
 * Formats a distance in kilometers for display, e.g. "5224.1 কিমি" caller
 * supplies the unit label; this only rounds to one decimal place.
 */
export function formatDistanceKm(distanceKm: number): string {
  return distanceKm.toFixed(1);
}

export type CompassSource = 'ios-webkit' | 'absolute-alpha';

/**
 * Extracts a trustworthy true-north-relative compass heading (0-360,
 * clockwise from true north) from a DeviceOrientationEvent, or null if the
 * event does not carry a value we can trust as an absolute heading.
 *
 * We deliberately return null — never a guess — when:
 *   - iOS's `webkitCompassHeading` is absent, AND
 *   - the event is not flagged `absolute: true` (meaning `alpha` is only
 *     relative to the device's arbitrary starting orientation, not to
 *     Earth's frame — presenting that as a "compass heading" would be a
 *     fabricated reading).
 */
export function extractCompassHeading(event: {
  absolute?: boolean;
  alpha?: number | null;
  webkitCompassHeading?: number;
}): { heading: number; source: CompassSource } | null {
  if (typeof event.webkitCompassHeading === 'number' && !Number.isNaN(event.webkitCompassHeading)) {
    // iOS Safari: already true-north-relative, clockwise. No inversion needed.
    return { heading: event.webkitCompassHeading, source: 'ios-webkit' };
  }

  if (event.absolute === true && typeof event.alpha === 'number' && !Number.isNaN(event.alpha)) {
    // Standard (non-WebKit) devices: alpha increases counter-clockwise from
    // the device's initial reference, anchored to Earth's frame only when
    // `absolute` is true. Convert to clockwise-from-north.
    return { heading: (360 - event.alpha) % 360, source: 'absolute-alpha' };
  }

  return null;
}
