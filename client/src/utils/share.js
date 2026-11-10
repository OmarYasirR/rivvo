// Shares a link with the device's share sheet when available, otherwise copies it to the clipboard.
// Returns 'shared' | 'copied' | 'cancelled' | 'failed'. `env` is injectable for tests.

export const postUrl = (id, env = globalThis) => `${env.location?.origin || ''}/post/${id}`;

export async function copyText(text, env = globalThis) {
  const nav = env.navigator;
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    // legacy path: pages not served over https, older browsers
    const doc = env.document;
    if (!doc) return false;
    const ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    const ok = doc.execCommand('copy');
    doc.body.removeChild(ta);
    return Boolean(ok);
  } catch {
    return false;
  }
}

export async function sharePost({ url, title, text }, env = globalThis) {
  const nav = env.navigator;
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled'; // user closed the share sheet
      // any other error: fall back to copying the link
    }
  }
  return (await copyText(url, env)) ? 'copied' : 'failed';
}
