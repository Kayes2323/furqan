import { NextResponse } from 'next/server';
import { debugListResources, isQuranFoundationConfigured } from '../../lib/server/quran-foundation';

// Temporary, one-time diagnostic route — returns only resource metadata
// (id/name/slug/language), never any copyrighted Quran text — used to
// confirm the live Quran Foundation catalog shape while a fresh API
// credential was being wired up. Remove once the Bengali resource IDs
// are confirmed and pinned.
export async function GET() {
  if (!isQuranFoundationConfigured()) {
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }
  try {
    const { translations, tafsirs } = await debugListResources();
    const bn = (list: typeof translations) => list.filter((r) => {
      const lang = (r.language_name ?? '').toLowerCase();
      return lang === 'bengali' || lang === 'bangla' || lang === 'bn';
    });
    return NextResponse.json({
      ok: true,
      allTranslationsCount: translations.length,
      allTafsirsCount: tafsirs.length,
      bengaliTranslations: bn(translations),
      bengaliTafsirs: bn(tafsirs),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: 'upstream_error', message: String(err) }, { status: 502 });
  }
}
