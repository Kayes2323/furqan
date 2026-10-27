'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/** Text colour that stays readable on the accent green in both themes
 *  (the variable is flipped by ThemeProvider). */
const ON_ACCENT = 'var(--on-accent)';

export function Card({ children, style, as: Tag = 'section', label }: { children: ReactNode; style?: CSSProperties; as?: 'section' | 'div'; label?: string }) {
  return (
    <Tag
      aria-label={label}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, ...style }}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{children}</h3>
      {hint && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

export function ProgressBar({ value, max, label, height = 8 }: { value: number; max: number; label: string; height?: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      style={{ height, borderRadius: height / 2, background: 'var(--bg)', overflow: 'hidden', border: '1px solid var(--border)' }}
    >
      <div className="qj-bar" style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: height / 2 }} />
    </div>
  );
}

const base: CSSProperties = {
  minHeight: 46, borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 20px',
};

export function PrimaryButton({ children, onClick, disabled, full = true, style, type = 'button' }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; full?: boolean; style?: CSSProperties; type?: 'button' | 'submit';
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...base, width: full ? '100%' : undefined, background: 'var(--accent)', color: ON_ACCENT, border: 'none',
      boxShadow: '0 4px 14px rgba(31,122,76,0.25)', ...style,
    }}>{children}</button>
  );
}

export function SecondaryButton({ children, onClick, disabled, full = true, style, danger }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; full?: boolean; style?: CSSProperties; danger?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      ...base, width: full ? '100%' : undefined, background: 'transparent',
      color: danger ? '#B3362C' : 'var(--accent)', border: `1px solid ${danger ? '#B3362C66' : 'var(--border)'}`, ...style,
    }}>{children}</button>
  );
}

export function TextButton({ children, onClick, style }: { children: ReactNode; onClick?: () => void; style?: CSSProperties }) {
  return (
    <button type="button" onClick={onClick} style={{
      minHeight: 44, padding: '0 8px', background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600, textDecoration: 'underline', ...style,
    }}>{children}</button>
  );
}

/** Accessible modal confirmation (role=dialog, Esc to close, focus on the
 *  safe action first, focus returned to the opener on close). */
export function ConfirmDialog({ title, body, confirmLabel, cancelLabel = 'বাতিল', danger, onCancel, onConfirm }: {
  title: string; body: ReactNode; confirmLabel: string; cancelLabel?: string; danger?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onCancel]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 998, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qj-dialog-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, background: 'var(--card)', borderRadius: '22px 22px 0 0',
          padding: '22px 20px max(20px, env(safe-area-inset-bottom))', boxShadow: '0 -8px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div id="qj-dialog-title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.7 }}>{body}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button ref={cancelRef} type="button" onClick={onCancel} style={{ ...base, flex: 1, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>{cancelLabel}</button>
          <button type="button" onClick={onConfirm} style={{ ...base, flex: 1, border: 'none', background: danger ? '#B3362C' : 'var(--accent)', color: danger ? '#fff' : ON_ACCENT }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%', style }: { h?: number; w?: number | string; style?: CSSProperties }) {
  return <div className="qj-skeleton" aria-hidden="true" style={{ height: h, width: w, ...style }} />;
}
