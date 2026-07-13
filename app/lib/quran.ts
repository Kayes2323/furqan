const BASE = 'https://api.alquran.cloud/v1';

export async function getSurahList() {
  const res = await fetch(`${BASE}/surah`, { next: { revalidate: 86400 } });
  const data = await res.json();
  return data.data;
}

export async function getSurah(number: number) {
  const [arabic, bangla] = await Promise.all([
    fetch(`${BASE}/surah/${number}/quran-uthmani`, { next: { revalidate: 86400 } }).then(r => r.json()),
    fetch(`${BASE}/surah/${number}/bn.bengali`, { next: { revalidate: 86400 } }).then(r => r.json()),
  ]);
  return {
    info: arabic.data,
    ayahs: arabic.data.ayahs.map((a: { numberInSurah: number; text: string }, i: number) => ({
      number: a.numberInSurah,
      arabic: a.text,
      bangla: bangla.data.ayahs[i]?.text || '',
    })),
  };
}

export async function getDailyAyah() {
  // Fixed daily ayah — Surah Muhammad 47:24 (the Tadabbur ayah)
  const res = await fetch(`${BASE}/ayah/47:24/editions/quran-uthmani,bn.bengali`, {
    next: { revalidate: 3600 }
  });
  const data = await res.json();
  return {
    arabic: data.data[0]?.text || '',
    bangla: data.data[1]?.text || '',
    ref: 'সূরা মুহাম্মদ ৪৭:২৪',
  };
}
