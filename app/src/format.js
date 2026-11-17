// Small formatting helpers shared by every view: money, counts, dates, countdowns,
// HTML escaping, and a tiny safe Markdown renderer for bounty descriptions.

const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const intFmt = new Intl.NumberFormat('en-US');

/** $1,325 or $795.50: whole dollars drop the cents, anything else keeps them. */
export function usd(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  return Number.isInteger(v) ? usdWhole.format(v) : usdFmt.format(v);
}

export function int(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return intFmt.format(Number(n));
}

/** Escape a string for HTML text or attribute use. */
export function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** "Tue 18 Nov, 01:00" in the reader's local time. */
export function dateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function dateOnly(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** A compact countdown: "2d 4h", "3h 12m", "41m", "ENDED", or "LIVE". */
export function timeLeft(iso, now = Date.now()) {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'ENDED';
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins % 60}m left`;
  return `${mins}m left`;
}

/** How urgent a deadline is, for colouring: soon (<6h), today (<24h), later. */
export function urgency(iso, now = Date.now()) {
  if (!iso) return 'later';
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'ended';
  if (ms < 6 * 3600e3) return 'soon';
  if (ms < 24 * 3600e3) return 'today';
  return 'later';
}

/** A shortened Solana address: 4WUU…qnL3. */
export function shortAddress(a) {
  if (!a || a.length < 10) return a || '—';
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

/**
 * A deliberately small Markdown renderer for bounty descriptions: headings, bold,
 * italic, inline code, code fences, links, bullet and numbered lists, paragraphs.
 * Input is escaped first, so nothing a sponsor writes can inject markup.
 */
export function renderMarkdown(md) {
  const lines = esc(md || '').split('\n');
  const out = [];
  let list = null;
  let code = false;
  const closeList = () => {
    if (list) {
      out.push(list === 'ul' ? '</ul>' : '</ol>');
      list = null;
    }
  };
  const inline = (t) => t
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\W)\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('```')) {
      closeList();
      out.push(code ? '</code></pre>' : '<pre><code>');
      code = !code;
      continue;
    }
    if (code) {
      out.push(line);
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const level = Math.min(4, h[1].length + 1);
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        out.push(kind === 'ul' ? '<ul>' : '<ol>');
        list = kind;
      }
      out.push(`<li>${inline((bullet || numbered)[1])}</li>`);
      continue;
    }
    closeList();
    if (line.trim() === '') continue;
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  if (code) out.push('</code></pre>');
  return out.join('\n');
}
