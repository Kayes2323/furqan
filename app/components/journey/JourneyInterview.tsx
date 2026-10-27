'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Check, Undo2, X } from 'lucide-react';
import { Card, ConfirmDialog, PrimaryButton, SecondaryButton, TextButton } from './ui';
import type { JourneyData } from './useJourneyData';
import type { JourneyPlan } from '../../lib/journey-types';
import {
  applyAnswer, nextStep, parseFreeText, questionFor, skipStep, toPlanInputs, validateAnswer, sharingPossible,
  type Answers, type InterviewContext, type Question, type StepId, type SlotPreset,
} from '../../lib/journey-interview';
import { buildProposal, calibratedLpm, formatDateBn, COMFORT_FACTOR, MAX_DAILY_MINUTES, WEEKDAYS_BN, type Proposal } from '../../lib/journey-plan';
import type { PrayerSlot } from '../../lib/khatm-types';

interface Props {
  data: JourneyData;
  mode: 'new' | 'edit';
  onClose: () => void;
  onConfirm: (proposal: Proposal, note: string) => void;
}

// Steps NUR may interpret from free text (the server enforces the same list).
const FREE_TEXT_STEPS: StepId[] = ['goal', 'sharing', 'start', 'dailyMinutes', 'slots', 'lightDays', 'speed', 'deadline'];

interface Turn { step: StepId; question: Question; answer: string; before: Answers }

const STEP_LABEL: Record<StepId, string> = {
  goal: 'লক্ষ্য', deadline: 'সময়সীমা', sharing: 'শেয়ার করা পড়া', start: 'নাযেরার শুরু', dailyMinutes: 'দৈনিক সময়',
  slots: 'সময়সূচি', slotsCustom: 'ওয়াক্ত', lightDays: 'ব্যস্ত দিন', speed: 'পড়ার গতি',
};

function answersFromJourney(j: JourneyPlan, today: string): Answers {
  const slots = j.slots;
  let preset: SlotPreset = 'single';
  let custom: PrayerSlot[] | undefined;
  if (slots !== 'single') {
    if (slots.length === 5) preset = 'five';
    else if (slots.length === 2 && slots.includes('fajr') && slots.includes('isha')) preset = 'fajr-isha';
    else { preset = 'custom'; custom = [...slots]; }
  }
  return {
    goal: j.goal,
    deadline: j.pace === 'deadline' && j.targetDate && j.targetDate >= today ? { date: j.targetDate } : 'sustainable',
    sharing: j.goal === 'both' ? j.sharedReading : undefined,
    dailyMinutes: j.dailyMinutes,
    slotsPreset: preset,
    slotsCustom: custom,
    lightDays: [...j.lightDays],
    skipped: ['speed', 'start'],
  };
}

function clearStep(a: Answers, step: StepId): Answers {
  const next: Answers = { ...a, skipped: a.skipped.filter((s) => s !== step) };
  switch (step) {
    case 'goal': next.goal = undefined; break;
    case 'deadline': next.deadline = undefined; break;
    case 'sharing': next.sharing = undefined; break;
    case 'start': next.start = undefined; break;
    case 'dailyMinutes': next.dailyMinutes = undefined; break;
    case 'slots': next.slotsPreset = undefined; next.slotsCustom = undefined; break;
    case 'slotsCustom': next.slotsCustom = undefined; break;
    case 'lightDays': next.lightDays = undefined; break;
    case 'speed': next.speed = undefined; break;
  }
  return next;
}

export default function JourneyInterview({ data, mode, onClose, onConfirm }: Props) {
  const { index, khatm, nazera, journey, today, readerLast, surahNames } = data;

  const ctx: InterviewContext = useMemo(() => ({
    index: index!, today, khatm, nazera, existingJourney: journey, readerLast,
    calibratedLpm: calibratedLpm(journey?.sessionLog ?? []),
  }), [index, today, khatm, nazera, journey, readerLast]);

  const [answers, setAnswers] = useState<Answers>(() => (mode === 'edit' && journey ? answersFromJourney(journey, today) : { skipped: [] }));
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [dateVal, setDateVal] = useState('');
  const [minutesVal, setMinutesVal] = useState('');
  const [surahVal, setSurahVal] = useState('');
  const [pickSurah, setPickSurah] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const step = nextStep(ctx, answers);
  const question = step ? questionFor(step, ctx) : null;
  const proposal = useMemo(() => (step === null && index ? buildProposal(toPlanInputs(ctx, answers), index) : null), [step, ctx, answers, index]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [turns.length, step, error]);

  function record(s: StepId, q: Question, label: string, next: Answers) {
    setTurns((t) => [...t, { step: s, question: q, answer: label, before: answers }]);
    setAnswers(next);
    setError(null);
    setMulti([]);
    setDateVal('');
    setMinutesVal('');
    setSurahVal('');
    setPickSurah(false);
    setAiNote(null);
  }

  function labelFor(s: StepId, value: unknown, q: Question): string {
    if (s === 'dailyMinutes') return `${value} মিনিট`;
    if (s === 'deadline') return value === 'sustainable' ? 'নিজের গতিতে' : formatDateBn((value as { date: string }).date);
    if (s === 'sharing') return value ? 'একই পড়া দুটোতেই গণনা হোক' : 'আলাদা সেশনে পড়ব';
    if (s === 'lightDays') return (value as number[]).length ? (value as number[]).map((d) => WEEKDAYS_BN[d]).join(', ') : 'কোনো নির্দিষ্ট দিন নেই';
    if (s === 'slotsCustom') return (value as PrayerSlot[]).map((x) => q.options.find((o) => o.value === x)?.label ?? x).join(', ');
    if (s === 'start' && typeof value === 'object' && value) return `সূরা ${surahNames[(value as { surah: number }).surah] ?? (value as { surah: number }).surah} থেকে`;
    const opt = q.options.find((o) => o.value === String(value));
    return opt?.label ?? String(value);
  }

  function submit(value: unknown) {
    if (!step || !question) return;
    const err = validateAnswer(step, value, ctx);
    if (err) { setError(err); return; }
    record(step, question, labelFor(step, value, question), applyAnswer(answers, step, value));
  }

  function skip() {
    if (!step || !question) return;
    record(step, question, question.skipLabel ?? 'এড়িয়ে গেলাম', skipStep(answers, step));
  }

  function chooseSingle(value: string) {
    if (!step) return;
    if (step === 'goal') return submit(value);
    if (step === 'sharing') return submit(value === 'shared');
    if (step === 'start') {
      if (value === 'surah') { setPickSurah(true); return; }
      return submit(value);
    }
    if (step === 'dailyMinutes') return submit(Number(value));
    if (step === 'deadline') return submit('sustainable');
    return submit(value);
  }

  async function submitText() {
    const raw = text.trim();
    if (!raw || !step || !question || busy) return;
    setError(null);
    const local = parseFreeText(step, raw, ctx);
    if (local && 'skip' in local) { setText(''); return skip(); }
    if (local && 'value' in local) {
      const err = validateAnswer(step, local.value, ctx);
      if (!err) { setText(''); return submit(local.value); }
      setError(err);
      return;
    }
    if (!FREE_TEXT_STEPS.includes(step)) {
      setError('এটি বুঝতে পারিনি — নিচের অপশন থেকে বেছে নাও।');
      return;
    }
    setBusy(true);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 9000);
      const res = await fetch('/api/nur/journey', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ task: 'interpret', step, text: raw.slice(0, 400) }),
      });
      clearTimeout(timer);
      const body = (await res.json()) as { result?: { value?: unknown; skip?: boolean } | null };
      const r = body.result;
      if (r && r.skip) { setText(''); skip(); return; }
      if (r && 'value' in r && r.value !== undefined) {
        const err = validateAnswer(step, r.value, ctx);
        if (!err) { setText(''); submit(r.value); return; }
        setError(err);
        return;
      }
      setError('ঠিক বুঝতে পারিনি — নিচের অপশন থেকে বেছে নিলে সহজ হবে।');
    } catch {
      setAiNote('NUR এখন লেখা উত্তর বুঝতে পারছে না — অপশনগুলো থেকে বেছে নিলেই চলবে।');
    } finally {
      setBusy(false);
    }
  }

  function undo() {
    const last = turns[turns.length - 1];
    if (!last) return;
    setAnswers(last.before);
    setTurns((t) => t.slice(0, -1));
    setError(null);
    setPickSurah(false);
  }

  function change(s: StepId) {
    setAnswers((a) => clearStep(a, s));
    setTurns([]); // the conversation restarts at the single question being changed
  }

  const closeNow = () => {
    if (turns.length > 0 && step !== null) setConfirming(true);
    else onClose();
  };

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 14px' }}>
        <NurBadge />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>NUR-এর সঙ্গে পরিকল্পনা</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>NUR প্রশ্ন করে ও বুঝিয়ে দেয়; সংখ্যা ও তারিখ অ্যাপ নিজেই হিসাব করে।</div>
        </div>
        <button type="button" onClick={closeNow} aria-label="বন্ধ করো" style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} />
        </button>
      </div>

      <div role="log" aria-live="polite" aria-label="NUR-এর সঙ্গে কথোপকথন" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {turns.map((t, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bubble from="nur">{t.question.text}</Bubble>
            <Bubble from="user">{t.answer}</Bubble>
          </div>
        ))}

        {question && (
          <>
            <Bubble from="nur">{question.text}</Bubble>
          </>
        )}
      </div>

      {question && (
        <div style={{ marginTop: 12 }}>
          <QuestionInput
            q={question}
            multi={multi} setMulti={setMulti}
            dateVal={dateVal} setDateVal={setDateVal} today={today}
            minutesVal={minutesVal} setMinutesVal={setMinutesVal}
            pickSurah={pickSurah} surahVal={surahVal} setSurahVal={setSurahVal} surahNames={surahNames}
            onSingle={chooseSingle}
            onNumber={(n) => submit(n)}
            onDate={(d) => submit({ date: d })}
            onMulti={() => submit(question.step === 'lightDays' ? multi.map(Number) : multi)}
            onSurah={(n) => submit({ surah: n })}
          />
          {error && <div role="alert" style={{ marginTop: 8, fontSize: 12.5, color: '#B3362C' }}>{error}</div>}
          {aiNote && <div role="status" style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{aiNote}</div>}

          <form onSubmit={(e) => { e.preventDefault(); void submitText(); }} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input
              value={text} onChange={(e) => setText(e.target.value)} maxLength={300}
              aria-label="নিজের ভাষায় উত্তর লেখো" placeholder="অথবা নিজের ভাষায় লেখো…"
              style={{ flex: 1, minHeight: 46, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', padding: '0 14px', fontSize: 14 }}
            />
            <button type="submit" disabled={busy || !text.trim()} aria-label="পাঠাও" style={{ width: 46, height: 46, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: 'var(--on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUp size={18} />
            </button>
          </form>
          {busy && <div role="status" style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>NUR বোঝার চেষ্টা করছে…</div>}

          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {question.skippable && <TextButton onClick={skip}>{question.skipLabel ?? 'এড়িয়ে যাও'}</TextButton>}
            {turns.length > 0 && <TextButton onClick={undo}><Undo2 size={12} style={{ verticalAlign: -2 }} aria-hidden /> আগের উত্তর বদলাও</TextButton>}
          </div>
        </div>
      )}

      {proposal && (
        <Review
          data={data} proposal={proposal} mode={mode} ctx={ctx}
          onChange={change}
          onMinutes={(m) => setAnswers((a) => applyAnswer(a, 'dailyMinutes', m))}
          onUndo={turns.length > 0 ? undo : undefined}
          onSave={() => (journey || khatm || nazera ? setConfirming(true) : onConfirm(proposal, 'পরিকল্পনা তৈরি করা হয়েছে'))}
          onClose={onClose}
        />
      )}
      <div ref={bottomRef} />

      {confirming && (
        proposal ? (
          <ConfirmDialog
            title="এই পরিকল্পনা সংরক্ষণ করবে?"
            body={<>তোমার এখনকার অগ্রগতি, বুকমার্ক ও ইতিহাস অক্ষুণ্ণ থাকবে — শুধু লক্ষ্য ও সময়সূচি নতুন পরিকল্পনা অনুযায়ী বদলাবে। এটি শুধু এই ডিভাইসে সংরক্ষিত হবে।</>}
            confirmLabel="হ্যাঁ, সংরক্ষণ করো"
            onCancel={() => setConfirming(false)}
            onConfirm={() => { setConfirming(false); onConfirm(proposal, journey ? 'পরিকল্পনা হালনাগাদ করা হয়েছে' : 'পরিকল্পনা তৈরি করা হয়েছে'); }}
          />
        ) : (
          <ConfirmDialog
            title="কথোপকথন বন্ধ করবে?"
            body="এখনও কিছু সংরক্ষণ হয়নি — বন্ধ করলে এই উত্তরগুলো হারিয়ে যাবে। তোমার বর্তমান পরিকল্পনা অপরিবর্তিত থাকবে।"
            confirmLabel="বন্ধ করো" danger
            onCancel={() => setConfirming(false)}
            onConfirm={() => { setConfirming(false); onClose(); }}
          />
        )
      )}
    </div>
  );
}

function NurBadge() {
  return (
    <div aria-hidden style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: 'linear-gradient(135deg, var(--green), var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'Amiri, serif', fontSize: 22, color: '#fff', lineHeight: 1 }}>ن</span>
    </div>
  );
}

function Bubble({ from, children }: { from: 'nur' | 'user'; children: React.ReactNode }) {
  const nur = from === 'nur';
  return (
    <div style={{ display: 'flex', justifyContent: nur ? 'flex-start' : 'flex-end' }}>
      <div style={{
        maxWidth: '88%', padding: '11px 14px', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap',
        borderRadius: nur ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
        background: nur ? 'var(--card)' : 'rgba(31,122,76,0.14)', color: 'var(--text)',
        border: `1px solid ${nur ? 'var(--border)' : 'rgba(31,122,76,0.25)'}`,
      }}>{children}</div>
    </div>
  );
}

function QuestionInput(props: {
  q: Question; multi: string[]; setMulti: (v: string[]) => void; dateVal: string; setDateVal: (v: string) => void; today: string;
  minutesVal: string; setMinutesVal: (v: string) => void; pickSurah: boolean; surahVal: string; setSurahVal: (v: string) => void;
  surahNames: Record<number, string>; onSingle: (v: string) => void; onNumber: (n: number) => void; onDate: (d: string) => void;
  onMulti: () => void; onSurah: (n: number) => void;
}) {
  const { q } = props;
  const toggle = (v: string) => props.setMulti(props.multi.includes(v) ? props.multi.filter((x) => x !== v) : [...props.multi, v]);
  const fieldStyle = { minHeight: 46, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', padding: '0 14px', fontSize: 14 } as const;

  if (q.kind === 'multi') {
    return (
      <div>
        <div role="group" aria-label={q.text} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {q.options.map((o) => (
            <button key={o.value} type="button" className="qj-chip" aria-pressed={props.multi.includes(o.value)} onClick={() => toggle(o.value)}>{o.label}</button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <PrimaryButton full={false} onClick={props.onMulti} disabled={q.step === 'slotsCustom' && props.multi.length === 0}>
            <Check size={16} aria-hidden />এগিয়ে যাও
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (q.kind === 'number') {
    return (
      <div>
        <div role="group" aria-label="দ্রুত বাছাই" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {q.options.map((o) => <button key={o.value} type="button" className="qj-chip" onClick={() => props.onSingle(o.value)}>{o.label}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (props.minutesVal) props.onNumber(Number(props.minutesVal)); }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input type="number" inputMode="numeric" min={5} max={MAX_DAILY_MINUTES} value={props.minutesVal} onChange={(e) => props.setMinutesVal(e.target.value)} aria-label="অন্য সংখ্যা (মিনিট)" placeholder="অন্য সংখ্যা (মিনিট)" style={{ ...fieldStyle, flex: 1 }} />
          <SecondaryButton full={false} onClick={() => props.minutesVal && props.onNumber(Number(props.minutesVal))} disabled={!props.minutesVal}>ঠিক আছে</SecondaryButton>
        </form>
      </div>
    );
  }

  if (q.kind === 'date') {
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {q.options.map((o) => <button key={o.value} type="button" className="qj-chip" onClick={() => props.onSingle(o.value)}>{o.label}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input type="date" min={props.today} value={props.dateVal} onChange={(e) => props.setDateVal(e.target.value)} aria-label="লক্ষ্য তারিখ" style={{ ...fieldStyle, flex: 1 }} />
          <SecondaryButton full={false} onClick={() => props.dateVal && props.onDate(props.dateVal)} disabled={!props.dateVal}>এই তারিখ</SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div role="group" aria-label={q.text} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {q.options.map((o) => (
          <button key={o.value} type="button" className="qj-chip" onClick={() => props.onSingle(o.value)} style={{ textAlign: 'left' }}>
            {o.label}{o.hint && <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{o.hint}</span>}
          </button>
        ))}
      </div>
      {props.pickSurah && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <select value={props.surahVal} onChange={(e) => props.setSurahVal(e.target.value)} aria-label="সূরা বেছে নাও" style={{ ...fieldStyle, flex: 1 }}>
            <option value="">সূরা বেছে নাও</option>
            {Object.entries(props.surahNames).map(([n, name]) => <option key={n} value={n}>{n}. {name}</option>)}
          </select>
          <SecondaryButton full={false} disabled={!props.surahVal} onClick={() => props.onSurah(Number(props.surahVal))}>ঠিক আছে</SecondaryButton>
        </div>
      )}
    </div>
  );
}

// ── review & consent ──────────────────────────────────────────────────

type Explain = { key: string; text: string; ai: boolean };

function factsFor(p: Proposal) {
  return {
    goal: p.inputs.goal,
    sharedReading: p.inputs.sharedReading,
    dailyMinutes: p.inputs.dailyMinutes,
    khatmDailyAyahs: p.khatm?.dailyAyahs ?? null,
    khatmDailyMinutesApprox: p.khatm ? Math.round(p.khatm.dailyMinutes) : null,
    khatmEstimatedFinish: p.khatm?.targetDate ?? null,
    nazeraDailyAyahs: p.nazera?.dailyAyahs ?? null,
    nazeraDailyMinutesApprox: p.nazera ? Math.round(p.nazera.dailyMinutes) : null,
    requestedDateWasUnrealistic: p.khatm?.evaluation.adjusted ?? false,
  };
}

function fallbackExplanation(p: Proposal): string {
  const parts: string[] = [];
  if (p.khatm) parts.push(`খতমের জন্য প্রতিদিন প্রায় ${p.khatm.dailyAyahs} আয়াত (আনুমানিক ${Math.max(1, Math.round(p.khatm.dailyMinutes))} মিনিট) পড়লে আনুমানিক ${formatDateBn(p.khatm.targetDate)} নাগাদ খতম সম্পন্ন হতে পারে।`);
  if (p.nazera) parts.push(p.inputs.sharedReading ? 'একই পড়া নাযেরাতেও গণনা হবে।' : `নাযেরার জন্য প্রতিদিন প্রায় ${p.nazera.dailyAyahs} আয়াত পড়বে।`);
  parts.push('ব্যস্ত দিনে পিছিয়ে পড়লে চিন্তার কিছু নেই — পরিকল্পনা সহজে বদলে নেওয়া যাবে।');
  return parts.join(' ');
}

function Review({ data, proposal, mode, ctx, onChange, onMinutes, onUndo, onSave, onClose }: {
  data: JourneyData; proposal: Proposal; mode: 'new' | 'edit'; ctx: InterviewContext;
  onChange: (s: StepId) => void; onMinutes: (m: number) => void; onUndo?: () => void; onSave: () => void; onClose: () => void;
}) {
  const [explain, setExplain] = useState<Explain | null>(null);
  const factsKey = JSON.stringify(factsFor(proposal));

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const facts = JSON.parse(factsKey);
    fetch('/api/nur/journey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal, body: JSON.stringify({ task: 'explain', facts }) })
      .then((r) => r.json())
      .then((b: { text?: string | null }) => {
        if (!cancelled) setExplain({ key: factsKey, text: b.text || fallbackExplanation(proposal), ai: !!b.text });
      })
      .catch(() => { if (!cancelled) setExplain({ key: factsKey, text: fallbackExplanation(proposal), ai: false }); })
      .finally(() => clearTimeout(timer));
    return () => { cancelled = true; ctrl.abort(); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the computed facts change
  }, [factsKey]);

  const { khatm, nazera, inputs } = proposal;
  const ev = khatm?.evaluation;
  const current = explain && explain.key === factsKey ? explain : null;
  const needMinutes = ev?.adjusted && ev.requiredMinutesPerDay ? Math.ceil(ev.requiredMinutesPerDay / COMFORT_FACTOR / 5) * 5 : null;
  const goalLabel = inputs.goal === 'both' ? 'খতম ও নাযেরা' : inputs.goal === 'khatm' ? 'খতম' : 'নাযেরা';

  const rows: [string, string][] = [
    ['লক্ষ্য', goalLabel + (inputs.goal === 'both' ? (inputs.sharedReading ? ' · একই পড়া' : ' · আলাদা সেশন') : '')],
    ['দৈনিক সময়', `প্রায় ${inputs.dailyMinutes} মিনিট`],
  ];
  if (khatm) {
    rows.push(['খতম — দৈনিক', `${khatm.dailyAyahs} আয়াত (আনুমানিক ${Math.max(1, Math.round(khatm.dailyMinutes))} মিনিট)`]);
    rows.push(['খতম — আনুমানিক শেষ', formatDateBn(khatm.targetDate)]);
    rows.push(['সময়সূচি', khatm.scheduleStyle === 'single' ? 'একবারে একটি সেশন' : inputs.slots === 'single' ? '—' : `${(inputs.slots as PrayerSlot[]).length} ওয়াক্তে ভাগ করে`]);
  }
  if (nazera && !inputs.sharedReading) rows.push(['নাযেরা — দৈনিক', `${nazera.dailyAyahs} আয়াত (আনুমানিক ${Math.max(1, Math.round(nazera.dailyMinutes))} মিনিট)`]);
  if (inputs.lightDays.length) rows.push(['ব্যস্ত দিন', inputs.lightDays.map((d) => WEEKDAYS_BN[d]).join(', ')]);

  const old = data.journey;

  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Bubble from="nur">
        {mode === 'edit' ? 'পরিকল্পনার বর্তমান সেটিংস নিচে — যা বদলাতে চাও বেছে নাও, নইলে সংরক্ষণ করো।' : 'ধন্যবাদ! তোমার উত্তর অনুযায়ী পরিকল্পনাটি তৈরি হয়েছে। দেখে নাও, ঠিক মনে হলে সংরক্ষণ করো।'}
      </Bubble>

      <Card label="NUR-এর ব্যাখ্যা" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>{current?.ai ? 'NUR-এর ব্যাখ্যা' : 'সারসংক্ষেপ'}</div>
        {current ? (
          <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.8 }}>{current.text}</div>
        ) : (
          <div role="status" style={{ fontSize: 13, color: 'var(--text-muted)' }}>ব্যাখ্যা তৈরি হচ্ছে…</div>
        )}
      </Card>

      {proposal.warnings.map((w, i) => (
        <div key={i} role="note" style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(150,112,42,0.1)', border: '1px solid rgba(150,112,42,0.25)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{w}</div>
      ))}
      {ev?.adjusted && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {needMinutes !== null && needMinutes <= MAX_DAILY_MINUTES && (
            <button type="button" className="qj-chip" onClick={() => onMinutes(needMinutes)}>দিনে {needMinutes} মিনিট দিয়ে আমার তারিখই রাখি</button>
          )}
          <button type="button" className="qj-chip" onClick={() => onChange('deadline')}>অন্য তারিখ বেছে নেব</button>
        </div>
      )}

      <Card label="পরিকল্পনার সারসংক্ষেপ" style={{ padding: '6px 16px' }}>
        <dl style={{ margin: 0 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <dt style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{k}</dt>
              <dd style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {old && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, padding: '0 4px' }}>
          এখনকার পরিকল্পনা: দিনে {old.dailyMinutes} মিনিট{old.assumptions.estimatedKhatmCompletion ? `, খতম আনুমানিক ${formatDateBn(old.assumptions.estimatedKhatmCompletion)}` : ''}। সংরক্ষণ করলে উপরের পরিকল্পনাটি এর জায়গা নেবে — তার আগে কিছুই বদলাবে না।
        </div>
      )}

      <details style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '2px 16px' }}>
        <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>এই হিসাবের অনুমানগুলো দেখো</summary>
        <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          {proposal.assumptions.map((a, i) => <li key={i}>{a}</li>)}
          {inputs.goal === 'both' && !sharingPossible(ctx) && <li>খতম ও নাযেরা এখন আলাদা জায়গায় আছে, তাই একই পড়া দুটোতে গণনা করা যাচ্ছে না — আলাদা সেশনে চলবে।</li>}
          <li>তোমার সব তথ্য শুধু এই ডিভাইসে থাকে; অন্য ডিভাইসে স্বয়ংক্রিয়ভাবে যায় না।</li>
        </ul>
      </details>

      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>কিছু বদলাতে চাও?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {([
            ['goal', true], ['deadline', !!khatm], ['sharing', inputs.goal === 'both' && sharingPossible(ctx)],
            ['dailyMinutes', true], ['slots', !!khatm], ['lightDays', true],
          ] as [StepId, boolean][]).filter(([, show]) => show).map(([s]) => (
            <button key={s} type="button" className="qj-chip" onClick={() => onChange(s)}>{STEP_LABEL[s]}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <PrimaryButton onClick={onSave}>এই পরিকল্পনা সংরক্ষণ করো</PrimaryButton>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <TextButton onClick={onClose}>এখন নয়</TextButton>
          {onUndo && <TextButton onClick={onUndo}>আগের উত্তর বদলাও</TextButton>}
        </div>
      </div>
    </div>
  );
}
