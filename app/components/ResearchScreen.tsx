'use client';
import { useState } from 'react';
import { researchCategories } from '../lib/research-data';

export default function ResearchScreen() {
  const [active, setActive] = useState(researchCategories[0]);

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E, #1A3A4A)',
        padding: '52px 20px 20px', color: 'white',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🔬 গবেষণা কেন্দ্র</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>কুরআন ও হাদিস — বিজ্ঞান, অর্থ, সমাজ, দর্শন</div>
      </div>

      {/* Category grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 16 }}>
        {researchCategories.map(cat => (
          <div key={cat.id} onClick={() => setActive(cat)} style={{
            background: active.id === cat.id ? 'var(--accent)' : 'var(--card)',
            border: `1px solid ${active.id === cat.id ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 16, padding: '16px 10px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(26,95,122,0.06)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.icon}</div>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: active.id === cat.id ? 'white' : 'var(--text)',
            }}>{cat.name}</div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px 80px' }}>
        {/* Featured Ayah */}
        <div style={{
          background: 'linear-gradient(135deg, #1A5F7A, #1B7A4A)',
          borderRadius: 16, padding: 18, marginBottom: 12, color: 'white',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>
            ✨ মূল আয়াত
          </div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 20, textAlign: 'right', direction: 'rtl', lineHeight: 1.7, marginBottom: 8 }}>
            {active.featuredAyah.arabic}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 6 }}>
            {active.featuredAyah.bangla}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>{active.featuredAyah.ref} • Ibn Kathir তাফসির</div>
        </div>

        {/* Topics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.topics.map((topic, i) => (
            <div key={i} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 14,
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,95,122,0.04)',
            }}>
              <div style={{
                width: 28, height: 28, background: 'rgba(26,95,122,0.1)',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12, fontWeight: 700,
                color: 'var(--accent)', flexShrink: 0,
              }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {topic.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(26,95,122,0.06)', padding: '2px 8px', borderRadius: 10 }}>
                {topic.ref}
              </div>
            </div>
          ))}
        </div>

        {/* NUR CTA */}
        <div style={{
          background: 'rgba(27,122,74,0.06)',
          border: '1px dashed rgba(27,122,74,0.3)',
          borderRadius: 14, padding: 14, marginTop: 14,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: 'var(--green)' }}>ن</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>NUR কে জিজ্ঞেস করো</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>এই বিষয়ে আরো গভীরে যেতে চাও?</div>
          </div>
        </div>
      </div>
    </div>
  );
}
