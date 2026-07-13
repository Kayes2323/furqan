'use client';
import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTheme } from '../lib/theme';
import MarkdownRenderer from './MarkdownRenderer';

interface Category {
  id: string; icon: string; name: string; order: number;
  featuredAyah: { arabic: string; bangla: string; ref: string };
  articleCount: number;
}
interface Article {
  id: string; title: string; subtitle: string; order: number; content: string;
}

export default function ResearchScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [categories, setCategories] = useState<Category[]>([]);
  const [activecat, setActiveCat] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightBar, setShowHighlightBar] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'research'));
        const cats: Category[] = [];
        snap.forEach(d => cats.push({ id: d.id, ...d.data() } as Category));
        cats.sort((a, b) => a.order - b.order);
        setCategories(cats);
        if (cats.length > 0) { setActiveCat(cats[0]); loadArticles(cats[0].id); }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  async function loadArticles(catId: string) {
    setArticleLoading(true); setArticles([]);
    try {
      const snap = await getDocs(collection(db, 'research', catId, 'articles'));
      const arts: Article[] = [];
      snap.forEach(d => arts.push({ id: d.id, ...d.data() } as Article));
      arts.sort((a, b) => a.order - b.order);
      setArticles(arts);
    } catch (e) { console.error(e); }
    setArticleLoading(false);
  }

  function selectCat(cat: Category) {
    setActiveCat(cat); setSelectedArticle(null); loadArticles(cat.id);
  }

  // Text selection handler
  function handleSelection() {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 2) {
      setSelectedText(sel.toString().trim());
      setShowHighlightBar(true);
    } else {
      setShowHighlightBar(false);
    }
  }

  // Article reading view
  if (selectedArticle) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        {/* Header */}
        <div style={{
          background: isDark ? '#1A1D27' : 'linear-gradient(135deg, #1A3A4A, #1A5F7A)',
          padding: '48px 20px 16px', color: 'white', flexShrink: 0,
          borderBottom: isDark ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button onClick={() => { setSelectedArticle(null); setShowHighlightBar(false); }} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', padding: '6px 14px', borderRadius: 20,
              fontSize: 12, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
            }}>← ফিরে যাও</button>
            <span style={{ fontSize: 11, opacity: 0.6 }}>{activecat?.icon} {activecat?.name}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>{selectedArticle.title}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{selectedArticle.subtitle}</div>

          {/* Reading controls */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 10, opacity: 0.6 }}>অক্ষর:</span>
            {[12, 14, 16, 18].map(s => (
              <button key={s} onClick={() => setFontSize(s)} style={{
                width: 28, height: 28, borderRadius: 8, border: 'none',
                background: fontSize === s ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                color: fontSize === s ? '#1A5F7A' : 'white',
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Highlight bar */}
        {showHighlightBar && (
          <div style={{
            background: 'var(--accent)', color: 'white',
            padding: '8px 16px', display: 'flex', alignItems: 'center',
            gap: 10, flexShrink: 0, fontSize: 12,
          }}>
            <span style={{ flex: 1, opacity: 0.9 }}>"{selectedText.slice(0, 40)}..."</span>
            <button onClick={() => setShowHighlightBar(false)} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: 'white', padding: '4px 10px', borderRadius: 12,
              fontSize: 11, cursor: 'pointer',
            }}>✕</button>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          onMouseUp={handleSelection}
          onTouchEnd={handleSelection}
          style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 60px' }}
        >
          <div style={{ fontSize }}>
            <MarkdownRenderer content={selectedArticle.content} />
          </div>

          {/* NUR CTA at bottom */}
          <div style={{
            background: isDark ? 'rgba(27,122,74,0.12)' : 'rgba(27,122,74,0.06)',
            border: '1px dashed rgba(27,122,74,0.4)',
            borderRadius: 14, padding: 14, marginTop: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: 'var(--green, #1B7A4A)' }}>ن</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green, #1B7A4A)' }}>
                NUR কে জিজ্ঞেস করো
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                এই বিষয়ে আরো গভীরে যেতে চাও?
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category + article list view
  return (
    <div>
      <div style={{
        background: isDark ? '#1A1D27' : 'linear-gradient(135deg, #1A1A2E, #1A3A4A)',
        padding: '52px 20px 20px', color: 'white',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>গবেষণা কেন্দ্র</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>কুরআন ও হাদিস — বিজ্ঞান, অর্থ, সমাজ, দর্শন</div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>লোড হচ্ছে...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 16 }}>
          {categories.map(cat => (
            <div key={cat.id} onClick={() => selectCat(cat)} style={{
              background: activecat?.id === cat.id ? 'var(--accent)' : 'var(--card)',
              border: `1px solid ${activecat?.id === cat.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 16, padding: '16px 10px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(26,95,122,0.06)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: activecat?.id === cat.id ? 'white' : 'var(--text)' }}>
                {cat.name}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '0 16px 80px' }}>
        {activecat && (
          <div style={{
            background: 'linear-gradient(135deg, #1A5F7A, #1B7A4A)',
            borderRadius: 16, padding: 18, marginBottom: 12, color: 'white',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>✨ মূল আয়াত</div>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: 20, textAlign: 'right', direction: 'rtl', lineHeight: 1.7, marginBottom: 8 }}>
              {activecat.featuredAyah.arabic}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 6 }}>{activecat.featuredAyah.bangla}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{activecat.featuredAyah.ref} • Ibn Kathir</div>
          </div>
        )}

        {articleLoading ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>লোড হচ্ছে...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {articles.map((article, i) => (
              <div key={article.id} onClick={() => setSelectedArticle(article)} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,95,122,0.04)',
              }}>
                <div style={{
                  width: 32, height: 32,
                  background: 'linear-gradient(135deg, var(--accent), #2A7F9A)',
                  borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 700,
                  color: 'white', flexShrink: 0,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{article.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{article.subtitle}</div>
                </div>
                <div style={{ color: 'var(--text-light)', fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}