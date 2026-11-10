// Recent Explore searches, kept in localStorage (the storage is injectable for tests)
const KEY = 'rivvo_recent_searches';
const MAX = 8;

export function loadRecent(env = globalThis) {
  try {
    const list = JSON.parse(env.localStorage?.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((s) => typeof s === 'string' && s).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function save(list, env) {
  try {
    env.localStorage?.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked: recents are optional */
  }
  return list;
}

export function addRecent(term, env = globalThis) {
  const t = String(term || '').trim().slice(0, 60);
  if (!t) return loadRecent(env);
  const rest = loadRecent(env).filter((x) => x.toLowerCase() !== t.toLowerCase());
  return save([t, ...rest].slice(0, MAX), env);
}

export const removeRecent = (term, env = globalThis) => save(loadRecent(env).filter((x) => x !== term), env);
export const clearRecent = (env = globalThis) => save([], env);
