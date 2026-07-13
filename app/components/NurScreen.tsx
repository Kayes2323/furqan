'use client';
import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

const SUGGESTIONS = [
  'সুদ কেন হারাম?',
  'রাগ নিয়ন্ত্রণে কুরআন',
  'আদম (আ.) কে শ্রীলংকায় কেন?',
  'যাকাত কীভাবে দারিদ্র্য দূর করে?',
  'বিগ ব্যাং ও কুরআন',
  'Depression এর ইসলামিক সমাধান',
];

const INITIAL: ChatMessage = {
  role: 'nur',
  content: 'আস-সালামু আলাইকুম! আমি NUR — নূর।\n\nকুরআন ও সহীহ হাদিসের আলোয় যেকোনো প্রশ্নের উত্তর দিতে প্রস্তুত।\n\nসরাসরি উত্তর না জানলেও সংশ্লিষ্ট আয়াত দেবো, যাতে তুমি নিজে ভাবতে পারো। আল্লাহ চিন্তাশীলদের জন্যই এই কিতাব নাজিল করেছেন।',
  refs: ['সূরা ৩৮:২৯'],
};

export default function NurScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/nur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'nur', content: data.reply, refs: data.refs }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'nur',
        content: 'দুঃখিত, একটু সমস্যা হয়েছে। আবার চেষ্টা করো।',
      }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B7A4A, #2EA864, #1A5F7A)',
        padding: '48px 20px 20px',
        textAlign: 'center', color: 'white', flexShrink: 0,
      }}>
        <div style={{ fontFamily: 'Amiri, serif', fontSize: 44, marginBottom: 4, lineHeight: 1 }}>ن</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>NUR</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>نور — কুরআন ও হাদিসের আলোয় উত্তর</div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>
            জনপ্রিয় প্রশ্ন
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <div key={s} onClick={() => send(s)} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '7px 13px', fontSize: 12,
                color: 'var(--text)', cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(26,95,122,0.06)',
              }}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--card)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              borderRadius: 16,
              borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: msg.role === 'nur' ? 4 : 16,
              padding: '12px 14px', fontSize: 14, lineHeight: 1.65,
              boxShadow: msg.role === 'nur' ? '0 2px 8px rgba(26,95,122,0.08)' : 'none',
              border: msg.role === 'nur' ? '1px solid var(--border)' : 'none',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
              {msg.refs && msg.refs.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {msg.refs.map(r => (
                    <span key={r} style={{
                      background: 'rgba(26,95,122,0.1)', color: 'var(--accent)',
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    }}>{r}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 16, borderBottomLeftRadius: 4,
              padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)',
            }}>
              NUR চিন্তা করছে...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '8px 16px 8px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="যেকোনো প্রশ্ন করো..."
          style={{
            flex: 1, background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 24,
            padding: '10px 16px', outline: 'none',
            fontFamily: 'Hind Siliguri, sans-serif', fontSize: 14,
            color: 'var(--text)',
          }}
        />
        <button onClick={() => send(input)} style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #1B7A4A, #2EA864)',
          border: 'none', borderRadius: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: '0 2px 8px rgba(27,122,74,0.3)',
        }}>➤</button>
      </div>
    </div>
  );
}
