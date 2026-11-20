// ═══════════════════════════════════════════
// FURQAN — Western → Bengali numerals for display.
//
// The whole UI is Bengali, so a bare `${count}` renders as "1টি প্রবন্ধ"
// among Bengali text, which reads as a typo. Every number shown to the
// user should go through this.
//
// The inverse (Bengali → Western, for parsing what the user typed) lives in
// app/lib/journey-interview.ts as normalizeDigits.
// ═══════════════════════════════════════════

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Replaces every ASCII digit with its Bengali counterpart. Anything that is
 *  not a digit — separators, signs, letters — is left exactly as it is. */
export function toBnDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}
