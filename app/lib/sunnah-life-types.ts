// ═══════════════════════════════════════════
// FURQAN — Sunnah Life: data model
//
// Two connected navigation surfaces (Today's Routine, Learn by Life Area)
// share ONE practice record per practice ID — `SunnahPractice` below — so
// the same practice always opens the same detail card and the same
// tracking state, however the user reached it.
//
// This file defines the mandatory "religious evidence gate": every
// published practice carries structured source/classification/review
// metadata. A practice is never treated as verified religious guidance
// unless its `review.status` is explicitly 'approved' with a reviewer
// identity and date attached — see sunnah-life-engine.ts's
// `isPublishableAsVerified()` and the enforcing test in
// sunnah-life-engine.test.ts. See docs/sunnah-life-sources.md for why
// every entry currently shipped is 'pending_review', not 'approved'.
// ═══════════════════════════════════════════

/** Where a routine item sits in the user's day. Purely an organizational
 *  label for Today's Routine — NOT a claim that Islam prescribes exactly
 *  these slots, this order, or a specific time within each slot. */
export type RoutineSlot =
  | 'waking'
  | 'cleanliness-dressing'
  | 'fajr-morning'
  | 'morning-adhkar-quran'
  | 'work-family-manners'
  | 'daily-prayers'
  | 'evening-adhkar'
  | 'isha-night'
  | 'before-sleep';

/** The 9 Learn-by-Life-Area categories, adapted from The Ideal Muslim's
 *  chapter structure as a navigation framework only (see
 *  docs/sunnah-life-content-map.md). Labels are written to be read by
 *  anyone — a practice is never gated behind "do you have a spouse/
 *  children", it is simply informational content under that heading. */
export type LifeArea =
  | 'relationship-with-allah'
  | 'relationship-with-self'
  | 'parents'
  | 'marriage-and-spouse'
  | 'children-and-parenting'
  | 'relatives-and-kinship'
  | 'neighbours'
  | 'friends-and-community'
  | 'society-and-social-responsibility';

/** What kind of claim backs a practice. 'general_habit' is the honest
 *  label for an ordinary beneficial habit that is NOT a religious
 *  practice — it must never be mislabeled as Sunnah. */
export type SourceType = 'quran' | 'hadith' | 'scholarly_reference' | 'general_habit';

/** Fiqh classification. Deliberately not a single flat "Sunnah" bucket —
 *  the task requires distinguishing obligatory worship from wajib,
 *  emphasized Sunnah, other recommended worship, nafl, adab, and plain
 *  habits, and allows genuine scholarly disagreement via
 *  `classificationNotes` rather than forcing one universal answer. */
export type PracticeClassification =
  | 'obligatory'
  | 'wajib'
  | 'emphasized_sunnah'
  | 'sunnah'
  | 'nafl'
  | 'adab'
  | 'general_habit';

export type ReviewStatus = 'pending_review' | 'approved' | 'needs_correction';

export interface SourceReference {
  /** e.g. "Sahih al-Bukhari", "Sahih Muslim", "Qur'an", "Hisnul Muslim
   *  (secondary compilation)". Free text — never a fabricated specific
   *  collection name. */
  collection?: string;
  /** e.g. "Book of Manners", "chapter on kindness to parents". */
  bookOrChapter?: string;
  /** A specific hadith/ayah identifier, ONLY when confirmed — otherwise
   *  leave undefined and set identifierConfirmed: false, with a free-text
   *  note in `identifierNote` instead of guessing a number. */
  identifier?: string;
  identifierConfirmed: boolean;
  identifierNote?: string;
  /** A resolvable URL to the source, if one exists. Never fabricated. */
  url?: string;
}

export interface GradingInfo {
  /** e.g. "Sahih", "Hasan" — only set when a specific scholar/source has
   *  actually graded this specific hadith AND that grading is confirmed.
   *  Otherwise leave undefined and rely on `confirmed: false`. */
  label?: string;
  gradingAuthority?: string;
  confirmed: boolean;
}

export interface ReviewRecord {
  status: ReviewStatus;
  /** Required before status can ever be 'approved' — enforced by
   *  isPublishableAsVerified() and the engine test. */
  reviewerName?: string;
  reviewerRole?: string;
  reviewDate?: string; // ISO date
  editorialNotes?: string;
  /** Human-readable change log, oldest first. Never silently rewritten. */
  versionHistory: string[];
}

export interface LicensingInfo {
  /** Set only when a practice's display text is near enough to a
   *  copyrighted translation that permission matters. Left undefined for
   *  product-authored summaries (the default — see docs/sunnah-life-sources.md). */
  requiresPermission: boolean;
  notes?: string;
}

export interface SunnahPractice {
  id: string;
  /** Increment whenever displayed title/instructions/classification
   *  materially change, so historical tracking records can snapshot
   *  which version they were recorded against (mirrors
   *  zikr-tracker's nameSnapshot/targetSnapshot pattern). */
  contentVersion: number;

  titleBn: string;
  /** Short, product-authored instructions — never a copied book
   *  paragraph. See docs/sunnah-life-sources.md §2. */
  instructionsBn: string;

  /** Only for short, well-attested Arabic (e.g. "بِسْمِ اللَّهِ") — never a
   *  full invented translation of a long passage. */
  arabicOriginal?: string;
  transliterationBn?: string;
  /** Only set when a verified Bengali meaning is available/permitted to
   *  show — otherwise left undefined rather than guessed. */
  meaningBn?: string;

  sourceType: SourceType;
  sourceReference: SourceReference;
  grading?: GradingInfo;

  classification: PracticeClassification;
  /** Free text for genuine scholarly disagreement, e.g. "some scholars
   *  consider this wajib; the majority view holds it as emphasized
   *  sunnah." Left empty when there is no notable disagreement. */
  classificationNotes?: string;

  /** Whether a specific count/time/virtue claim is directly evidenced by
   *  the cited source — NOT assumed true just because a practice exists. */
  evidencedCount: boolean;
  evidencedTime: boolean;
  evidencedVirtue: boolean;
  /** Free-text virtue claim, shown ONLY when evidencedVirtue is true. */
  virtueNoteBn?: string;

  review: ReviewRecord;
  licensing: LicensingInfo;

  /** Where this practice appears in Today's Routine, if at all. A
   *  practice may appear in a routine slot, under a life area, both, or
   *  (rare) neither yet. */
  routineSlot?: RoutineSlot;
  lifeAreas: LifeArea[];
}

export const SUNNAH_LIFE_TRACKER_VERSION = 1 as const;

export type PracticeTrackingStatus = 'completed' | 'partial' | 'skipped' | 'not_applicable';

export interface DailyPracticeRecord {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  practiceId: string;
  status: PracticeTrackingStatus;
  /** Snapshot of the practice's title + classification + content version
   *  at the moment this record was first created — never retroactively
   *  changed by a later edit to the registry (same invariant as
   *  zikr-tracker-types.ts's nameSnapshot/targetSnapshot). */
  titleSnapshot: string;
  classificationSnapshot: PracticeClassification;
  contentVersionSnapshot: number;
  updatedAt: string; // ISO timestamp
}

export interface SunnahLifeTrackerData {
  version: typeof SUNNAH_LIFE_TRACKER_VERSION;
  records: DailyPracticeRecord[];
}

export interface DayProgress {
  date: string;
  total: number;
  completed: number;
  partial: number;
  skipped: number;
  notApplicable: number;
  remaining: number;
}
