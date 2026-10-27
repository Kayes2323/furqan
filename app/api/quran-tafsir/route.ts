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
    return NextResponse.json({ ok: true, data: tafsir });
  } catch (err) {
    if (err instanceof QuranFoundationNotConfiguredError) {
      return NextResponse.json({ ok: false, reason: 'not_configured' });
    }
    console.error(err);
    const status = err instanceof QuranFoundationUpstreamError ? err.status : 500;
    return NextResponse.json({ ok: false, reason: 'upstream_error' }, { status: status >= 400 && status < 600 ? 502 : 500 });
  }
}
