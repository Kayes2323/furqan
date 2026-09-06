'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTheme } from '../lib/theme';
import BackButton from './BackButton';
import MarkdownRenderer from './MarkdownRenderer';
import { researchCategories } from '../lib/research-data';

interface Props {
  onBack: () => void;
}

interface Article {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  content: string;
}

export default function ResearchScreen({ onBack }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeId, setActiveId] = useState('science');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  const activeCat = researchCategories.find(c => c.id === activeId) || researchCategories[0];

  useEffect(() => {
    loadArticles(activeId);
  }, [activeId]);

  async function loadArticles(catId: string) {
    setArticleLoading(true);
    setArticles([]);
    setSelectedArticle(null);
    try {
      const snap = await getDocs(collection(db, 'research', catId, 'articles'));
      const arts: Article[] = [];
      snap.forEach(d => arts.push({ id: d.id, ...d.data() } as Article));
      arts.sort((a, b) => a.order - b.order);
      setArticles(arts);
    } catch (e) {
      console.error(e);
      setArticles([]);
    }
    setArticleLoading(false);
  }

  if (selectedArticle) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <div style={{
          background: isDark ? '#1A1D27' : '#1A5F7A',
          padding: '44px 16px 10px',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          <BackButton onClick={() => setSelectedArticle(null)} variant="light" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedArticle.title}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
              {activeCat.icon} {activeCat.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[12, 14, 16, 18].map(s => (
              <button key={s} onClick={() => setFontSize(s)} style={{
                width: 26, height: 26, borderRadius: 8, border: 'none',
                background: fontSize === s ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                color: fontSize === s ? '#1A5F7A' : 'white',
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 60px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4, lineHeight: 1.4 }}>
            {selectedArticle.title}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            {selectedArticle.subtitle}
          </div>
          <div style={{ fontSize }}>
            <MarkdownRenderer content={selectedArticle.content} />
          </div>
          <div style={{
            background: 'rgba(27,122,74,0.06)', border: '1px dashed rgba(27,122,74,0.4)',
            borderRadius: 14, padding: 14, marginTop: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: 'var(--green, #1B7A4A)' }}>ن</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green, #1B7A4A)' }}>NUR কে জিজ্ঞেস করো</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>আরো গভীরে যেতে চাও?</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: isDark ? '#1A1D27' : 'linear-gradient(135deg, #1A1A2E, #1A3A4A)',
        padding: '52px 20px 20px', color: 'white',
      }}>
        <BackButton onClick={onBack} variant="light" style={{ marginBottom: 14 }} />
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🔬 গবেষণা কেন্দ্র</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>কুরআন ও হাদিস — বিজ্ঞান, অর্থ, সমাজ, দর্শন</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 16 }}>
        {researchCategories.map(cat => (
          <div key={cat.id} onClick={() => setActiveId(cat.id)} style={{
            background: activeId === cat.id ? 'var(--accent)' : 'var(--card)',
            border: `1px solid ${activeId === cat.id ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 16, padding: '16px 10px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(26,95,122,0.06)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: activeId === cat.id ? 'white' : 'var(--text)' }}>
              {cat.name}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px 80px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1A5F7A, #1B7A4A)',
          borderRadius: 16, padding: 18, marginBottom: 12, color: 'white',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>✨ মূল আয়াত</div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 20, textAlign: 'right', direction: 'rtl', lineHeight: 1.7, marginBottom: 8 }}>
            {activeCat.featuredAyah.arabic}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 6 }}>{activeCat.featuredAyah.bangla}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>{activeCat.featuredAyah.ref} • Ibn Kathir</div>
        </div>

        {articleLoading ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>লোড হচ্ছে...</div>
        ) : articles.length > 0 ? (
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
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeCat.topics.map((topic, i) => (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 14,
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 2px 8px rgba(26,95,122,0.04)',
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
        )}

        <div style={{
          background: 'rgba(27,122,74,0.06)', border: '1px dashed rgba(27,122,74,0.3)',
          borderRadius: 14, padding: 14, marginTop: 14,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: 'var(--green, #1B7A4A)' }}>ن</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green, #1B7A4A)' }}>NUR কে জিজ্ঞেস করো</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>এই বিষয়ে আরো গভীরে যেতে চাও?</div>
          </div>
        </div>
      </div>
    </div>
  );
}