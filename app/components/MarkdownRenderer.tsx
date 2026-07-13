'use client';
import { useTheme } from '../lib/theme';

interface Props { content: string; }

export default function MarkdownRenderer({ content }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} style={{
          fontSize: 22, fontWeight: 800, color: 'var(--text)',
          marginBottom: 8, marginTop: 24, lineHeight: 1.4,
          borderBottom: `2px solid var(--accent)`,
          paddingBottom: 8,
        }}>{line.slice(2)}</h1>
      );
    }
    // H2
    else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} style={{
          fontSize: 18, fontWeight: 700, color: 'var(--accent)',
          marginBottom: 6, marginTop: 20, lineHeight: 1.4,
        }}>{line.slice(3)}</h2>
      );
    }
    // H3
    else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} style={{
          fontSize: 15, fontWeight: 700, color: 'var(--text)',
          marginBottom: 4, marginTop: 16, lineHeight: 1.4,
          opacity: 0.9,
        }}>{line.slice(4)}</h3>
      );
    }
    // Arabic text (contains Arabic characters)
    else if (/[\u0600-\u06FF]/.test(line) && line.trim().length > 3) {
      elements.push(
        <div key={key++} style={{
          fontFamily: 'Amiri, serif',
          fontSize: 22,
          direction: 'rtl',
          textAlign: 'right',
          lineHeight: 2,
          color: 'var(--text)',
          background: isDark ? 'rgba(42,159,191,0.08)' : 'rgba(26,95,122,0.06)',
          borderRight: `3px solid var(--accent)`,
          padding: '12px 16px',
          borderRadius: '0 12px 12px 0',
          margin: '12px 0',
        }}>{line}</div>
      );
    }
    // Blockquote / ayah reference
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} style={{
          borderLeft: `3px solid var(--gold, #C9A84C)`,
          background: isDark ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.08)',
          padding: '10px 14px',
          margin: '10px 0',
          borderRadius: '0 10px 10px 0',
          fontSize: 13,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.7,
        }}>{line.slice(2)}</blockquote>
      );
    }
    // Horizontal rule
    else if (line.startsWith('---')) {
      elements.push(
        <div key={key++} style={{
          height: 1,
          background: 'var(--border)',
          margin: '20px 0',
        }} />
      );
    }
    // Bullet list
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={key++} style={{
          display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', flexShrink: 0, marginTop: 7,
          }} />
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>
            {renderInline(line.slice(2))}
          </div>
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        elements.push(
          <div key={key++} style={{
            display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0,
              background: 'var(--accent)',
              color: 'white', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{match[1]}</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', flex: 1 }}>
              {renderInline(match[2])}
            </div>
          </div>
        );
      }
    }
    // Empty line
    else if (line.trim() === '') {
      if (i > 0 && lines[i-1].trim() !== '') {
        elements.push(<div key={key++} style={{ height: 8 }} />);
      }
    }
    // Normal paragraph
    else if (line.trim().length > 0) {
      elements.push(
        <p key={key++} style={{
          fontSize: 14, lineHeight: 1.9, color: 'var(--text)',
          marginBottom: 4,
        }}>
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div style={{ padding: '4px 0' }}>{elements}</div>;
}

// Inline markdown — bold, italic, highlight
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    // ==highlight==
    const hlMatch = remaining.match(/==(.+?)==/);
    // **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // *italic*
    const italicMatch = remaining.match(/\*(.+?)\*/);

    const matches = [
      hlMatch ? { match: hlMatch, type: 'highlight', start: hlMatch.index! } : null,
      boldMatch ? { match: boldMatch, type: 'bold', start: boldMatch.index! } : null,
      italicMatch ? { match: italicMatch, type: 'italic', start: italicMatch.index! } : null,
    ].filter(Boolean) as { match: RegExpMatchArray; type: string; start: number }[];

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    matches.sort((a, b) => a.start - b.start);
    const first = matches[0];

    if (first.start > 0) {
      parts.push(remaining.slice(0, first.start));
    }

    if (first.type === 'highlight') {
      parts.push(
        <mark key={idx++} style={{
          background: 'rgba(201,168,76,0.3)',
          color: 'var(--text)',
          padding: '1px 4px',
          borderRadius: 4,
          fontWeight: 600,
        }}>{first.match[1]}</mark>
      );
      remaining = remaining.slice(first.start + first.match[0].length);
    } else if (first.type === 'bold') {
      parts.push(
        <strong key={idx++} style={{ fontWeight: 700, color: 'var(--accent)' }}>
          {first.match[1]}
        </strong>
      );
      remaining = remaining.slice(first.start + first.match[0].length);
    } else if (first.type === 'italic') {
      parts.push(
        <em key={idx++} style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
          {first.match[1]}
        </em>
      );
      remaining = remaining.slice(first.start + first.match[0].length);
    }
  }

  return parts;
}