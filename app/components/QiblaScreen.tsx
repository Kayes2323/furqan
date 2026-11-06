'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Loader2,
  AlertTriangle,
  MapPinOff,
  ShieldAlert,
  Navigation2,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';
import BackButton from './BackButton';
import {
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
} from '../lib/qibla';

interface Props {
  onBack: () => void;
}

type LocationState =
  | { status: 'checking' }
  | { status: 'insecure' }
  | { status: 'unsupported' }
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'error'; message: string }
  | { status: 'ready'; bearingDeg: number; distanceKm: number };

type OrientationState =
  | 'unavailable'      // no DeviceOrientationEvent at all on this browser
  | 'needs-permission' // iOS 13+ style — must be requested from a tap
  | 'denied'           // user declined the iOS permission prompt
  | 'pending'          // listener attached, waiting for a trustworthy reading
  | 'unreliable'       // events arrived but never carried an absolute heading
  | 'active';          // live, trustworthy heading available

// iOS Safari exposes a ready-to-use true-north heading that isn't part of
// the standard DeviceOrientationEvent typings.
interface WebkitOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DeviceOrientationEventStaticWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

// Sensors need a moment to warm up, and the location permission prompt can
// hold the page's attention while they do — 4s was tight enough that devices
// with a perfectly good compass were being written off as unreliable.
const UNRELIABLE_TIMEOUT_MS = 8000;

export default function QiblaScreen({ onBack }: Props) {
  const [location, setLocation] = useState<LocationState>({ status: 'checking' });
  const [orientation, setOrientation] = useState<OrientationState>('unavailable');
  const [heading, setHeading] = useState<number | null>(null);
  const [dialRotation, setDialRotation] = useState(0);

  const unreliableTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenerCleanup = useRef<(() => void) | null>(null);
  const watchId = useRef<number | null>(null);
  // Smoothed heading and the unwrapped dial angle are tracked in refs so each
  // sensor event can derive the next value synchronously, without a state
  // updater having to read other state.
  const smoothedHeading = useRef<number | null>(null);
  const continuousDial = useRef(0);

  function requestLocation() {
    if (typeof window === 'undefined') return;

    if (!window.isSecureContext) {
      setLocation({ status: 'insecure' });
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocation({ status: 'unsupported' });
      return;
    }

    setLocation({ status: 'loading' });

    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    // watchPosition rather than a single fix: the bearing is recomputed as the
    // fix sharpens (and as the user moves), so the number on screen keeps
    // matching where they actually are.
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        // Derive and keep only the numbers we need to display — the raw
        // coordinates are used here, synchronously, and never stored.
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        const bearingDeg = calculateQiblaBearing(coords);
        const distanceKm = calculateDistanceToKaaba(coords);
        setLocation({ status: 'ready', bearingDeg, distanceKm });
      },
      (err) => {
        setLocation((current) => {
          // A dropped update after a good fix is not worth throwing the
          // working screen away — keep showing the last known bearing.
          if (current.status === 'ready') return current;
          if (err.code === err.PERMISSION_DENIED) return { status: 'denied' };
          if (err.code === err.TIMEOUT) {
            return { status: 'error', message: 'অবস্থান নির্ণয়ে সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন।' };
          }
          return { status: 'error', message: 'এই মুহূর্তে অবস্থান পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।' };
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60 * 1000 },
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount is the intended pattern here (matches app/lib/theme.tsx and the Sirah screens)
    requestLocation();
  }, []);

  function attachOrientationListener() {
    // Retrying must not stack a second listener on top of the first.
    if (listenerCleanup.current) {
      listenerCleanup.current();
      listenerCleanup.current = null;
    }
    if (unreliableTimer.current) {
      clearTimeout(unreliableTimer.current);
      unreliableTimer.current = null;
    }

    setOrientation('pending');

    const usesAbsoluteEvent = 'ondeviceorientationabsolute' in window;
    const eventName = usesAbsoluteEvent ? 'deviceorientationabsolute' : 'deviceorientation';

    const handler = (event: Event) => {
      const parsed = extractCompassHeading(event as WebkitOrientationEvent, usesAbsoluteEvent);
      if (!parsed) return;

      if (unreliableTimer.current) {
        clearTimeout(unreliableTimer.current);
        unreliableTimer.current = null;
      }

      const smoothed = smoothHeading(smoothedHeading.current, parsed.heading);
      smoothedHeading.current = smoothed;
      // The dial turns opposite the device so its N keeps pointing at real
      // north; unwrapping keeps that rotation continuous past the 0/360 seam.
      continuousDial.current = continuousRotation(continuousDial.current, -smoothed);

      setHeading(smoothed);
      setDialRotation(continuousDial.current);
      setOrientation('active');
    };

    window.addEventListener(eventName, handler as EventListener);
    listenerCleanup.current = () => window.removeEventListener(eventName, handler as EventListener);

    // The listener deliberately stays attached past this deadline, so a
    // late-arriving trustworthy reading still promotes the screen to 'active'
    // instead of leaving it stuck on the fallback copy forever.
    unreliableTimer.current = setTimeout(() => {
      setOrientation((current) => (current === 'active' ? current : 'unreliable'));
    }, UNRELIABLE_TIMEOUT_MS);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time feature detection on mount, not a data sync loop
      setOrientation('unavailable');
      return;
    }
    const withPermission = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStaticWithPermission;
    if (typeof withPermission.requestPermission === 'function') {
      // iOS 13+: the sensor must stay off until the user explicitly taps
      // "enable compass" — requestPermission() has to run inside that tap's
      // own gesture handler, so we only mark it as available here.
      setOrientation('needs-permission');
    } else {
      // Most non-iOS browsers don't gate orientation behind a permission
      // prompt at all, so we can start listening right away.
      attachOrientationListener();
    }
  }, []);

  async function handleEnableCompass() {
    const withPermission = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStaticWithPermission;

    if (typeof withPermission.requestPermission === 'function') {
      try {
        const result = await withPermission.requestPermission();
        if (result === 'granted') {
          attachOrientationListener();
        } else {
          setOrientation('denied');
        }
      } catch {
        setOrientation('denied');
      }
      return;
    }

    attachOrientationListener();
  }

  useEffect(() => {
    return () => {
      if (unreliableTimer.current) clearTimeout(unreliableTimer.current);
      if (listenerCleanup.current) listenerCleanup.current();
      if (watchId.current != null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 24 }}>
      <div style={{
        padding: '44px 16px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <BackButton onClick={onBack} variant="dark" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>কিবলা</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>কাবা শরীফের দিক নির্ণয়</div>
        </div>
        <Compass size={20} color="var(--accent)" strokeWidth={1.8} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {location.status === 'checking' || location.status === 'loading' ? (
          <StateCard
            icon={<Loader2 size={28} className="qibla-spin" color="var(--accent)" />}
            title="অবস্থান নির্ণয় করা হচ্ছে…"
            message="কিবলার দিক হিসাব করতে আপনার অবস্থান জানা প্রয়োজন। অনুমতি দেয়ার জন্য একটি প্রম্পট দেখতে পারেন।"
          />
        ) : location.status === 'insecure' ? (
          <StateCard
            icon={<ShieldAlert size={28} color="var(--gold)" />}
            title="নিরাপদ সংযোগ প্রয়োজন"
            message="অবস্থান ও কম্পাস ফিচার শুধু HTTPS সংযোগে কাজ করে। অনুগ্রহ করে নিরাপদ (https://) ঠিকানা থেকে অ্যাপটি খুলুন।"
          />
        ) : location.status === 'unsupported' ? (
          <StateCard
            icon={<MapPinOff size={28} color="var(--gold)" />}
            title="এই ব্রাউজারে সমর্থিত নয়"
            message="আপনার ব্রাউজার অবস্থান (Location) সুবিধা সমর্থন করে না, তাই কিবলার দিক স্বয়ংক্রিয়ভাবে বের করা সম্ভব নয়।"
          />
        ) : location.status === 'denied' ? (
          <StateCard
            icon={<MapPinOff size={28} color="var(--gold)" />}
            title="অবস্থানের অনুমতি প্রয়োজন"
            message="কিবলার দিক বের করতে আপনার অবস্থান জানা দরকার। ব্রাউজারের সেটিংস থেকে অবস্থানের অনুমতি চালু করে আবার চেষ্টা করুন।"
            action={{ label: 'আবার চেষ্টা করুন', onClick: requestLocation }}
          />
        ) : location.status === 'error' ? (
          <StateCard
            icon={<AlertTriangle size={28} color="var(--gold)" />}
            title="সমস্যা হয়েছে"
            message={location.message}
            action={{ label: 'আবার চেষ্টা করুন', onClick: requestLocation }}
          />
        ) : (
          <QiblaReady
            bearingDeg={location.bearingDeg}
            distanceKm={location.distanceKm}
            orientation={orientation}
            heading={heading}
            dialRotation={dialRotation}
            onEnableCompass={handleEnableCompass}
            onRetryCompass={attachOrientationListener}
          />
        )}
      </div>
    </div>
  );
}

function StateCard({
  icon,
  title,
  message,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 18, padding: '32px 20px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      marginTop: 24,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: 'rgba(150,112,42,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
      }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280 }}>{message}</div>
      {action && (
        <button onClick={action.onClick} style={{
          marginTop: 8, background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 100, padding: '9px 20px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}><RotateCw size={14} />{action.label}</button>
      )}
    </div>
  );
}

function QiblaReady({
  bearingDeg,
  distanceKm,
  orientation,
  heading,
  dialRotation,
  onEnableCompass,
  onRetryCompass,
}: {
  bearingDeg: number;
  distanceKm: number;
  orientation: OrientationState;
  heading: number | null;
  dialRotation: number;
  onEnableCompass: () => void;
  onRetryCompass: () => void;
}) {
  const isLive = orientation === 'active' && heading != null;
  // Where the Qibla sits on screen, clockwise from the device's top edge.
  const qiblaScreenAngle = isLive ? qiblaArrowRotation(bearingDeg, heading as number) : null;
  const facing = qiblaScreenAngle != null && isFacingQibla(qiblaScreenAngle);
  // Positive means the Qibla is to the user's right.
  const turnDeg = qiblaScreenAngle != null ? smallestAngleDifference(0, qiblaScreenAngle) : null;

  return (
    <div>
      {/* Stats row */}
      <div style={{
        display: 'flex', background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', marginTop: 16,
      }}>
        <StatTile value={`${formatDistanceKm(distanceKm)} কিমি`} label="কাবা শরীফের দূরত্ব" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatTile value={formatBearing(bearingDeg)} label="কিবলার কৌণিক দিক" />
        {isLive && <div style={{ width: 1, background: 'var(--border)' }} />}
        {isLive && <StatTile value={formatBearing(heading as number)} label="ডিভাইস যেদিকে আছে" />}
      </div>

      {/* Status pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        {facing ? (
          <Pill tone="accent" icon={<CheckCircle2 size={13} />}>
            আপনি এখন কিবলামুখী — এই দিকেই নামাজ পড়ুন
          </Pill>
        ) : isLive ? (
          <Pill tone="accent" icon={<Navigation2 size={13} />}>
            {turnDeg != null && turnDeg >= 0
              ? `ডানদিকে ${Math.round(Math.abs(turnDeg))}° ঘুরুন`
              : `বামদিকে ${Math.round(Math.abs(turnDeg ?? 0))}° ঘুরুন`}
          </Pill>
        ) : (
          <Pill tone="muted" icon={<Compass size={13} />}>
            গণনাকৃত দিক প্রস্তুত — কম্পাসে উপরের দিক উত্তর ধরে মেলান
          </Pill>
        )}
      </div>

      {/* Dial */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '28px 0 10px' }}>
        <CompassDial
          bearingDeg={bearingDeg}
          dialRotation={isLive ? dialRotation : 0}
          isLive={isLive}
          facing={facing}
        />
      </div>

      {/* Enable-compass button / calibration guidance */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        {orientation === 'needs-permission' && (
          <ActionPill icon={<Compass size={14} />} label="লাইভ কম্পাস চালু করো" onClick={onEnableCompass} />
        )}
        {orientation === 'pending' && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={13} className="qibla-spin" />কম্পাস সেন্সর চালু হচ্ছে…
          </div>
        )}
        {orientation === 'denied' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260 }}>
              কম্পাসের অনুমতি দেয়া হয়নি। ওপরের সংখ্যা ব্যবহার করুন, অথবা ব্রাউজারের সেটিংস থেকে অনুমতি দিয়ে আবার চেষ্টা করুন।
            </div>
            <ActionPill icon={<RotateCw size={14} />} label="আবার চেষ্টা করুন" onClick={onEnableCompass} />
          </div>
        )}
        {orientation === 'unreliable' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 270 }}>
              এখনো নির্ভরযোগ্য কম্পাস রিডিং আসেনি। ফোনটি সমতলে ধরে ৮-আকৃতিতে কয়েকবার ঘোরান — সেন্সর ক্যালিব্রেট হলে নিজেই চালু হয়ে যাবে। অথবা ওপরের {formatBearing(bearingDeg)} অনুযায়ী যেকোনো কম্পাসে উত্তর বরাবর মিলিয়ে নিন।
            </div>
            <ActionPill icon={<RotateCw size={14} />} label="আবার চেষ্টা করুন" onClick={onRetryCompass} />
          </div>
        )}
        {orientation === 'unavailable' && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 270 }}>
            এই ব্রাউজার/ডিভাইসে লাইভ কম্পাস সমর্থিত নয়। ওপরের {formatBearing(bearingDeg)} অনুযায়ী যেকোনো কম্পাস দিয়ে উত্তর বরাবর ঘুরে কিবলা নির্ণয় করুন।
          </div>
        )}
      </div>

      {isLive && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginTop: 14, fontSize: 10.5, color: 'var(--text-light)',
          textAlign: 'center', lineHeight: 1.6,
        }}>
          <RotateCw size={12} style={{ flexShrink: 0 }} />
          <span>
            ফোনটি সমতল রেখে ধরুন। রিডিং অস্থির হলে ৮-আকৃতিতে ঘুরিয়ে ক্যালিব্রেট করুন — ডিভাইসের চৌম্বক কম্পাস ভিত্তিক, তাই ১-২° পার্থক্য হতে পারে।
          </span>
        </div>
      )}
      {!isLive && (
        <div style={{
          marginTop: 14, fontSize: 10.5, color: 'var(--text-light)',
          textAlign: 'center', lineHeight: 1.6, padding: '0 20px',
        }}>
          লাইভ কম্পাস ছাড়া ডায়ালের উপরের দিক উত্তর ধরে আঁকা হয়েছে — তাই আগে উত্তর ঠিক করে নিন, তারপর 🕋 চিহ্নের দিক অনুসরণ করুন।
        </div>
      )}
    </div>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ flex: 1, padding: '14px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Pill({ children, tone, icon }: { children: React.ReactNode; tone: 'accent' | 'muted'; icon: React.ReactNode }) {
  const styles = tone === 'accent'
    ? { background: 'rgba(31,122,76,0.12)', color: 'var(--accent)', border: '1px solid rgba(31,122,76,0.25)' }
    : { background: 'rgba(150,112,42,0.1)', color: 'var(--gold)', border: '1px solid rgba(150,112,42,0.2)' };
  return (
    <div style={{
      ...styles, borderRadius: 100, padding: '6px 14px', fontSize: 11, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 6, textAlign: 'center', maxWidth: 320,
    }}>{icon}{children}</div>
  );
}

function ActionPill({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100,
      padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      fontFamily: 'Hind Siliguri, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 7,
      boxShadow: '0 4px 16px rgba(31,122,76,0.3)',
    }}>{icon}{label}</button>
  );
}

/**
 * The dial face is drawn in the *world* frame: N/E/S/W, the tick marks, the
 * Kaaba marker and the needle all live inside one group that rotates by
 * `dialRotation` (= −heading) so that N keeps pointing at real north as the
 * phone turns. Because the Kaaba marker and the needle are both placed at
 * `bearingDeg` inside that group, the needle always points straight at the
 * marker — they cannot disagree. The only thing outside the rotating group is
 * the triangle at the top, which marks the direction the phone itself faces;
 * lining the 🕋 up with that triangle means you are facing the Qibla.
 *
 * With no live heading the group sits at 0°, i.e. the dial reads as
 * "screen-up is north" — which the surrounding copy states explicitly.
 */
function CompassDial({
  bearingDeg,
  dialRotation,
  isLive,
  facing,
}: {
  bearingDeg: number;
  dialRotation: number;
  isLive: boolean;
  facing: boolean;
}) {
  const size = 'min(80vw, 300px)';
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);
  const cardinals: Array<{ label: string; angle: number }> = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ];
  // Labels and the 🕋 glyph counter-rotate by their own angle *plus* the
  // group's, so they stay upright however the dial is turned.
  const uprightFor = (angle: number) => -(angle + dialRotation);

  return (
    <div style={{ position: 'relative', width: size, aspectRatio: '1 / 1' }}>
      {/* fixed "you are facing this way" reference marker */}
      <div style={{
        position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
        borderBottom: `11px solid ${facing ? 'var(--accent)' : 'var(--gold)'}`,
        transition: 'border-bottom-color 0.2s ease-out',
        zIndex: 2,
      }} />

      {/* dial face */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: '#FBF9F0',
        boxShadow: facing
          ? '0 8px 30px rgba(31,122,76,0.35), inset 0 0 0 2px var(--accent)'
          : '0 8px 30px rgba(15,42,25,0.18), inset 0 0 0 1px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s ease-out',
      }}>
        {/* world-frame group: everything here turns with the compass */}
        <div
          className={isLive ? 'qibla-needle' : undefined}
          style={{
            position: 'absolute', inset: 0,
            transform: `rotate(${dialRotation}deg)`,
          }}
        >
          {/* tick marks */}
          {ticks.map((angle) => (
            <div key={angle} style={{
              position: 'absolute', inset: 0,
              transform: `rotate(${angle}deg)`,
            }}>
              <div style={{
                position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                width: angle % 90 === 0 ? 3 : 1.5,
                height: angle % 90 === 0 ? 16 : 10,
                background: angle % 90 === 0 ? '#16241B' : '#B9B296',
                borderRadius: 2,
              }} />
            </div>
          ))}

          {/* N/E/S/W labels */}
          {cardinals.map((c) => (
            <div key={c.label} style={{
              position: 'absolute', inset: 0,
              transform: `rotate(${c.angle}deg)`,
            }}>
              <div style={{
                position: 'absolute', top: 30, left: '50%',
                transform: `translateX(-50%) rotate(${uprightFor(c.angle)}deg)`,
                fontSize: 17, fontWeight: 700,
                color: c.label === 'N' ? '#8C2B2B' : '#16241B',
              }}>{c.label}</div>
            </div>
          ))}

          {/* Kaaba marker, at the calculated Qibla bearing */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: `rotate(${bearingDeg}deg)`,
          }}>
            <div style={{
              position: 'absolute', top: 46, left: '50%',
              transform: `translateX(-50%) rotate(${uprightFor(bearingDeg)}deg)`,
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--gold-light)',
              border: `2px solid ${facing ? 'var(--accent)' : 'var(--gold)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, boxShadow: '0 2px 8px rgba(150,112,42,0.35)',
            }} aria-label="কাবা শরীফের দিক">🕋</div>
          </div>

          {/* needle — points along the same bearing, so straight at the 🕋.
              Only drawn with a trustworthy live heading. */}
          {isLive && (
            <div style={{
              position: 'absolute', inset: 0,
              transform: `rotate(${bearingDeg}deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Navigation2 size={64} color="var(--accent)" fill="var(--accent)" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* center pivot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 10, height: 10, borderRadius: '50%', background: 'var(--text)',
          boxShadow: '0 0 0 3px #FBF9F0',
        }} />
      </div>
    </div>
  );
}
