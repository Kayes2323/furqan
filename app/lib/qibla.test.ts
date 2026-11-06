import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KAABA_LAT,
  KAABA_LNG,
  calculateQiblaBearing,
  calculateDistanceToKaaba,
  qiblaArrowRotation,
  formatBearing,
  formatDistanceKm,
  extractCompassHeading,
  smallestAngleDifference,
  continuousRotation,
  smoothHeading,
  isFacingQibla,
} from './qibla.ts';

// Reference bearings/distances below are cross-checked against independently
// published Qibla-calculator values for these cities (not derived from this
// file's own formula in isolation) — see the Phase 2 completion report for
// the verification method.
const REFERENCE_CASES: Array<{
  name: string;
  coords: { lat: number; lng: number };
  expectedBearing: number;
  expectedDistanceKm: number;
}> = [
  { name: 'New York', coords: { lat: 40.7128, lng: -74.006 }, expectedBearing: 58.48, expectedDistanceKm: 10306.3 },
  { name: 'London', coords: { lat: 51.5074, lng: -0.1278 }, expectedBearing: 118.99, expectedDistanceKm: 4793.8 },
  { name: 'Jakarta', coords: { lat: -6.2088, lng: 106.8456 }, expectedBearing: 295.15, expectedDistanceKm: 7920.1 },
  { name: 'Sydney', coords: { lat: -33.8688, lng: 151.2093 }, expectedBearing: 277.5, expectedDistanceKm: 13236.3 },
  { name: 'Dhaka', coords: { lat: 23.8103, lng: 90.4125 }, expectedBearing: 277.57, expectedDistanceKm: 5172.0 },
];

test('calculateQiblaBearing matches known reference bearings within 0.5 degree', () => {
  for (const c of REFERENCE_CASES) {
    const bearing = calculateQiblaBearing(c.coords);
    assert.ok(
      Math.abs(bearing - c.expectedBearing) < 0.5,
      `${c.name}: expected ~${c.expectedBearing}°, got ${bearing.toFixed(2)}°`,
    );
  }
});

test('calculateDistanceToKaaba matches known reference distances within 5 km', () => {
  for (const c of REFERENCE_CASES) {
    const distance = calculateDistanceToKaaba(c.coords);
    assert.ok(
      Math.abs(distance - c.expectedDistanceKm) < 5,
      `${c.name}: expected ~${c.expectedDistanceKm} km, got ${distance.toFixed(1)} km`,
    );
  }
});

test('bearing and distance are both ~0 when standing at the Kaaba itself', () => {
  const here = { lat: KAABA_LAT, lng: KAABA_LNG };
  assert.equal(calculateDistanceToKaaba(here), 0);
  // Bearing is mathematically undefined at the pole of the calculation
  // (Δλ=0, Δφ=0); atan2(0,0) is defined as 0 in JS, which is an acceptable,
  // non-crashing degenerate value — just assert it doesn't throw or NaN.
  assert.equal(Number.isNaN(calculateQiblaBearing(here)), false);
});

test('calculateQiblaBearing always returns a value in [0, 360)', () => {
  const samples = [
    { lat: 89, lng: 179 },
    { lat: -89, lng: -179 },
    { lat: 0, lng: 0 },
    { lat: 23.8103, lng: 90.4125 },
  ];
  for (const s of samples) {
    const bearing = calculateQiblaBearing(s);
    assert.ok(bearing >= 0 && bearing < 360, `bearing ${bearing} out of range for ${JSON.stringify(s)}`);
  }
});

test('qiblaArrowRotation: facing the Qibla bearing exactly yields 0 (arrow points straight up)', () => {
  assert.equal(qiblaArrowRotation(278, 278), 0);
});

test('qiblaArrowRotation wraps correctly across the 0/360 boundary', () => {
  assert.equal(qiblaArrowRotation(10, 350), 20);
  assert.equal(qiblaArrowRotation(350, 10), 340);
});

test('formatBearing rounds to whole degrees with a ° suffix', () => {
  assert.equal(formatBearing(277.57), '278°');
  assert.equal(formatBearing(0), '0°');
});

test('formatDistanceKm keeps one decimal place', () => {
  assert.equal(formatDistanceKm(5172), '5172.0');
  assert.equal(formatDistanceKm(10306.34), '10306.3');
});

test('extractCompassHeading prefers iOS webkitCompassHeading when present', () => {
  const result = extractCompassHeading({ webkitCompassHeading: 123.4, absolute: false, alpha: 10 });
  assert.deepEqual(result, { heading: 123.4, source: 'ios-webkit' });
});

test('extractCompassHeading converts absolute alpha to clockwise-from-north heading', () => {
  const result = extractCompassHeading({ absolute: true, alpha: 90 });
  assert.deepEqual(result, { heading: 270, source: 'absolute-alpha' });
});

test('extractCompassHeading returns null for non-absolute orientation (would be a fabricated reading)', () => {
  assert.equal(extractCompassHeading({ absolute: false, alpha: 90 }), null);
  assert.equal(extractCompassHeading({ alpha: 90 }), null);
});

test('extractCompassHeading returns null when alpha is missing entirely', () => {
  assert.equal(extractCompassHeading({ absolute: true }), null);
});

test('extractCompassHeading trusts alpha from deviceorientationabsolute even when the absolute flag is unset', () => {
  // Several Chrome/Android builds deliver earth-referenced alpha on
  // deviceorientationabsolute while leaving `absolute` false; rejecting those
  // left those devices with no live compass at all.
  const result = extractCompassHeading({ absolute: false, alpha: 90 }, true);
  assert.deepEqual(result, { heading: 270, source: 'absolute-alpha' });
});

test('extractCompassHeading still refuses a relative reading from the non-absolute event', () => {
  assert.equal(extractCompassHeading({ absolute: false, alpha: 90 }, false), null);
});

test('smallestAngleDifference takes the short way round and is signed', () => {
  assert.equal(smallestAngleDifference(350, 10), 20);
  assert.equal(smallestAngleDifference(10, 350), -20);
  assert.equal(smallestAngleDifference(0, 0), 0);
  assert.equal(smallestAngleDifference(0, 180), 180);
  assert.equal(smallestAngleDifference(0, 181), -179);
});

test('smallestAngleDifference always lands in (-180, 180]', () => {
  for (let from = 0; from < 360; from += 7) {
    for (let to = 0; to < 360; to += 11) {
      const diff = smallestAngleDifference(from, to);
      assert.ok(diff > -180 && diff <= 180, `diff ${diff} out of range for ${from}->${to}`);
    }
  }
});

test('continuousRotation keeps the dial from unwinding a full circle past north', () => {
  // Rendered at 359°, target 1°: must continue to 361°, not jump back to 1°.
  assert.equal(continuousRotation(359, 1), 361);
  assert.equal(continuousRotation(1, 359), -1);
});

test('continuousRotation is idempotent and stays congruent to the target', () => {
  const once = continuousRotation(720, 45);
  const twice = continuousRotation(once, 45);
  assert.equal(twice, once);
  assert.equal(((once % 360) + 360) % 360, 45);
});

test('smoothHeading adopts the first reading exactly', () => {
  assert.equal(smoothHeading(null, 123.4), 123.4);
});

test('smoothHeading moves toward the new reading along the short arc', () => {
  // 350 -> 10 is +20; a quarter of that is +5, landing at 355.
  assert.equal(smoothHeading(350, 10, 0.25), 355);
  // And the reverse direction wraps below zero back into [0,360).
  assert.equal(smoothHeading(10, 350, 0.25), 5);
});

test('smoothHeading always returns a value in [0, 360)', () => {
  let heading = 0;
  for (const reading of [359, 1, 180, 270, 90, 0, 359.9]) {
    heading = smoothHeading(heading, reading);
    assert.ok(heading >= 0 && heading < 360, `heading ${heading} out of range`);
  }
});

test('isFacingQibla is true only within tolerance of straight ahead, across the seam', () => {
  assert.equal(isFacingQibla(0), true);
  assert.equal(isFacingQibla(5), true);
  assert.equal(isFacingQibla(355), true);
  assert.equal(isFacingQibla(6), false);
  assert.equal(isFacingQibla(354), false);
  assert.equal(isFacingQibla(180), false);
});

test('a live needle and the Kaaba marker agree: both sit at the Qibla bearing in the rotated dial', () => {
  // The dial rotates by -heading and the marker/needle are drawn at
  // bearingDeg inside it, so their on-screen angle is exactly the value
  // qiblaArrowRotation reports — the two can never diverge.
  const bearingDeg = 277.57;
  for (const heading of [0, 45, 123.4, 270, 359]) {
    const dialRotation = -heading;
    const onScreen = ((bearingDeg + dialRotation) % 360 + 360) % 360;
    assert.ok(
      Math.abs(onScreen - qiblaArrowRotation(bearingDeg, heading)) < 1e-9,
      `heading ${heading}: dial puts Qibla at ${onScreen}°, arrow math says ${qiblaArrowRotation(bearingDeg, heading)}°`,
    );
  }
});
