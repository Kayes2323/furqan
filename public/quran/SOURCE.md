# Source and integrity of this dataset

**Arabic text**: Tanzil Project, Uthmani script (as in the Medina Mushaf),
Version 1.1 (published February 2021). Fetched 2026-10-22 directly from
Tanzil's own download endpoint:

```
https://tanzil.net/pub/download/index.php?marks=true&sajdah=true&tatweel=true&quranType=uthmani&outType=txt-2&agree=true
```

License: Creative Commons Attribution 3.0 — see `TANZIL-LICENSE.txt` in
this directory for the full, required copyright notice (verbatim, as
shipped inside the downloaded file itself). Per Tanzil's terms, this
text has not been changed in any way; only reformatted from
`surah|ayah|text` lines into the per-surah JSON files in `surah/`.

**Surah metadata** (Arabic/transliterated/English names, ayah counts,
revelation type/order): Tanzil's own metadata file,
`https://tanzil.net/res/text/metadata/quran-data.xml` (Tanzil
Metadata, CC-BY), fetched the same day. Its per-surah ayah counts were
cross-checked against the text file's actual per-surah line counts —
all 114 match exactly.

**Bengali surah names** (`banglaName` in `meta.json`) are a
localization label added for this app's UI, not part of the Tanzil
source and not Quran text — standard Bengali transliterations
consistent with the names already used elsewhere in this app
(`app/components/TafsirScreen.tsx`).

## Integrity

- 114 surahs, numbered 1–114, no gaps or duplicates.
- 6,236 total ayat — matches the standard well-known per-surah ayah
  counts for this numbering convention, cross-checked independently
  against both the Tanzil metadata file and the raw text file's own
  per-surah line counts.
- Every surah's ayah numbers are sequential from 1 with no gaps,
  duplicates, or reordering.
- Spot-checked against well-known verses (Al-Fatiha 1:1, Ayat al-Kursi
  2:255, the Bismillah-less first ayah of At-Tawbah 9:1, Al-Ikhlas
  112:1–4, the final ayah of the Quran 114:6).
- SHA-256 of the verbatim `surah|ayah|text` stream, as received from
  Tanzil before any reformatting, for future re-verification against
  a fresh download:
  `9017fffbd70a592438733b748f9704b30b26f091deb6e4828c2c71d82c4c5b3a`

All of the above is also enforced by an automated regression test:
`app/lib/quran-dataset.test.ts` (run via `npm test`).

## Regenerating this dataset

The build script used to produce `meta.json`, `surah/*.json`,
`search-index.json`, and `TANZIL-LICENSE.txt` from the raw Tanzil
download was a one-off script (not checked into this repository). To
regenerate: download the same URL above, parse `surah|ayah|text`
lines, cross-reference against `quran-data.xml` for metadata, and
re-run `app/lib/quran-dataset.test.ts` to confirm the result still
passes every check before replacing these files.
