'use client';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Sparkles, Star } from 'lucide-react';
import BackButton from './BackButton';
import { TOPICS, IMPORTANT_SURAHS } from '../lib/topics-data';

interface Props {
  onBack: () => void;
  onOpenTopic: (topicId: string) => void;
  onOpenImportant: (importantId: string) => void;
}

type Tab = 'topics' | 'important';

function TopicIcon({ name, ...props }: { name: string; size?: number; strokeWidth?: number; color?: string }) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>>)[name];
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
}

export default function QuranTopicsScreen({ onBack, onOpenTopic, onOpenImportant }: Props) {
  const [tab, setTab] = useState<Tab>('topics');

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onClick={onBack} variant="dark" />
        <div>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 20, color: 'var(--accent)' }}>বিষয়ভিত্তিক কুরআন</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>বিষয় ও গুরুত্বপূর্ণ সূরা-আয়াত অন্বেষণ করুন</div>
        </div>
      </div>

      <div style={{ padding: '4px 16px 16px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => setTab('topics')}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 100, border: '1px solid var(--border)',
            background: tab === 'topics' ? 'var(--accent)' : 'var(--card)',
            color: tab === 'topics' ? '#fff' : 'var(--text)',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
          }}
        >বিষয়সমূহ</button>
        <button
          onClick={() => setTab('important')}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 100, border: '1px solid var(--border)',
            background: tab === 'important' ? 'var(--accent)' : 'var(--card)',
            color: tab === 'important' ? '#fff' : 'var(--text)',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Hind Siliguri, sans-serif',
          }}
        >গুরুত্বপূর্ণ সূরা ও আয়াত</button>
      </div>

      {tab === 'topics' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TOPICS.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onOpenTopic(topic.id)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                padding: 15, display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer',
                boxShadow: '0 3px 14px rgba(15,42,25,0.06)',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: 'rgba(31,122,76,0.12)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><TopicIcon name={topic.icon} size={20} strokeWidth={1.8} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{topic.nameBn}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{topic.summaryBn}</div>
              </div>
              <div
                className="arabic"
                style={{ fontFamily: 'Amiri, serif', fontSize: 15, color: 'var(--accent)', flexShrink: 0, opacity: 0.6 }}
              >{topic.nameAr}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'important' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.28)',
            borderRadius: 12, padding: '10px 13px', marginBottom: 12, fontSize: 11, color: 'var(--text)', lineHeight: 1.6,
            display: 'flex', gap: 8,
          }}>
            <Sparkles size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>এই সংকলনটি যাচাইকৃত কুরআন ও হাদিস সূত্রের ভিত্তিতে তৈরি, এবং সময়ের সাথে বাড়ানো হবে — মান বজায় রেখে।</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {IMPORTANT_SURAHS.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpenImportant(item.id)}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                  padding: 15, display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer',
                  boxShadow: '0 3px 14px rgba(15,42,25,0.06)',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(150,112,42,0.16)', color: 'var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Star size={20} strokeWidth={1.8} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{item.nameBn}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.whySelectedBn}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
