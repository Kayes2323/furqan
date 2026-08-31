'use client';

import type { CSSProperties } from 'react';

interface Props {
  onClick: () => void;
  label?: string;
  variant?: 'light' | 'dark' | 'accent';
  style?: CSSProperties;
}

export default function BackButton({ onClick, label, variant = 'light', style }: Props) {
  const variants = {
    light: {
      background: 'rgba(255,255,255,.12)',
      border: '1px solid rgba(255,255,255,.2)',
      color: '#fff',
    },
    dark: {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      color: 'var(--text)',
    },
    accent: {
      background: 'rgba(26,95,122,0.08)',
      border: '1px solid var(--border)',
      color: 'var(--accent)',
    },
  } as const;

  const v = variants[variant];

  if (label) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--accent)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          ...style,
        }}
      >
        ← {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="পিছনে যান"
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: v.background,
        border: v.border,
        color: v.color,
        fontSize: 15,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      ←
    </button>
  );
}
