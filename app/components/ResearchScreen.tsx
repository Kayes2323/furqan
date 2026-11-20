'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTheme } from '../lib/theme';
import BackButton from './BackButton';
import MarkdownRenderer from './MarkdownRenderer';
import { researchCategories } from '../lib/research-data';
import { getArticleAudio, isAnyAudioAvailable } from '../lib/research-audio-data';
import ResearchAudioPlayer from './ResearchAudioPlayer';
import { setPendingNurQuery } from '../lib/nur-handoff';
import { toBnDigits } from '../lib/bn-digits';
import {
  getRead,
  saveRead,
  markArticleRead,
  isArticleRead,
  readCountOf,
  getResearchLastRead,
  saveResearchLastRead,
  type ResearchReadMap,
} from '../lib/research-progress';

interface Props {
  onBack: () => void;
  /** Category to open on, when arriving from a direct link (e.g. a home-screen
   *  topic chip). Falls back to the first category. */
  initialCategoryId?: string;
  /** Opens the NUR screen. A query is handed off via setPendingNurQuery first,
   *  so NUR auto-asks about the article the user was reading. */
  onAskNur?: () => void;
}

interface Article {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  content: string;
}

/** A search hit, carrying the category it belongs to so a cross-category
 *  result list can show where each article lives. */
interface Hit {
  categoryId: string;
  article: Article;
}

function categoryOf(id: string) {
  return researchCategories.find((c) => c.id === id) || researchCategories[0];
}

export default function ResearchScreen({ onBack, initialCategoryId, onAskNur }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeId, setActiveId] = useState(
    initialCategoryId && researchCategories.some((c) => c.id === initialCategoryId)
      ? initialCategoryId
      : researchCategories[0].id,
  );
  // Articles per category, kept so switching back to a category is instant
  // instead of re-hitting Firestore every time.
  const [byCategory, setByCategory] = useState<Record<string, Article[]>>({});
  const [selected, setSelected] = useState<Hit | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [read, setRead] = useState<ResearchReadMap>({});
  const [lastRead, setLastRead] = useState(() => null as ReturnType<typeof getResearchLastRead>);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCat = categoryOf(activeId);
  const articles = byCategory[activeId] || [];
  // Derived rather than stored: a category is "loading" exactly while it has
  // no cache entry. A failed load writes [] into the cache, so this ends on
  // both success and failure without a second piece of state to keep in sync.
  const articleLoading = byCategory[activeId] === undefined;

  // Progress lives in localStorage, so it can only be read on the client.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- reading saved
       progress on mount is the intended pattern here (matches HomeScreen) */
    setRead(getRead());
    setLastRead(getResearchLastRead());
  }, []);

  const loadCategory = useCallback(async (catId: string): Promise<Article[]> => {
    const snap = await getDocs(collection(db, 'research', catId, 'articles'));
    const arts: Article[] = [];
    snap.forEach((d) => arts.push({ id: d.id, ...d.data() } as Article));
    arts.sort((a, b) => a.order - b.order);
    return arts;
  }, []);

  useEffect(() => {
    if (byCategory[activeId]) return; // already cached
    let cancelled = false;
    loadCategory(activeId)
      .then((arts) => {
        if (!cancelled) setByCategory((prev) => ({ ...prev, [activeId]: arts }));
      })
      .catch((e) => {
        console.error(e);
        // Cache the empty result too, so the screen stops showing "loading"
        // and the curated topic outline takes over.
        if (!cancelled) setByCategory((prev) => ({ ...prev, [activeId]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [activeId, byCategory, loadCategory]);

  // Searching spans every category, so the first search warms the ones not
  // yet loaded. Failures are tolerated per category: a category that cannot
  // load simply contributes no hits rather than failing the whole search.
  async function warmAllCategories() {
    const missing = researchCategories.filter((c) => !byCategory[c.id]);
    if (missing.length === 0) return;
    setSearching(true);
    const results = await Promise.all(
      missing.map(async (c) => {
        try {
          return [c.id, await loadCategory(c.id)] as const;
        } catch (e) {
          console.error(e);
          return [c.id, [] as Article[]] as const;
        }
      }),
    );
    setByCategory((prev) => {
      const next = { ...prev };
      for (const [id, arts] of results) next[id] = arts;
      return next;
    });
    setSearching(false);
  }

  const trimmedQuery = query.trim();

  const hits = useMemo<Hit[]>(() => {
    if (!trimmedQuery) return [];
    const needle = trimmedQuery.toLowerCase();
    const out: Hit[] = [];
    for (const cat of researchCategories) {
      for (const a of byCategory[cat.id] || []) {
        const haystack = `${a.title} ${a.subtitle}`.toLowerCase();
        if (haystack.includes(needle)) out.push({ categoryId: cat.id, article: a });
      }
    }
    return out;
  }, [trimmedQuery, byCategory]);

  function openArticle(categoryId: string, article: Article) {
    setSelected({ categoryId, article });
    // Opening an article counts as reading it: this app has no reliable
    // "reached the end" signal on a Markdown body of arbitrary length, and a
    // checkmark that never appears is worse than one that appears early.
    const next = markArticleRead(read, categoryId, article.id);
    setRead(next);
    saveRead(next);
    const entry = { categoryId, articleId: article.id, title: article.title, at: new Date().toISOString() };
    saveResearchLastRead(entry);
    setLastRead(entry);
    scrollRef.current?.scrollTo({ top: 0 });
  }

  function askNurAbout(text: string) {
    if (!onAskNur) return;
    setPendingNurQuery({ text });
    onAskNur();
  }

  /** The category's articles from cache, fetching and caching them if this is
   *  the first time. Returns [] if the fetch fails. */
  async function articlesOf(categoryId: string): Promise<Article[]> {
    const cached = byCategory[categoryId];
    if (cached) return cached;
    try {
      const fetched = await loadCategory(categoryId);
      setByCategory((prev) => ({ ...prev, [categoryId]: fetched }));
      return fetched;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  // Jump straight into the article the user last had open.
  async function continueLastRead() {
    if (!lastRead) return;
    setQuery('');
    setActiveId(lastRead.categoryId);
    const arts = await articlesOf(lastRead.categoryId);
    const found = arts.find((a) => a.id === lastRead.articleId);
    // If the article is gone from the dataset, land on its category rather
    // than opening nothing and looking broken.
    if (found) openArticle(lastRead.categoryId, found);
  }

  // ── article view ──────────────────────────────────────────────────────
  if (selected) {
    const { categoryId, article } = selected;
    const cat = categoryOf(categoryId);
    const audio = getArticleAudio(categoryId, article.id);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <div
          style={{
            background: isDark ? '#1A1D27' : '#1A5F7A',
            padding: '44px 16px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <BackButton onClick={() => setSelected(null)} variant="light" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {article.title}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
              {cat.icon} {cat.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[12, 14, 16, 18].map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                aria-label={`লেখার আকার ${s}`}
                aria-pressed={fontSize === s}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  border: 'none',
                  background: fontSize === s ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                  color: fontSize === s ? '#1A5F7A' : 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 60px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4, lineHeight: 1.4 }}>
            {article.title}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>{article.subtitle}</div>
          {audio && audio.chunks.length > 0 && (
            <div style={{ margin: '0 -18px 20px' }}>
              <ResearchAudioPlayer article={audio} categoryLabel={cat.name} />
            </div>
          )}
          <div style={{ fontSize }}>
            <MarkdownRenderer content={article.content} />
          </div>

          {onAskNur && (
            <button
              onClick={() => askNurAbout(`"${article.title}" — ${article.subtitle}. এই বিষয়ে আরো বিস্তারিত বুঝিয়ে বলো।`)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'rgba(27,122,74,0.06)',
                border: '1px dashed rgba(27,122,74,0.4)',
                borderRadius: 14,
                padding: 14,
                marginTop: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: 'var(--green, #1B7A4A)' }}>ن</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green, #1B7A4A)' }}>
                  NUR কে জিজ্ঞেস করো
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  এই প্রবন্ধ নিয়ে আরো গভীরে যেতে চাও?
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── list view ─────────────────────────────────────────────────────────
  const totalArticles = researchCategories.reduce((n, c) => n + (byCategory[c.id]?.length || 0), 0);
  const totalRead = researchCategories.reduce(
    (n, c) => n + readCountOf(read, c.id, (byCategory[c.id] || []).map((a) => a.id)),
    0,
  );

  const articleRow = (categoryId: string, article: Article, index: number, showCategory: boolean) => {
    const done = isArticleRead(read, categoryId, article.id);
    const hasAudio = isAnyAudioAvailable(categoryId, article.id);
    const cat = categoryOf(categoryId);
    return (
      <button
        key={`${categoryId}:${article.id}`}
        onClick={() => openArticle(categoryId, article)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'var(--card)',
          border: `1px solid ${done ? 'rgba(27,122,74,0.35)' : 'var(--border)'}`,
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(26,95,122,0.04)',
          font: 'inherit',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: done ? 'linear-gradient(135deg, #1B7A4A, #2FA06B)' : 'linear-gradient(135deg, var(--accent), #2A7F9A)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: done ? 15 : 13,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}
        >
          {done ? '✓' : toBnDigits(index + 1)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{article.title}</div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {showCategory && (
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {cat.icon} {cat.name}
              </span>
            )}
            <span>{article.subtitle}</span>
          </div>
        </div>
        {hasAudio && (
          <span
            title="বাংলা অডিও আছে"
            aria-label="বাংলা অডিও আছে"
            style={{
              fontSize: 11,
              flexShrink: 0,
              background: 'rgba(26,95,122,0.08)',
              color: 'var(--accent)',
              borderRadius: 10,
              padding: '3px 7px',
            }}
          >
            🎧
          </span>
        )}
        <div style={{ color: 'var(--text-light)', fontSize: 18, flexShrink: 0 }}>›</div>
      </button>
    );
  };

  return (
    <div>
      <div
        style={{
          background: isDark ? '#1A1D27' : 'linear-gradient(135deg, #1A1A2E, #1A3A4A)',
          padding: '52px 20px 20px',
          color: 'white',
        }}
      >
        <BackButton onClick={onBack} variant="light" style={{ marginBottom: 14 }} />
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🔬 গবেষণা কেন্দ্র</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>কুরআন ও হাদিস — বিজ্ঞান, অর্থ, সমাজ, দর্শন</div>
        {totalArticles > 0 && (
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
            {totalRead > 0 ? `${toBnDigits(totalRead)}টি প্রবন্ধ পড়া হয়েছে` : 'এখনো কোনো প্রবন্ধ পড়া হয়নি'}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={warmAllCategories}
          placeholder="সব ক্যাটাগরিতে প্রবন্ধ খুঁজুন…"
          aria-label="প্রবন্ধ খুঁজুন"
          style={{
            width: '100%',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '11px 14px',
            fontSize: 13,
            color: 'var(--text)',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </div>

      {trimmedQuery ? (
        <div style={{ padding: '14px 16px 80px' }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {searching ? 'খোঁজা হচ্ছে…' : `${toBnDigits(hits.length)}টি প্রবন্ধ পাওয়া গেছে`}
            </span>
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              মুছে ফেলুন
            </button>
          </div>
          {hits.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hits.map((h, i) => articleRow(h.categoryId, h.article, i, true))}
            </div>
          ) : (
            !searching && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                এই নামে কোনো প্রবন্ধ নেই।
              </div>
            )
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 16 }}>
            {researchCategories.map((cat) => {
              const arts = byCategory[cat.id];
              const done = arts ? readCountOf(read, cat.id, arts.map((a) => a.id)) : 0;
              const active = activeId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  aria-pressed={active}
                  style={{
                    background: active ? 'var(--accent)' : 'var(--card)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 16,
                    padding: '16px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(26,95,122,0.06)',
                    font: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: active ? 'white' : 'var(--text)' }}>
                    {cat.name}
                  </div>
                  {arts && arts.length > 0 && (
                    <div
                      style={{
                        fontSize: 9,
                        marginTop: 4,
                        color: active ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
                      }}
                    >
                      {toBnDigits(done)}/{toBnDigits(arts.length)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ padding: '0 16px 80px' }}>
            {lastRead && (
              <button
                onClick={continueLastRead}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--card)',
                  border: '1px solid rgba(27,122,74,0.35)',
                  borderRadius: 16,
                  padding: '13px 16px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <div style={{ fontSize: 20 }}>📖</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'var(--green, #1B7A4A)' }}>
                    পড়া চালিয়ে যান
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text)',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {lastRead.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    {categoryOf(lastRead.categoryId).icon} {categoryOf(lastRead.categoryId).name}
                  </div>
                </div>
                <div style={{ color: 'var(--text-light)', fontSize: 18 }}>›</div>
              </button>
            )}

            <div
              style={{
                background: 'linear-gradient(135deg, #1A5F7A, #1B7A4A)',
                borderRadius: 16,
                padding: 18,
                marginBottom: 12,
                color: 'white',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>
                ✨ মূল আয়াত
              </div>
              <div
                style={{
                  fontFamily: 'Amiri, serif',
                  fontSize: 20,
                  textAlign: 'right',
                  direction: 'rtl',
                  lineHeight: 1.7,
                  marginBottom: 8,
                }}
              >
                {activeCat.featuredAyah.arabic}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 6 }}>
                {activeCat.featuredAyah.bangla}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{activeCat.featuredAyah.ref} • Ibn Kathir</div>
            </div>

            {articleLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                লোড হচ্ছে...
              </div>
            ) : articles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {articles.map((article, i) => articleRow(activeId, article, i, false))}
              </div>
            ) : (
              // No articles in Firestore for this category yet — show the
              // curated topic outline so the category isn't simply blank.
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  এই ক্যাটাগরির প্রবন্ধ এখনো আসেনি — যে বিষয়গুলো আসছে:
                </div>
                {activeCat.topics.map((topic, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: '0 2px 8px rgba(26,95,122,0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        background: 'rgba(26,95,122,0.1)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        flexShrink: 0,
                      }}
                    >
                      {toBnDigits(i + 1)}
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{topic.title}</div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        background: 'rgba(26,95,122,0.06)',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {topic.ref}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {onAskNur && (
              <button
                onClick={() => askNurAbout(`ইসলাম ও ${activeCat.name} নিয়ে কুরআন-হাদিস কী বলে?`)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'rgba(27,122,74,0.06)',
                  border: '1px dashed rgba(27,122,74,0.3)',
                  borderRadius: 14,
                  padding: 14,
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: 'var(--green, #1B7A4A)' }}>ن</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green, #1B7A4A)' }}>
                    NUR কে জিজ্ঞেস করো
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {activeCat.name} নিয়ে আরো গভীরে যেতে চাও?
                  </div>
                </div>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
