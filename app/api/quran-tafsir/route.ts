import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAyahTafsir,
  isQuranFoundationConfigured,
  QuranFoundationNotConfiguredError,
  QuranFoundationUpstreamError,
} from '../../lib/server/quran-foundation';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const surah = Number(req.nextUrl.searchParams.get('surah'));
  const ayah = Number(req.nextUrl.searchParams.get('ayah'));
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1) {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
  }

  if (!isQuranFoundationConfigured()) {
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }

  try {
    const tafsir = await fetchAyahTafsir(surah, ayah);
    if (!tafsir) {
      return NextResponse.json({ ok: false, reason: 'not_found' });
    }
    // Tafsir text for a given ayah/resource never changes, so a long-lived
    // CDN cache (ordinary display/runtime caching — see TAFSIR-SOURCES.md)
    // makes every visit after the first one instant.
    return NextResponse.json(
      { ok: true, data: tafsir },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
    );
  } catch (err) {
    if (err instanceof QuranFoundationNotConfiguredError) {
      return NextResponse.json({ ok: false, reason: 'not_configured' });
    }
    // See the matching comment in /api/quran-translation/route.ts — a 404
    // here means this surah's verse content isn't in the current API tier.
    if (err instanceof QuranFoundationUpstreamError && err.status === 404) {
      return NextResponse.json({ ok: false, reason: 'content_unavailable' });
    }
    console.error(err);
    const status = err instanceof QuranFoundationUpstreamError ? err.status : 500;
    return NextResponse.json({ ok: false, reason: 'upstream_error' }, { status: status >= 400 && status < 600 ? 502 : 500 });
  }
}
