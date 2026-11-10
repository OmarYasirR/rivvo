// Splits caption text into plain text, #hashtags and @mentions so they can be rendered as links.
// Same hashtag rule as the server (utils/hashtags.js): letters/numbers/_ in any language, 1-50 chars, not purely numeric.
const RE = /(^|[^\p{L}\p{N}_&#@/])(#([\p{L}\p{N}_]{1,50})(?![\p{L}\p{N}_])|@([A-Za-z0-9_.]{3,20})(?![A-Za-z0-9_]))/gu;

export function tokenizeCaption(text = '') {
  const s = String(text);
  const out = [];
  let last = 0;
  for (const m of s.matchAll(RE)) {
    const start = m.index + m[1].length; // where the # or @ begins
    let token = null;
    let end = start;
    if (m[3] !== undefined) {
      if (/^\d+$/.test(m[3])) continue; // "#1" is not a hashtag
      token = { type: 'tag', value: m[3].toLowerCase(), raw: `#${m[3]}` };
      end = start + 1 + m[3].length;
    } else {
      const name = m[4].replace(/\.+$/, ''); // "@sara." -> mention "sara" + a normal full stop
      if (name.length < 3) continue;
      token = { type: 'mention', value: name, raw: `@${name}` };
      end = start + 1 + name.length;
    }
    if (start > last) out.push({ type: 'text', value: s.slice(last, start) });
    out.push(token);
    last = end;
  }
  if (last < s.length) out.push({ type: 'text', value: s.slice(last) });
  return out;
}
