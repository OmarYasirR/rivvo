// Compact localized numbers, e.g. 12400 -> "12.4K" / "١٢٫٤ ألف"
export function formatNumber(num, lang = 'en') {
  return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}
