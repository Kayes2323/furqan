'use client';
import { useState, useEffect } from 'react';

const SURAHS = [
  { n: 1, ar: 'الفاتحة', bn: 'আল-ফাতিহা', ayahs: 7, type: 'মক্কি' },
  { n: 2, ar: 'البقرة', bn: 'আল-বাকারা', ayahs: 286, type: 'মাদানি' },
  { n: 3, ar: 'آل عمران', bn: 'আলে-ইমরান', ayahs: 200, type: 'মাদানি' },
  { n: 4, ar: 'النساء', bn: 'আন-নিসা', ayahs: 176, type: 'মাদানি' },
  { n: 5, ar: 'المائدة', bn: 'আল-মায়িদাহ', ayahs: 120, type: 'মাদানি' },
  { n: 12, ar: 'يوسف', bn: 'ইউসুফ', ayahs: 111, type: 'মক্কি' },
  { n: 18, ar: 'الكهف', bn: 'আল-কাহফ', ayahs: 110, type: 'মক্কি' },
  { n: 36, ar: 'يس', bn: 'ইয়া-সিন', ayahs: 83, type: 'মক্কি' },
  { n: 55, ar: 'الرحمن', bn: 'আর-রহমান', ayahs: 78, type: 'মাদানি' },
  { n: 67, ar: 'الملك', bn: 'আল-মুলক', ayahs: 30, type: 'মক্কি' },
  { n: 112, ar: 'الإخلاص', bn: 'আল-ইখলাস', ayahs: 4, type: 'মক্কি' },
];

const FATIHA_AYAHS = [
  { n: 1, ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', bn: 'আল্লাহর নামে শুরু করছি, যিনি অত্যন্ত দয়ালু, পরম করুণাময়।', tafsir: 'বিসমিল্লাহ দিয়ে শুরু করা মানে আল্লাহর সাহায্য ও বরকত চাওয়া। রহমান মানে সকলের জন্য দয়া — মুসলিম-অমুসলিম সকলে। রহিম মানে মুমিনদের জন্য বিশেষ রহমত যা আখিরাতেও থাকবে।' },
  { n: 2, ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', bn: 'সকল প্রশংসা আল্লাহর জন্য, যিনি সকল জগতের প্রতিপালক।', tafsir: '"আলামিন" মানে শুধু মানুষ নয় — জিন, ফেরেশতা, পশু, গাছপালা সবকিছু। আল্লাহ সব কিছুর রব। হামদ মানে শুধু ধন্যবাদ নয় — ভালোবাসা ও সম্মানসহ প্রশংসা।' },
  { n: 3, ar: 'الرَّحْمَٰنِ الرَّحِيمِ', bn: 'যিনি পরম করুণাময়, অত্যন্ত দয়ালু।', tafsir: 'একই দুটি গুণ আবার উল্লেখ — কারণ আল্লাহ চান মানুষ যেন তাঁর রহমতের কথা মনে রাখে। দুনিয়ায় সকলের জন্য, আখিরাতে শুধু মুমিনদের জন্য।' },
  { n: 4, ar: 'مَالِكِ يَوْمِ الدِّينِ', bn: 'বিচার দিনের মালিক।', tafsir: 'কিয়ামতের দিন সব ক্ষমতা শুধু আল্লাহর। কোনো রাজা, নেতা, পীর — কেউ কারো কাজে আসবে না। এই আয়াত মানুষকে শুধু আল্লাহর কাছেই সাহায্য চাইতে শেখায়।' },
  { n: 5, ar: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', bn: 'আমরা শুধু তোমারই ইবাদত করি এবং শুধু তোমার কাছেই সাহায্য চাই।', tafsir: 'এটা কুরআনের সবচেয়ে গুরুত্বপূর্ণ ঘোষণা। "শুধু তোমার" — অন্য কারো কাছে নয়। এখানে বান্দা ও আল্লাহর সম্পর্ক চুক্তি হয়।' },
  { n: 6, ar: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', bn: 'আমাদের সঠিক পথ দেখাও।', tafsir: 'এই দোয়া দিনে ১৭ বার পড়া হয়। মানুষ সবচেয়ে বেশি কী চায়? সঠিক পথ। জ্ঞান, সম্পদ নয় — সঠিক পথ। কারণ সঠিক পথে থাকলে সব পাওয়া যায়।' },
  { n: 7, ar: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', bn: 'তাদের পথ, যাদের তুমি নেয়ামত দিয়েছো। তাদের নয় যাদের উপর গজব নাজিল হয়েছে এবং যারা পথভ্রষ্ট।', tafsir: 'নেয়ামতপ্রাপ্তরা হলেন নবী, সিদ্দিক, শহিদ ও সৎ মানুষ। গজবপ্রাপ্তরা জেনেশুনে পথ ছেড়েছে। পথভ্রষ্টরা না জেনে ভুল পথে আছে।' },
];

export default function TafsirScreen() {
  const [level, setLevel] = useState<'list' | 'surah'>('list');
  const [selected, setSelected] = useState<typeof SURAHS[0] | null>(null);
  const [openTafsir, setOpenTafsir] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = SURAHS.filter(s =>
    s.bn.includes(search) || s.ar.includes(search) || String(s.n).includes(search)
  );

  if (level === 'surah' && selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Surah header */}
        <div style={{
          background: 'linear-gradient(135deg, #1A3A4A, #1A5F7A)',
          padding: '52px 20px 20px',
          color: 'white', flexShrink: 0,
        }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>সূরা নং {selected.n} • {selected.type}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{selected.bn}</div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, marginTop: 6, textAlign: 'right', direction: 'rtl', lineHeight: 1.6 }}>{selected.ar}</div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 16 }}>
          <button onClick={() => setLevel('list')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--accent)', fontWeight: 600,
            margin: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
          }}>← সূরা তালিকায় ফিরে যাও</button>

          {/* Overview */}
          <div style={{
            background: 'var(--card)', margin: '0 16px 12px',
            borderRadius: 14, padding: 14,
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(26,95,122,0.06)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>📋 সূরার পরিচয়</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {selected.n === 1 && 'এই সূরা কুরআনের উদ্বোধন। প্রতিটি নামাজে সাতবার পড়া ফরজ। এটি দোয়া ও কৃতজ্ঞতার সমন্বয় — বান্দা আল্লাহর কাছে সঠিক পথ চাইছে।'}
              {selected.n !== 1 && `সূরা ${selected.bn} — ${selected.ayahs}টি আয়াত। ${selected.type === 'মক্কি' ? 'মক্কায় নাজিল — আকিদা ও বিশ্বাস কেন্দ্রিক।' : 'মদিনায় নাজিল — সমাজ ও আইন কেন্দ্রিক।'}`}
            </div>
          </div>

          {/* Ayahs */}
          {(selected.n === 1 ? FATIHA_AYAHS : []).map(ayah => (
            <div key={ayah.n} style={{
              background: 'var(--card)', margin: '0 16px 10px',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(26,95,122,0.06)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                আয়াত {ayah.n}
              </div>
              <div style={{
                background: '#F0F8FF', padding: 16,
                fontFamily: 'Amiri, serif', fontSize: 24,
                textAlign: 'right', direction: 'rtl', lineHeight: 1.8,
                borderBottom: '1px solid var(--border)',
              }}>{ayah.ar}</div>
              <div style={{ padding: '12px 16px', fontSize: 14, lineHeight: 1.7, borderBottom: '1px solid var(--border)' }}>
                {ayah.bn}
              </div>
              <div
                onClick={() => setOpenTafsir(openTafsir === ayah.n ? null : ayah.n)}
                style={{
                  padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                  cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                }}
              >
                <span>📚 Ibn Kathir তাফসির দেখো</span>
                <span>{openTafsir === ayah.n ? '▲' : '▼'}</span>
              </div>
              {openTafsir === ayah.n && (
                <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--border)' }}>
                  {ayah.tafsir}
                  <div style={{ marginTop: 8 }}>
                    <span style={{ background: 'rgba(26,95,122,0.08)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginRight: 6 }}>📖 Ibn Kathir</span>
                    <span style={{ background: 'rgba(26,95,122,0.08)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>১:{ayah.n}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {selected.n !== 1 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
              এই সূরার তাফসির শীঘ্রই আসছে...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        padding: '52px 20px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>📖 তাফসির</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>১১৪টি সূরা — Ibn Kathir অনুসরণে</div>
      </div>

      {/* Search */}
      <div style={{
        margin: '12px 16px',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 2px 8px rgba(26,95,122,0.06)',
      }}>
        <span>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="সূরা খুঁজুন..."
          style={{
            border: 'none', background: 'none', outline: 'none',
            fontFamily: 'Hind Siliguri, sans-serif', fontSize: 14,
            color: 'var(--text)', flex: 1,
          }}
        />
      </div>

      {/* Surah list */}
      <div style={{ padding: '0 16px 16px' }}>
        {filtered.map(s => (
          <div key={s.n} onClick={() => { setSelected(s); setLevel('surah'); }} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,95,122,0.06)',
            transition: 'all 0.2s',
          }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent), #2A7F9A)',
              color: 'white', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>{s.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.bn}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.ayahs} আয়াত • {s.type}</div>
            </div>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: 20, color: 'var(--accent)' }}>{s.ar}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
