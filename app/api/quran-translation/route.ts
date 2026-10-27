import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSurahTranslations,
  isQuranFoundationConfigured,
  QuranFoundationNotConfiguredError,
  QuranFoundationUpstreamError,
} from '../../lib/server/quran-foundation';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const surah = Number(req.nextUrl.searchParams.get('surah'));
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
  }

  if (!isQuranFoundationConfigured()) {
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }

  try {
    const results = await fetchSurahTranslations(surah);
    return NextResponse.json({ ok: true, data: results });
  } catch (err) {
    if (err instanceof QuranFoundationNotConfiguredError) {
      return NextResponse.json({ ok: false, reason: 'not_configured' });
    }
    console.error(err);
    const status = err instanceof QuranFoundationUpstreamError ? err.status : 500;
    return NextResponse.json({ ok: false, reason: 'upstream_error' }, { status: status >= 400 && status < 600 ? 502 : 500 });
  }
}
