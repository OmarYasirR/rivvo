// What the Explore search box means: nothing, a #hashtag, or free text
export function parseSearchInput(raw = '') {
  const s = String(raw).trim().slice(0, 100);
  if (!s) return { type: 'empty', value: '' };
  if (s.startsWith('#')) {
    const tag = s.slice(1).trim().split(/\s+/)[0].toLowerCase(); // first word only
    return tag ? { type: 'tag', value: tag } : { type: 'empty', value: '' };
  }
  return { type: 'text', value: s };
}

// the text that represents a parsed search in the box / URL
export const searchToValue = (p) => (p.type === 'tag' ? `#${p.value}` : p.type === 'text' ? p.value : '');
