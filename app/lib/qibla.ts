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

export interface OrientationAngles {
  /** Rotation about the screen-normal axis, degrees. */
  alpha: number;
  /** Front-to-back tilt, degrees. 0 = flat on its back, 90 = held upright. */
  beta: number;
  /** Left-to-right tilt, degrees. */
  gamma: number;
  /** `screen.orientation.angle` — 0 in portrait, 90/270 in landscape. */
  screenAngle?: number;
}

/**
 * Compass heading (degrees clockwise from north) for the direction the user
 * is facing, derived from the full device orientation rather than `alpha`
 * alone.
 *
 * Why the full matrix: `360 - alpha` is only the heading while the phone lies
 * flat on its back. The moment it is tilted up — which is how anyone actually
 * holds a phone to look at it — `alpha` stops describing where the device
 * points, and at 90° (upright) it carries no horizontal information at all.
 * That is why the dial read plausibly on a table and nonsensically in the
 * hand.
 *
 * The device-to-earth rotation is built from the spec's intrinsic Z-X'-Y''
 * order, with the earth frame X = east, Y = north, Z = up. Two candidate
 * "forward" directions are projected onto the horizon:
 *
 *   - the top edge of the screen, which is forward when the phone is flat
 *     (and which, flat, reduces to exactly `360 - alpha`);
 *   - the back of the phone, which is forward when it is held upright.
 *
 * Whichever projects more strongly onto the horizon wins, so the reading
 * stays stable at every tilt between the two instead of collapsing in the
 * middle. Returns null only when the device is edge-on, where no horizontal
 * direction exists and any number would be invented.
 */
export function headingFromOrientation({
  alpha,
  beta,
  gamma,
  screenAngle = 0,
}: OrientationAngles): number | null {
  const rad = Math.PI / 180;
  const a = alpha * rad;
  const b = beta * rad;
  const g = gamma * rad;
  const s = screenAngle * rad;

  const cA = Math.cos(a), sA = Math.sin(a);
  const cB = Math.cos(b), sB = Math.sin(b);
  const cG = Math.cos(g), sG = Math.sin(g);

  // Columns of R = Rz(alpha)·Rx(beta)·Ry(gamma), device axes in earth frame.
  const r00 = cA * cG - sA * sB * sG;
  const r01 = -sA * cB;
  const r02 = cA * sG + sA * sB * cG;
  const r10 = sA * cG + cA * sB * sG;
  const r11 = cA * cB;
  const r12 = sA * sG - cA * sB * cG;

  // "Up the screen" in device coordinates, rotated by the screen's own
  // orientation so landscape does not read 90° off.
  const ux = Math.sin(s);
  const uy = Math.cos(s);
  const upEast = r00 * ux + r01 * uy;
  const upNorth = r10 * ux + r11 * uy;

  // Out of the back of the phone — the way you look when holding it upright.
  const backEast = -r02;
  const backNorth = -r12;

  const upMag = Math.hypot(upEast, upNorth);
  const backMag = Math.hypot(backEast, backNorth);

  const east = upMag >= backMag ? upEast : backEast;
  const north = upMag >= backMag ? upNorth : backNorth;

  if (Math.hypot(east, north) < 1e-9) return null;

  return normalizeDeg(Math.atan2(east, north) / rad);
}

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
    beta?: number | null;
    gamma?: number | null;
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
  screenAngle = 0,
): { heading: number; source: CompassSource } | null {
  if (typeof event.webkitCompassHeading === 'number' && !Number.isNaN(event.webkitCompassHeading)) {
    // iOS Safari hands back a ready-made compass heading, clockwise. Apple
    // documents it against magnetic north, so the UI keeps its magnetic
    // caveat for this source too rather than claiming true north.
    return { heading: event.webkitCompassHeading, source: 'ios-webkit' };
  }

  const earthAnchored = event.absolute === true || fromAbsoluteEvent;
  if (earthAnchored && typeof event.alpha === 'number' && !Number.isNaN(event.alpha)) {
    // Standard (non-WebKit) devices: alpha/beta/gamma describe the device's
    // full attitude in Earth's frame. Tilt has to be taken into account —
    // see headingFromOrientation for why alpha alone is not a heading.
    const heading = headingFromOrientation({
      alpha: event.alpha,
      beta: typeof event.beta === 'number' && !Number.isNaN(event.beta) ? event.beta : 0,
      gamma: typeof event.gamma === 'number' && !Number.isNaN(event.gamma) ? event.gamma : 0,
      screenAngle,
    });
    return heading === null ? null : { heading, source: 'absolute-alpha' };
  }

  return null;
}
