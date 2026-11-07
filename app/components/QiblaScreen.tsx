'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Compass,
  Loader2,
  AlertTriangle,
  MapPinOff,
  ShieldAlert,
  RotateCw,
  CheckCircle2,
  CornerUpLeft,
  CornerUpRight,
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

type CompassState =
  | 'unavailable'      // this browser has no DeviceOrientationEvent at all
  | 'probing'          // listening; nothing trustworthy has arrived yet
  | 'needs-permission' // iOS-style gate: one tap is required by the platform
  | 'denied'           // the user declined that prompt
  | 'unreliable'       // events arrive but never carry an absolute heading
  | 'active';          // live, trustworthy heading

// iOS Safari exposes a ready-made compass heading that isn't in the standard
// DeviceOrientationEvent typings.
interface WebkitOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DeviceOrientationEventStaticWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

// How long to listen before concluding the platform is gating the sensor
// behind a tap. Short enough not to feel like a hang, long enough that an
// already-granted device never flashes the prompt.
const PERMISSION_PROBE_MS = 1200;
// How long to keep waiting for a trustworthy reading before offering a retry.
const UNRELIABLE_TIMEOUT_MS = 8000;

function currentScreenAngle(): number {
  if (typeof window === 'undefined') return 0;
  const angle = window.screen?.orientation?.angle;
  return typeof angle === 'number' ? angle : 0;
}

function permissionGate(): DeviceOrientationEventStaticWithPermission | null {
  if (typeof window === 'undefined' || typeof window.DeviceOrientationEvent === 'undefined') return null;
  const candidate = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStaticWithPermission;
  return typeof candidate.requestPermission === 'function' ? candidate : null;
}

export default function QiblaScreen({ onBack }: Props) {
  const [location, setLocation] = useState<LocationState>({ status: 'checking' });
  const [compass, setCompass] = useState<CompassState>('probing');
  const [heading, setHeading] = useState<number | null>(null);
  const [dialRotation, setDialRotation] = useState(0);

  const probeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unreliableTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenerCleanup = useRef<(() => void) | null>(null);
  const watchId = useRef<number | null>(null);
  const screenAngle = useRef(0);
  // Smoothed heading and the unwrapped dial angle live in refs so each sensor
  // event can derive the next value synchronously.
  const smoothedHeading = useRef<number | null>(null);
  const continuousDial = useRef(0);

  // ── Location ──────────────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (!window.isSecureContext) {
      setLocation({ status: 'insecure' });
      return;
    }
    if (!('geolocation' in navigator)) {
      setLocation({ status: 'unsupported' });
      return;
    }

    setLocation((current) => (current.status === 'ready' ? current : { status: 'loading' }));

    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    // Watched rather than read once, so the bearing keeps matching where the
    // user actually is as the fix sharpens or they move.
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        // Only the derived numbers are kept; the raw coordinates are used
        // here, synchronously, and never stored.
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation({
          status: 'ready',
          bearingDeg: calculateQiblaBearing(coords),
          distanceKm: calculateDistanceToKaaba(coords),
        });
      },
      (err) => {
        setLocation((current) => {
          // A dropped update after a good fix is no reason to throw the
          // working screen away.
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
  }, []);

  // ── Compass ───────────────────────────────────────────────────────────
  const attachListener = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.DeviceOrientationEvent === 'undefined') {
      setCompass('unavailable');
      return;
    }

    if (listenerCleanup.current) {
      listenerCleanup.current();
      listenerCleanup.current = null;
    }
    if (probeTimer.current) clearTimeout(probeTimer.current);
    if (unreliableTimer.current) clearTimeout(unreliableTimer.current);

    setCompass('probing');

    const usesAbsoluteEvent = 'ondeviceorientationabsolute' in window;
    const eventName = usesAbsoluteEvent ? 'deviceorientationabsolute' : 'deviceorientation';

    const handler = (event: Event) => {
      const parsed = extractCompassHeading(
        event as WebkitOrientationEvent,
        usesAbsoluteEvent,
        screenAngle.current,
      );
      if (!parsed) return;

      if (probeTimer.current) {
        clearTimeout(probeTimer.current);
        probeTimer.current = null;
      }
      if (unreliableTimer.current) {
        clearTimeout(unreliableTimer.current);
        unreliableTimer.current = null;
      }

      const smoothed = smoothHeading(smoothedHeading.current, parsed.heading);
      smoothedHeading.current = smoothed;
      // The dial turns opposite the device so its N holds real north;
      // unwrapping keeps that continuous across the 0/360 seam.
      continuousDial.current = continuousRotation(continuousDial.current, -smoothed);

      setHeading(smoothed);
      setDialRotation(continuousDial.current);
      setCompass('active');
    };

    window.addEventListener(eventName, handler as EventListener);
    listenerCleanup.current = () => window.removeEventListener(eventName, handler as EventListener);

    // If the platform gates the sensor behind a gesture, nothing arrives —
    // only then is the tap affordance shown. A device that already granted
    // permission goes live without the user ever seeing it.
    probeTimer.current = setTimeout(() => {
      setCompass((current) => {
        if (current === 'active') return current;
        return permissionGate() ? 'needs-permission' : current;
      });
    }, PERMISSION_PROBE_MS);

    // The listener stays attached past this deadline, so a late trustworthy
    // reading still promotes the screen rather than stranding it.
    unreliableTimer.current = setTimeout(() => {
      setCompass((current) => (current === 'active' || current === 'needs-permission' ? current : 'unreliable'));
    }, UNRELIABLE_TIMEOUT_MS);
  }, []);

  const enableCompass = useCallback(async () => {
    const gate = permissionGate();
    if (!gate?.requestPermission) {
      attachListener();
      return;
    }
    try {
      const result = await gate.requestPermission();
      if (result === 'granted') attachListener();
      else setCompass('denied');
    } catch {
      setCompass('denied');
    }
  }, [attachListener]);

  // ── Lifecycle ─────────────────────────────────────────────────────────
  useEffect(() => {
    screenAngle.current = currentScreenAngle();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starting location + sensor on mount is the intended pattern here (matches ReaderScreen)
    requestLocation();
    attachListener();

    const onScreenChange = () => {
      screenAngle.current = currentScreenAngle();
    };
    window.screen?.orientation?.addEventListener?.('change', onScreenChange);
    window.addEventListener('orientationchange', onScreenChange);

    return () => {
      if (probeTimer.current) clearTimeout(probeTimer.current);
      if (unreliableTimer.current) clearTimeout(unreliableTimer.current);
      if (listenerCleanup.current) listenerCleanup.current();
      if (watchId.current != null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      window.screen?.orientation?.removeEventListener?.('change', onScreenChange);
      window.removeEventListener('orientationchange', onScreenChange);
    };
  }, [requestLocation, attachListener]);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 28 }}>
      <div style={{ padding: '44px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
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
            message="কিবলার দিক হিসাব করতে আপনার অবস্থান প্রয়োজন। অনুমতির একটি প্রম্পট দেখতে পারেন।"
          />
        ) : location.status === 'insecure' ? (
          <StateCard
            icon={<ShieldAlert size={28} color="var(--gold)" />}
            title="নিরাপদ সংযোগ প্রয়োজন"
            message="অবস্থান ও কম্পাস শুধু HTTPS সংযোগে কাজ করে। নিরাপদ (https://) ঠিকানা থেকে অ্যাপটি খুলুন।"
          />
        ) : location.status === 'unsupported' ? (
          <StateCard
            icon={<MapPinOff size={28} color="var(--gold)" />}
            title="এই ব্রাউজারে সমর্থিত নয়"
            message="আপনার ব্রাউজার অবস্থান সুবিধা সমর্থন করে না, তাই কিবলার দিক স্বয়ংক্রিয়ভাবে বের করা সম্ভব নয়।"
          />
        ) : location.status === 'denied' ? (
          <StateCard
            icon={<MapPinOff size={28} color="var(--gold)" />}
            title="অবস্থানের অনুমতি প্রয়োজন"
            message="কিবলার দিক বের করতে আপনার অবস্থান জানা দরকার। ব্রাউজারের সেটিংস থেকে অনুমতি দিয়ে আবার চেষ্টা করুন।"
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
            compass={compass}
            heading={heading}
            dialRotation={dialRotation}
            onEnableCompass={enableCompass}
            onRetryCompass={attachListener}
          />
        )}
      </div>
    </div>
  );
}

function StateCard({
  icon, title, message, action,
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
          marginTop: 8, background: 'var(--accent)', color: 'var(--on-accent)', border: 'none',
          borderRadius: 100, padding: '9px 20px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}><RotateCw size={14} />{action.label}</button>
      )}
    </div>
  );
}

function QiblaReady({
  bearingDeg, distanceKm, compass, heading, dialRotation, onEnableCompass, onRetryCompass,
}: {
  bearingDeg: number;
  distanceKm: number;
  compass: CompassState;
  heading: number | null;
  dialRotation: number;
  onEnableCompass: () => void;
  onRetryCompass: () => void;
}) {
  const isLive = compass === 'active' && heading != null;
  // Where the Qibla sits on screen, clockwise from the device's top edge.
  const qiblaScreenAngle = isLive ? qiblaArrowRotation(bearingDeg, heading as number) : null;
  const facing = qiblaScreenAngle != null && isFacingQibla(qiblaScreenAngle);
  // Positive = the Qibla is to the user's right.
  const turnDeg = qiblaScreenAngle != null ? smallestAngleDifference(0, qiblaScreenAngle) : null;

  return (
    <div>
      {/* Primary instruction */}
      <GuidanceBanner
        compass={compass}
        facing={facing}
        turnDeg={turnDeg}
        bearingDeg={bearingDeg}
      />

      {/* Dial */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '22px 0 8px' }}>
        <CompassDial
          bearingDeg={bearingDeg}
          dialRotation={isLive ? dialRotation : 0}
          isLive={isLive}
          facing={facing}
          awaitingTap={compass === 'needs-permission'}
          onActivate={onEnableCompass}
        />
      </div>

      {/* Numbers */}
      <div style={{
        display: 'flex', background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', marginTop: 18,
      }}>
        <StatTile value={formatBearing(bearingDeg)} label="কিবলার কোণ" />
        <Divider />
        <StatTile value={`${formatDistanceKm(distanceKm)}`} label="দূরত্ব (কিমি)" />
        <Divider />
        <StatTile
          value={isLive ? formatBearing(heading as number) : '—'}
          label="আপনি যেদিকে"
          dim={!isLive}
        />
      </div>

      {/* Secondary state / help */}
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        {compass === 'probing' && (
          <HintRow>
            <Loader2 size={12} className="qibla-spin" />
            কম্পাস সেন্সর চালু হচ্ছে…
          </HintRow>
        )}
        {compass === 'denied' && (
          <HelpBlock
            text="কম্পাসের অনুমতি দেওয়া হয়নি। নিচের কোণ ব্যবহার করুন, অথবা অনুমতি দিয়ে আবার চেষ্টা করুন।"
            action={{ label: 'অনুমতি দিন', onClick: onEnableCompass }}
          />
        )}
        {compass === 'unreliable' && (
          <HelpBlock
            text={`এখনো নির্ভরযোগ্য রিডিং আসেনি। ফোনটি হাতে নিয়ে ৮-আকৃতিতে কয়েকবার ঘোরান — সেন্সর ক্যালিব্রেট হলে নিজেই চালু হবে। অথবা ${formatBearing(bearingDeg)} কোণ ধরে যেকোনো কম্পাসে মিলিয়ে নিন।`}
            action={{ label: 'আবার চেষ্টা করুন', onClick: onRetryCompass }}
          />
        )}
        {compass === 'unavailable' && (
          <HelpBlock
            text={`এই ডিভাইসে লাইভ কম্পাস নেই। ${formatBearing(bearingDeg)} কোণ ধরে যেকোনো কম্পাসে উত্তর বরাবর মিলিয়ে কিবলা নির্ণয় করুন।`}
          />
        )}
        {isLive && (
          <HintRow>
            <RotateCw size={12} />
            যেকোনোভাবে ধরতে পারেন — কাত করলেও হিসাব ঠিক থাকে। রিডিং অস্থির হলে ৮-আকৃতিতে ঘুরিয়ে ক্যালিব্রেট করুন।
          </HintRow>
        )}
      </div>
    </div>
  );
}

function GuidanceBanner({
  compass, facing, turnDeg, bearingDeg,
}: {
  compass: CompassState;
  facing: boolean;
  turnDeg: number | null;
  bearingDeg: number;
}) {
  if (facing) {
    return (
      <div style={{
        marginTop: 16, padding: '16px 18px', borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(31,122,76,0.16), rgba(47,160,107,0.10))',
        border: '1px solid rgba(31,122,76,0.35)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <CheckCircle2 size={26} color="var(--accent)" strokeWidth={2} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>আপনি কিবলামুখী</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
            এই দিকেই নামাজ পড়ুন
          </div>
        </div>
      </div>
    );
  }

  if (turnDeg != null) {
    const right = turnDeg >= 0;
    const amount = Math.round(Math.abs(turnDeg));
    return (
      <div style={{
        marginTop: 16, padding: '14px 18px', borderRadius: 18,
        background: 'var(--card)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: 'rgba(31,122,76,0.12)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {right ? <CornerUpRight size={22} strokeWidth={2} /> : <CornerUpLeft size={22} strokeWidth={2} />}
        </div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {amount}°
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              {right ? 'ডানে ঘুরুন' : 'বামে ঘুরুন'}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            🕋 চিহ্নটি উপরের তীরের সাথে মেলান
          </div>
        </div>
      </div>
    );
  }

  // No live heading yet — state the one thing that is already known for sure.
  const waiting = compass === 'probing';
  return (
    <div style={{
      marginTop: 16, padding: '14px 18px', borderRadius: 18,
      background: 'var(--card)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: 'rgba(150,112,42,0.14)', color: 'var(--gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {waiting
          ? <Loader2 size={20} className="qibla-spin" />
          : <Compass size={22} strokeWidth={1.9} />}
      </div>
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>
          কিবলা {formatBearing(bearingDeg)} — উত্তর থেকে
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
          {compass === 'needs-permission'
            ? 'লাইভ দিক দেখতে নিচের কম্পাসে একবার চাপ দিন'
            : waiting
              ? 'লাইভ কম্পাস খোঁজা হচ্ছে…'
              : 'ডায়ালের উপরের দিক উত্তর ধরা হয়েছে'}
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: 'var(--border)' }} />;
}

function StatTile({ value, label, dim }: { value: string; label: string; dim?: boolean }) {
  return (
    <div style={{ flex: 1, padding: '13px 8px', textAlign: 'center' }}>
      <div style={{
        fontSize: 16, fontWeight: 700,
        color: dim ? 'var(--text-light)' : 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function HintRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 10.5, color: 'var(--text-light)', lineHeight: 1.6,
      textAlign: 'center', maxWidth: 300, justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}

function HelpBlock({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 300 }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.65 }}>{text}</div>
      {action && (
        <button onClick={action.onClick} style={{
          background: 'var(--accent)', color: 'var(--on-accent)', border: 'none', borderRadius: 100,
          padding: '9px 20px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Hind Siliguri, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}><RotateCw size={13} />{action.label}</button>
      )}
    </div>
  );
}

/**
 * The dial face is drawn in the *world* frame: ticks, cardinals, the Kaaba
 * marker and the ray to it all sit in one group rotated by `dialRotation`
 * (= −heading), so N holds real north as the phone turns. Because the marker
 * and the ray are both placed at `bearingDeg` inside that group they cannot
 * disagree. Only the arrow at the top sits outside the group: it marks the
 * direction the phone itself faces, so lining the 🕋 up with it means facing
 * the Qibla.
 *
 * With no live heading the group sits at 0°, i.e. the dial reads as
 * "screen-up is north" — which the copy above it states outright.
 */
function CompassDial({
  bearingDeg, dialRotation, isLive, facing, awaitingTap, onActivate,
}: {
  bearingDeg: number;
  dialRotation: number;
  isLive: boolean;
  facing: boolean;
  awaitingTap: boolean;
  onActivate: () => void;
}) {
  const size = 'min(78vw, 310px)';
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const cardinals: Array<{ label: string; angle: number }> = [
    { label: 'উ', angle: 0 },
    { label: 'পূ', angle: 90 },
    { label: 'দ', angle: 180 },
    { label: 'প', angle: 270 },
  ];
  // Labels counter-rotate by their own angle plus the group's, so they stay
  // upright however the dial turns.
  const uprightFor = (angle: number) => -(angle + dialRotation);

  const Wrapper = awaitingTap ? 'button' : 'div';

  return (
    <Wrapper
      onClick={awaitingTap ? onActivate : undefined}
      aria-label={awaitingTap ? 'লাইভ কম্পাস চালু করুন' : undefined}
      style={{
        position: 'relative', width: size, aspectRatio: '1 / 1',
        padding: 0, border: 'none', background: 'none',
        cursor: awaitingTap ? 'pointer' : 'default',
        fontFamily: 'Hind Siliguri, sans-serif',
      }}
    >
      {/* soft aligned halo */}
      {facing && (
        <div className="qibla-aligned-glow" style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(31,122,76,0.30) 0%, rgba(31,122,76,0) 70%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* fixed "you are facing this way" marker */}
      <div style={{
        position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0, zIndex: 3,
        borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
        borderTop: `13px solid ${facing ? 'var(--accent)' : 'var(--gold)'}`,
        transition: 'border-top-color 0.2s ease-out',
      }} />

      {/* dial face */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'var(--card)',
        border: `1px solid ${facing ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: facing
          ? '0 10px 34px rgba(31,122,76,0.26), inset 0 0 0 1px rgba(31,122,76,0.35)'
          : '0 10px 30px rgba(15,42,25,0.14)',
        transition: 'box-shadow 0.25s ease-out, border-color 0.25s ease-out',
        overflow: 'hidden',
      }}>
        {/* world-frame group — everything here turns with the compass */}
        <div
          className={isLive ? 'qibla-needle' : undefined}
          style={{ position: 'absolute', inset: 0, transform: `rotate(${dialRotation}deg)` }}
        >
          {ticks.map((angle) => {
            const major = angle % 90 === 0;
            const medium = !major && angle % 30 === 0;
            return (
              <div key={angle} style={{ position: 'absolute', inset: 0, transform: `rotate(${angle}deg)` }}>
                <div style={{
                  position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                  width: major ? 2.5 : medium ? 2 : 1,
                  height: major ? 15 : medium ? 10 : 6,
                  background: major ? 'var(--text)' : medium ? 'var(--text-muted)' : 'var(--border)',
                  borderRadius: 2,
                }} />
              </div>
            );
          })}

          {cardinals.map((c) => (
            <div key={c.label} style={{ position: 'absolute', inset: 0, transform: `rotate(${c.angle}deg)` }}>
              <div style={{
                position: 'absolute', top: 27, left: '50%',
                transform: `translateX(-50%) rotate(${uprightFor(c.angle)}deg)`,
                fontSize: 15, fontWeight: 700,
                color: c.angle === 0 ? '#C0392B' : 'var(--text)',
              }}>{c.label}</div>
            </div>
          ))}

          {/* ray from the centre out to the Kaaba marker */}
          <div style={{ position: 'absolute', inset: 0, transform: `rotate(${bearingDeg}deg)` }}>
            <div style={{
              position: 'absolute', top: '16%', left: '50%', transform: 'translateX(-50%)',
              width: 3, height: '34%', borderRadius: 3,
              background: `linear-gradient(to bottom, ${facing ? 'var(--accent)' : 'var(--gold)'}, rgba(0,0,0,0))`,
              opacity: isLive ? 1 : 0.55,
              transition: 'background 0.25s ease-out',
            }} />
          </div>

          {/* Kaaba marker at the calculated Qibla bearing */}
          <div style={{ position: 'absolute', inset: 0, transform: `rotate(${bearingDeg}deg)` }}>
            <div style={{
              // Sits inside the cardinal-label ring, so a Qibla bearing that
              // happens to fall near N/E/S/W does not collide with its letter.
              position: 'absolute', top: 54, left: '50%',
              transform: `translateX(-50%) rotate(${uprightFor(bearingDeg)}deg)`,
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--gold-light)',
              border: `2.5px solid ${facing ? 'var(--accent)' : 'var(--gold)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19,
              boxShadow: facing
                ? '0 3px 14px rgba(31,122,76,0.45)'
                : '0 3px 10px rgba(150,112,42,0.35)',
              transition: 'border-color 0.25s ease-out, box-shadow 0.25s ease-out',
            }} aria-label="কাবা শরীফের দিক">🕋</div>
          </div>
        </div>

        {/* centre ornament */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 14, height: 14, borderRadius: '50%',
          background: facing ? 'var(--accent)' : 'var(--text)',
          boxShadow: '0 0 0 4px var(--card)',
          transition: 'background 0.25s ease-out',
        }} />

        {/* iOS-style gate: the whole dial is the tap target */}
        {awaitingTap && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(14,42,25,0.72)', backdropFilter: 'blur(2px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            color: '#fff', padding: 24, textAlign: 'center',
          }}>
            <Compass size={34} strokeWidth={1.6} className="qibla-tap-hint" />
            <div style={{ fontSize: 14, fontWeight: 700 }}>লাইভ কম্পাস চালু করুন</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}>
              আইফোনে সেন্সর চালু করতে একবার চাপ দেওয়া বাধ্যতামূলক
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
