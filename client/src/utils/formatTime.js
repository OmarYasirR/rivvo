// Clock time and day grouping for chat bubbles (localized with Intl, works for en and ar)

export const formatTime = (date, lang = 'en') =>
  new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit' }).format(new Date(date));

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // the viewer's local calendar day
};

// { kind: 'today' | 'yesterday' | 'date', text } (text only for 'date')
export function dayLabel(date, lang = 'en', now = new Date()) {
  const key = dayKey(date);
  if (key === dayKey(now)) return { kind: 'today', text: '' };
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (key === dayKey(y)) return { kind: 'yesterday', text: '' };
  const sameYear = new Date(date).getFullYear() === new Date(now).getFullYear();
  const opts = sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' };
  return { kind: 'date', text: new Intl.DateTimeFormat(lang, opts).format(new Date(date)) };
}

// [{ key, label, items }] in the given (chronological) order
export function groupByDay(messages = [], lang = 'en', now = new Date()) {
  const groups = [];
  for (const m of messages) {
    const key = dayKey(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(m);
    else groups.push({ key, label: dayLabel(m.createdAt, lang, now), items: [m] });
  }
  return groups;
}
