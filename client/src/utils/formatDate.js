// Relative time, localized via Intl (works for en and ar), e.g. "2 hours ago" / "منذ ساعتين"
export function formatDate(date, lang = 'en') {
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}
