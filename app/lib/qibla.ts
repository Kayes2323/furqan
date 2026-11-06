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
 * Wraps any angle into [0, 360). Values already in range are returned
 * untouched rather than pushed through a modulo round-trip, which would
 * introduce floating-point drift (e.g. 123.4 → 123.40000000000003).
 */
function normalizeDeg(deg: number): number {
  if (deg >= 0 && deg < 360) return deg;
  return ((deg % 360) + 360) % 360;
}

/**
 * Signed smallest angular difference `to - from`, in (-180, 180]. Positive
 * means `to` lies clockwise of `from`.
 */
export function smallestAngleDifference(from: number, to: number): number {
  let diff = (to - from) % 360;
  if (diff > 180) diff -= 360;
  if (diff <= -180) diff += 360;
  return diff;
}

/**
 * Rewrites `targetDeg` into whichever revolution sits nearest `renderedDeg`,
 * so a CSS transform animating from `renderedDeg` to the result takes the
 * short way round. Without this the dial unwinds a near-full circle every
 * time the heading crosses north (359° → 1° animates as −358°, not +2°).
 *
 * Idempotent: feeding the result back in returns it unchanged.
 */
export function continuousRotation(renderedDeg: number, targetDeg: number): number {
  return renderedDeg + smallestAngleDifference(renderedDeg, targetDeg);
}

/**
 * Circular exponential smoothing — nudges `previous` toward `next` by
 * `factor` along the shorter arc so magnetometer jitter doesn't make the
 * dial twitch, while a real turn still tracks promptly. Returns [0, 360).
 */
export function smoothHeading(previous: number | null, next: number, factor = 0.25): number {
  const normalizedNext = normalizeDeg(next);
  if (previous == null) return normalizedNext;
  return normalizeDeg(previous + smallestAngleDifference(previous, normalizedNext) * factor);
}

/** How close to dead-on counts as "you are facing the Qibla". */
export const QIBLA_ALIGNMENT_TOLERANCE_DEG = 5;

/**
 * True when the Qibla sits within `toleranceDeg` of where the device's top
 * edge points — i.e. the user is facing it. Takes the on-screen Qibla angle
 * produced by `qiblaArrowRotation`, where 0 means "straight ahead".
 */
export function isFacingQibla(
  qiblaScreenAngleDeg: number,
  toleranceDeg: number = QIBLA_ALIGNMENT_TOLERANCE_DEG,
): boolean {
  return Math.abs(smallestAngleDifference(0, qiblaScreenAngleDeg)) <= toleranceDeg;
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
 *   - the reading is not earth-anchored, i.e. neither flagged
 *     `absolute: true` nor delivered on `deviceorientationabsolute`. A bare
 *     relative `alpha` is measured from the device's arbitrary starting
 *     orientation, so presenting it as a compass heading would be a
 *     fabricated reading.
 */
export function extractCompassHeading(
  event: {
    absolute?: boolean;
    alpha?: number | null;
    webkitCompassHeading?: number;
  },
  /**
   * True when the event was delivered on `deviceorientationabsolute`, which
   * is earth-anchored by definition of the event type. Several Chrome/Android
   * builds deliver usable earth-referenced `alpha` there while leaving the
   * `absolute` flag false — refusing those readings left those devices with
   * no live compass at all, so the event name is treated as its own proof.
   */
  fromAbsoluteEvent = false,
): { heading: number; source: CompassSource } | null {
  if (typeof event.webkitCompassHeading === 'number' && !Number.isNaN(event.webkitCompassHeading)) {
    // iOS Safari hands back a ready-made compass heading, clockwise. Apple
    // documents it against magnetic north, so the UI keeps its magnetic
    // caveat for this source too rather than claiming true north.
    return { heading: event.webkitCompassHeading, source: 'ios-webkit' };
  }

  const earthAnchored = event.absolute === true || fromAbsoluteEvent;
  if (earthAnchored && typeof event.alpha === 'number' && !Number.isNaN(event.alpha)) {
    // Standard (non-WebKit) devices: alpha increases counter-clockwise from
    // the device's initial reference, anchored to Earth's frame only when
    // `absolute` is true. Convert to clockwise-from-north.
    return { heading: (360 - event.alpha) % 360, source: 'absolute-alpha' };
  }

  return null;
}
