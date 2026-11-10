#!/usr/bin/env node
/**
 * Rivvo — final check (dependency-free; run:  node tests/final-check.cjs)
 *
 * Part A  static checks   : syntax, import/require resolution, route wiring, i18n parity
 * Part B  server behavior : controllers/middleware/socket handlers run against in-memory mocks
 * Part C  client behavior : utils + i18n render test (needs `typescript` + `react` resolvable, else skipped)
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const SERVER = path.join(ROOT, 'server');
const CLIENT = path.join(ROOT, 'client', 'src');

// allow resolving globally-installed typescript/react when run in a sandbox
if (!process.env.NODE_PATH && fs.existsSync('/home/claude/.npm-global/lib/node_modules')) {
  process.env.NODE_PATH = '/home/claude/.npm-global/lib/node_modules';
  Module._initPaths();
}

// ---------- tiny test harness ----------
const results = [];
let section = '';
const group = (name) => { section = name; console.log(`\n== ${name}`); };
async function test(name, fn) {
  try { await fn(); results.push({ ok: true }); console.log(`  ✓ ${name}`); }
  catch (e) { results.push({ ok: false, name, section }); console.log(`  ✗ ${name}\n      ${String(e.message).split('\n').join('\n      ')}`); }
}
function skip(name, why) { results.push({ skipped: true }); console.log(`  - SKIP ${name} (${why})`); }
const assert = (c, m = 'assertion failed') => { if (!c) throw new Error(m); };
const eq = (a, b, m = '') => { if (a !== b) throw new Error(`${m} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

const walk = (dir, exts) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  if (d.name === 'node_modules') return [];
  return d.isDirectory() ? walk(p, exts) : exts.some((e) => d.name.endsWith(e)) ? [p] : [];
});
const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(p, 'utf8');

function resolveFile(from, spec, exts = ['', '.js', '.jsx', '.json', '/index.js', '/index.jsx']) {
  const base = path.resolve(path.dirname(from), spec);
  for (const e of exts) { const c = base + e; if (fs.existsSync(c) && fs.statSync(c).isFile()) return c; }
  return null;
}

function exportsOf(src) {
  const names = new Set();
  let hasDefault = /export\s+default\b/.test(src) || /module\.exports\s*=\s*(?!\{)/.test(src);
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:const|let|var|function|class)\s+(\w+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s+const\s*\{([^}]*)\}\s*=/g)) m[1].split(',').map((x) => x.trim()).filter(Boolean).forEach((n) => names.add(n));
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
      const [orig, alias] = s.split(/\s+as\s+/); const name = alias || orig;
      if (name === 'default') hasDefault = true; else names.add(name);
    });
  }
  // CommonJS
  for (const m of src.matchAll(/\bexports\.(\w+)\s*=/g)) names.add(m[1]);
  const mod = src.match(/module\.exports\s*=\s*\{([\s\S]*?)\}\s*;?/);
  if (mod) mod[1].split(',').map((s) => s.trim().split(':')[0].trim()).filter(Boolean).forEach((n) => names.add(n));
  return { names, hasDefault };
}

// =====================================================================
// =====================================================================
async function main() {
  group('A1. Server syntax (node --check)');
  const serverFiles = walk(SERVER, ['.js']);
  for (const f of serverFiles) {
    await test(rel(f), () => { cp.execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); });
  }

  group('A2. Client syntax (TypeScript parser)');
  let ts = null;
  try { ts = require('typescript'); } catch { /* optional */ }
  const clientFiles = walk(CLIENT, ['.js', '.jsx']);
  if (!ts) skip('client JSX syntax', 'typescript not resolvable');
  else for (const f of clientFiles) {
    await test(rel(f), () => {
      const out = ts.transpileModule(read(f), { reportDiagnostics: true, fileName: f.replace(/\.js$/, '.jsx'),
        compilerOptions: { jsx: ts.JsxEmit.Preserve, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
      const errs = (out.diagnostics || []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
      assert(errs.length === 0, errs.join('; '));
    });
  }

  group('A3. Client imports resolve + named/default exports exist');
  for (const f of clientFiles) {
    await test(rel(f), () => {
      const src = read(f); const problems = [];
      for (const m of src.matchAll(/import\s+([^'"]*?)\s*from\s*['"]([^'"]+)['"]/g)) {
        const [, clause, spec] = m;
        if (!spec.startsWith('.')) continue;
        if (/\.css$/.test(spec)) { if (!resolveFile(f, spec, [''])) problems.push(`missing ${spec}`); continue; }
        const target = resolveFile(f, spec);
        if (!target) { problems.push(`cannot resolve ${spec}`); continue; }
        const ex = exportsOf(read(target));
        const named = clause.match(/\{([^}]*)\}/);
        const def = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim();
        if (def && !ex.hasDefault) problems.push(`${spec} has no default export`);
        if (named) named[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean)
          .forEach((n) => { if (!ex.names.has(n)) problems.push(`${spec} has no export "${n}"`); });
      }
      assert(problems.length === 0, problems.join('; '));
    });
  }

  group('A4. Server requires resolve + destructured names exist');
  for (const f of serverFiles) {
    await test(rel(f), () => {
      const src = read(f); const problems = [];
      for (const m of src.matchAll(/(?:const|let)\s+(\{[^}]*\}|\w+)\s*=\s*require\(['"](\.[^'"]+)['"]\)/g)) {
        const [, lhs, spec] = m; const target = resolveFile(f, spec);
        if (!target) { problems.push(`cannot resolve ${spec}`); continue; }
        if (lhs.startsWith('{')) {
          const { names } = exportsOf(read(target));
          lhs.slice(1, -1).split(',').map((s) => s.trim().split(':')[0].trim()).filter(Boolean)
            .forEach((n) => { if (!names.has(n)) problems.push(`${spec} lacks "${n}"`); });
        }
      }
      assert(problems.length === 0, problems.join('; '));
    });
  }

  group('A5. Client API calls match server routes');
  const mounts = {};
  for (const m of read(path.join(SERVER, 'app.js')).matchAll(/app\.use\('(\/api\/[^']+)',\s*(\w+)\)/g)) mounts[m[2]] = m[1];
  const requires = {};
  for (const m of read(path.join(SERVER, 'app.js')).matchAll(/const\s+(\w+)\s*=\s*require\('\.\/routes\/(\w+)'\)/g)) requires[m[1]] = m[2];
  const norm = (p) => p.replace(/\/+$/, '').replace(/:\w+/g, ':p') || '/';
  const serverRoutes = new Set();
  for (const [varName, base] of Object.entries(mounts)) {
    const file = requires[varName]; if (!file) continue;
    const src = read(path.join(SERVER, 'routes', file + '.js'));
    for (const m of src.matchAll(/router\.(get|post|put|delete)\(\s*'([^']*)'/g)) serverRoutes.add(`${m[1].toUpperCase()} ${norm(base + (m[2] === '/' ? '' : m[2]))}`);
    for (const m of src.matchAll(/router\.route\(\s*'([^']*)'\s*\)([\s\S]*?);/g))
      for (const v of m[2].matchAll(/\.(get|post|put|delete)\(/g)) serverRoutes.add(`${v[1].toUpperCase()} ${norm(base + (m[1] === '/' ? '' : m[1]))}`);
  }
  for (const f of walk(path.join(CLIENT, 'services'), ['.js'])) {
    const src = read(f);
    for (const m of src.matchAll(/api\.(get|post|put|delete)\(\s*([`'])([^`']+)\2/g)) {
      const url = '/api' + m[3].replace(/\$\{[^}]+\}/g, ':p');
      await test(`${path.basename(f)}: ${m[1].toUpperCase()} ${url}`, () => assert(serverRoutes.has(`${m[1].toUpperCase()} ${norm(url)}`), 'no matching server route'));
    }
  }

  group('A6. i18n parity (client + server) and fonts');
  const trSrc = read(path.join(CLIENT, 'i18n', 'translations.js'));
  const [enBlock, arBlock] = [trSrc.split('  ar: {')[0], trSrc.split('  ar: {')[1].split('export const LANGUAGES')[0]];
  const keyset = (b) => new Set([...b.matchAll(/(?:^|[,{\s])(\w+):\s*['"]/g)].map((m) => m[1]));
  const [enK, arK] = [keyset(enBlock), keyset(arBlock)];
  await test('client en/ar have identical keys', () => {
    const a = [...enK].filter((k) => !arK.has(k)), b = [...arK].filter((k) => !enK.has(k));
    assert(!a.length && !b.length, `missing in ar: ${a}; missing in en: ${b}`);
  });
  await test('every t("key") used in client exists', () => {
    const used = new Set(); const miss = [];
    for (const f of clientFiles) for (const m of read(f).replace(/\/\/.*$/gm, '').matchAll(/\bt\(\s*['"](\w+)['"]/g)) used.add(m[1]);
    ['notif_like', 'notif_comment', 'notif_follow', 'notif_message', 'dark', 'light', 'home', 'explore', 'messages', 'notifications', 'settings'].forEach((k) => used.add(k));
    used.forEach((k) => { if (!enK.has(k)) miss.push(k); });
    assert(!miss.length, miss.join(', '));
  });
  await test('every req.t("key") on server exists in en + ar', () => {
    const src = read(path.join(SERVER, 'i18n', 'messages.js'));
    const [enS, arS] = [src.split('  ar: {')[0], src.split('  ar: {')[1]]; const [a, b] = [keyset(enS), keyset(arS)];
    const used = new Set();
    for (const f of serverFiles) for (const m of read(f).matchAll(/req\.t\(\s*'(\w+)'/g)) used.add(m[1]);
    const miss = [...used].filter((k) => !a.has(k) || !b.has(k)); assert(!miss.length, miss.join(', '));
    const diff = [...a].filter((k) => !b.has(k)).concat([...b].filter((k) => !a.has(k))); assert(!diff.length, `parity: ${diff}`);
  });
  await test('no hard-coded server messages left', () => {
    const bad = serverFiles.filter((f) => /message:\s*'/.test(read(f)) && !f.includes('i18n'));
    assert(!bad.length, bad.map(rel).join(', '));
  });
  await test('Tajawal loaded in index.html and used for Arabic in CSS', () => {
    assert(/family=Tajawal/.test(read(path.join(ROOT, 'client', 'index.html'))), 'font link missing');
    assert(/\[lang='ar'\][\s\S]*Tajawal/.test(read(path.join(CLIENT, 'index.css'))), 'css rule missing');
    assert(!/Cairo/.test(read(path.join(ROOT, 'client', 'index.html')) + read(path.join(CLIENT, 'index.css'))), 'Cairo still referenced');
  });
  await test('app is Arabic + English only', () => {
    const langs = [...trSrc.split('export const LANGUAGES')[0].matchAll(/^  (\w\w): \{/gm)].map((m) => m[1]);
    const declared = [...trSrc.split('export const LANGUAGES')[1].matchAll(/^  (\w\w): \{/gm)].map((m) => m[1]); eq(declared.sort().join(), 'ar,en', 'LANGUAGES'); eq(langs.sort().join(), 'ar,en');
  });


  group('A7. Styles: every component class has a CSS rule; themes + RTL present');
  const css = read(path.join(CLIENT, 'index.css'));
  const cssClasses = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const INLINE_STYLED = new Set(['spinner', 'skeleton', 'avatar-status']); // styled inline by their component
  const used = new Map();
  for (const f of clientFiles) {
    const src = read(f);
    for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const text = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ' ');
      text.split(/\s+/).filter(Boolean).forEach((c) => { if (!used.has(c)) used.set(c, rel(f)); });
    }
    for (const m of src.matchAll(/\?\s*'([\w-]+)'\s*:\s*'([\w-]*)'/g)) [m[1], m[2]].filter(Boolean).forEach((c) => { if (/className|message|story-ring/.test(src)) used.set(c, used.get(c) || rel(f)); });
  }
  await test(`all ${used.size} component classes are styled`, () => {
    const missing = [...used].filter(([c]) => !cssClasses.has(c) && !INLINE_STYLED.has(c)).map(([c, f]) => `.${c} (${f})`);
    assert(!missing.length, 'unstyled: ' + missing.join(', '));
  });
  await test('dark + light theme tokens defined', () => { assert(/:root\s*\{[\s\S]*--bg:/.test(css) && /\[data-theme='light'\]\s*\{[\s\S]*--bg:/.test(css)); });
  await test('mobile breakpoint swaps sidebar for bottom nav', () => { assert(/@media \(max-width: 860px\)[\s\S]*\.sidebar\s*\{\s*display:\s*none/.test(css) && /\.mobile-nav\s*\{[\s\S]*position:\s*fixed/.test(css)); });
  await test('no hard-left/right offsets (RTL-safe)', () => {
    const bad = css.split('\n').map((l, i) => [l, i + 1]).filter(([l]) => /(^|\s)(margin|padding)-(left|right)\s*:|(^|\s)(left|right)\s*:\s*[-\d]|text-align:\s*(left|right)/.test(l) && !/\[dir=/.test(l));
    assert(!bad.length, bad.map(([l, n]) => `line ${n}: ${l.trim()}`).join('; '));
  });

  // =====================================================================
  group('B. Server behavior (in-memory mocks)');
  const { pickLang } = require(path.join(SERVER, 'i18n', 'messages.js'));
  // --- module mocking
  const origLoad = Module._load;
  const mocks = {};
  Module._load = function (request, parent, isMain) {
    if (request in mocks) return mocks[request];
    if (parent && parent.filename && parent.filename.startsWith(SERVER) && request.startsWith('.')) {
      const abs = path.resolve(path.dirname(parent.filename), request);
      const key = path.relative(SERVER, abs).replace(/\\/g, '/');
      if (key in mocks) return mocks[key];
    }
    return origLoad.apply(this, arguments);
  };
  const fresh = (p) => { const full = path.join(SERVER, p); delete require.cache[require.resolve(full)]; return require(full); };
  const mkRes = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
  const mkReq = (lang, extra = {}) => { const { translate } = require(path.join(SERVER, 'i18n', 'messages.js')); return { lang, headers: {}, body: {}, params: {}, t: (k, v) => translate(lang, k, v), ...extra }; };
  const ARABIC = /[\u0600-\u06FF]/;
  process.env.JWT_SECRET = 's'; process.env.CLIENT_URL = 'http://localhost:5173';

  // fake libs
  mocks.bcryptjs = { hash: async (p) => 'h:' + p, compare: async (p, h) => h === 'h:' + p };
  mocks.jsonwebtoken = { sign: (p) => 'tok.' + p.id, verify: (t) => ({ id: t.split('.')[1] }) };
  const mailbox = [];
  mocks['config/mail'] = { sendMail: async (m) => { mailbox.push(m); } };
  let users = [];
  const mkUserQuery = (doc) => { const q = Promise.resolve(doc); q.select = () => q; return q; };
  mocks['models/User'] = {
    findOne: (f) => mkUserQuery(users.find((u) => Object.entries(f).every(([k, v]) => {
      if (k === '$or') return v.some((c) => Object.entries(c).every(([a, b]) => u[a] === b));
      if (v && v.$gt !== undefined) return u[k] && u[k] > v.$gt;
      return u[k] === v;
    })) || null),
    create: async (d) => { const u = { _id: 'u' + (users.length + 1), avatar: '', save: async () => {}, ...d }; users.push(u); return u; },
    findById: (id) => mkUserQuery(users.find((u) => u._id === id) || { _id: id }),
    findByIdAndUpdate: (id, upd) => { const u = users.find((x) => x._id === id); if (u) Object.assign(u, upd); return { exec: () => Promise.resolve(u) }; },
  };

  await test('pickLang: ar / en / unsupported / missing', () => {
    eq(pickLang('ar,en;q=0.9'), 'ar'); eq(pickLang('en-US'), 'en'); eq(pickLang('fr'), 'en'); eq(pickLang(undefined), 'en');
  });
  await test('langMiddleware sets req.lang + req.t', () => {
    const mw = fresh('middleware/langMiddleware.js'); const req = { headers: { 'accept-language': 'ar' } };
    mw(req, {}, () => {}); eq(req.lang, 'ar'); assert(ARABIC.test(req.t('notAuthorized')));
  });
  await test('register: success then duplicate → localized 400', async () => {
    const c = fresh('controllers/authController.js'); const r1 = mkRes();
    await c.register(mkReq('en', { body: { username: 'omar', email: 'o@x.com', password: 'secret123' } }), r1, (e) => { throw e; });
    eq(r1.code, 201); assert(r1.body.token && r1.body.user.username === 'omar');
    assert(users[0].password === 'h:secret123', 'password must be hashed');
    const r2 = mkRes(); await c.register(mkReq('ar', { body: { username: 'omar', email: 'o@x.com', password: 'x' } }), r2, () => {});
    eq(r2.code, 400); assert(ARABIC.test(r2.body.message), 'Arabic message expected');
  });
  await test('login: valid → token; invalid → 401 in en and ar', async () => {
    const c = fresh('controllers/authController.js');
    const ok = mkRes(); await c.login(mkReq('en', { body: { email: 'o@x.com', password: 'secret123' } }), ok, () => {}); assert(ok.body.token, 'token');
    const en = mkRes(); await c.login(mkReq('en', { body: { email: 'o@x.com', password: 'bad' } }), en, () => {}); eq(en.code, 401); eq(en.body.message, 'Invalid credentials');
    const ar = mkRes(); await c.login(mkReq('ar', { body: { email: 'nobody@x.com', password: 'bad' } }), ar, () => {}); eq(ar.code, 401); assert(ARABIC.test(ar.body.message));
  });
  let rawToken;
  await test('forgotPassword: unknown email is generic 200 (no leak)', async () => {
    const c = fresh('controllers/authController.js'); const r = mkRes(); const before = mailbox.length;
    await c.forgotPassword(mkReq('en', { body: { email: 'ghost@x.com' } }), r, () => {});
    eq(r.code, 200); eq(mailbox.length, before, 'no email should be sent');
  });
  await test('forgotPassword: Arabic RTL email, hashed token stored, ~1h expiry', async () => {
    const c = fresh('controllers/authController.js'); const r = mkRes();
    await c.forgotPassword(mkReq('ar', { lang: 'ar', body: { email: 'o@x.com' } }), r, (e) => { throw e; });
    const mail = mailbox.at(-1); assert(mail, 'email sent'); eq(mail.to, 'o@x.com');
    assert(ARABIC.test(mail.subject), 'Arabic subject'); assert(mail.html.includes('dir="rtl"'), 'rtl markup');
    rawToken = (mail.html.match(/reset-password\/([a-f0-9]{64})/) || [])[1]; assert(rawToken, 'link has 64-hex token');
    const u = users[0]; eq(u.resetPasswordToken, crypto.createHash('sha256').update(rawToken).digest('hex'), 'stores SHA-256 only');
    assert(u.resetPasswordToken !== rawToken, 'raw token must not be stored');
    const ttl = u.resetPasswordExpire - Date.now(); assert(ttl > 59 * 60e3 && ttl <= 60 * 60e3, `ttl ${ttl}`);
  });
  await test('resetPassword: bad token → 400 (ar); good token → password changed + token cleared', async () => {
    const c = fresh('controllers/authController.js');
    const bad = mkRes(); await c.resetPassword(mkReq('ar', { params: { token: 'deadbeef' }, body: { password: 'newpass123' } }), bad, () => {});
    eq(bad.code, 400); assert(ARABIC.test(bad.body.message));
    const good = mkRes(); await c.resetPassword(mkReq('en', { params: { token: rawToken }, body: { password: 'newpass123' } }), good, (e) => { throw e; });
    assert(good.body.token, 'returns token'); eq(users[0].password, 'h:newpass123'); eq(users[0].resetPasswordToken, undefined);
    const again = mkRes(); await c.resetPassword(mkReq('en', { params: { token: rawToken }, body: { password: 'x' } }), again, () => {});
    eq(again.code, 400, 'token must be single-use');
  });
  await test('authMiddleware.protect: no token → 401 localized; valid → req.user set', async () => {
    const { protect } = fresh('middleware/authMiddleware.js'); const r = mkRes(); let called = false;
    await protect(mkReq('ar'), r, () => { called = true; }); eq(r.code, 401); assert(ARABIC.test(r.body.message)); assert(!called);
    const req = mkReq('en', { headers: { authorization: 'Bearer tok.u1' } }); await protect(req, mkRes(), () => { called = true; });
    assert(called && req.user && req.user._id === 'u1', 'user attached');
  });
  await test('errorMiddleware: hides 500 internals, maps upload size limit to 413', () => {
    const eh = fresh('middleware/errorMiddleware.js'); const log = console.error; console.error = () => {};
    const r1 = mkRes(); eh(new Error('db password leaked'), mkReq('en'), r1, () => {}); eq(r1.code, 500); eq(r1.body.message, 'Server error');
    const r2 = mkRes(); const e = new Error('big'); e.code = 'LIMIT_FILE_SIZE'; eh(e, mkReq('ar'), r2, () => {}); console.error = log;
    eq(r2.code, 413); assert(ARABIC.test(r2.body.message));
    const r3 = mkRes(); const e3 = new Error('Nope'); e3.statusCode = 404; console.error = () => {}; eh(e3, mkReq('en'), r3, () => {}); console.error = log; eq(r3.body.message, 'Nope');
  });
  await test('rateLimit handler → 429 localized', () => {
    mocks['express-rate-limit'] = (opts) => opts; const rl = fresh('middleware/rateLimitMiddleware.js');
    const r = mkRes(); rl.handler(mkReq('ar'), r); eq(r.code, 429); assert(ARABIC.test(r.body.message));
  });
  await test('createNotification: skips self-notify, emits to recipient room', async () => {
    const emitted = []; const io = { to: (room) => ({ emit: (ev, p) => emitted.push({ room, ev, p }) }) };
    mocks['models/Notification'] = { create: async (d) => ({ ...d, populate: async function () { return this; } }) };
    const { createNotification } = fresh('services/notificationService.js');
    eq(await createNotification({ io, recipient: 'a', sender: 'a', type: 'like' }), null); eq(emitted.length, 0);
    await createNotification({ io, recipient: 'a', sender: 'b', type: 'like', post: 'p1' });
    eq(emitted.length, 1); eq(emitted[0].room, 'user:a'); eq(emitted[0].ev, 'notification:new');
  });
  await test('socket chat: message:send persists + delivers to every participant', async () => {
    const created = [], updated = [];
    mocks['models/Message'] = { create: async (d) => { const m = { _id: 'm1', ...d }; created.push(m); return m; } };
    mocks['models/Conversation'] = { findByIdAndUpdate: async (id, u) => updated.push({ id, u }), findById: async () => ({ participants: ['u1', 'u2'] }) };
    const emitted = []; const io = { to: (room) => ({ emit: (ev, p) => emitted.push({ room, ev, p }) }) };
    const handlers = {}; const socket = { userId: 'u1', on: (ev, fn) => { handlers[ev] = fn; } };
    fresh('socket/chatEvents.js')(io, socket);
    await handlers['message:send']({ conversationId: 'c1', text: 'مرحبا' });
    eq(created[0].sender, 'u1'); eq(created[0].text, 'مرحبا', 'Arabic text preserved'); eq(updated[0].u.lastMessage, 'm1');
    eq(emitted.filter((e) => e.ev === 'message:receive').map((e) => e.room).sort().join(), 'user:u1,user:u2');
    handlers['typing:start']({ conversationId: 'c1', recipientId: 'u2' });
    assert(emitted.some((e) => e.room === 'user:u2' && e.ev === 'typing:start' && e.p.userId === 'u1'), 'typing relayed');
  });
  await test('socket presence: online on connect, offline + lastSeen on disconnect', async () => {
    users = [{ _id: 'u9', isOnline: false }]; const bc = []; const handlers = {};
    const socket = { userId: 'u9', broadcast: { emit: (ev, p) => bc.push({ ev, p }) }, on: (ev, fn) => { handlers[ev] = fn; } };
    fresh('socket/presenceEvents.js')({}, socket); eq(users[0].isOnline, true); eq(bc[0].ev, 'user:online');
    await handlers.disconnect(); eq(users[0].isOnline, false); assert(users[0].lastSeen instanceof Date); eq(bc[1].ev, 'user:offline');
  });

  // ---- upload + env loading (regression: POST /api/upload returned 500) ----
  const quiet = async (fn) => { const e = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = e; } };
  let cloudCfg = true, cloudFail = false, lastFolder;
  mocks.streamifier = { createReadStream: () => ({ pipe: (st) => { st.__done(); return st; } }) };
  mocks['config/cloudinary'] = {
    isConfigured: () => cloudCfg,
    uploader: { upload_stream: (opts, cb) => { lastFolder = opts.folder; return { __done: () => (cloudFail ? cb(new Error('Invalid API key'), null) : cb(null, { secure_url: 'https://res.cloudinary.com/x/' + opts.folder + '/a.jpg', public_id: 'a1' })) }; } },
  };
  const upload = () => fresh('controllers/uploadController.js').uploadImage;
  await test('upload: no file → 400 localized', async () => {
    const r = mkRes(); await upload()(mkReq('ar', { body: {} }), r, () => {}); eq(r.code, 400); assert(ARABIC.test(r.body.message));
  });
  await test('upload: Cloudinary keys missing → clear 503 (not a blind 500)', async () => {
    cloudCfg = false; process.env.UPLOAD_DRIVER = 'cloudinary'; const r = mkRes(); let nexted = false;
    await quiet(() => upload()(mkReq('en', { file: { buffer: Buffer.from('x') }, body: {} }), r, () => { nexted = true; }));
    delete process.env.UPLOAD_DRIVER;
    eq(r.code, 503); eq(r.body.message, 'Image upload is not configured on the server'); assert(!nexted, 'must not fall through to the 500 handler'); cloudCfg = true;
  });
  process.env.UPLOAD_DRIVER = 'cloudinary'; // the next tests check Cloudinary-only behavior (no fallback)
  await test('upload: success → 201 { url, publicId }', async () => {
    const r = mkRes(); await upload()(mkReq('en', { file: { buffer: Buffer.from('x') }, body: { folder: 'rivvo/avatars' } }), r, (e) => { throw e; });
    eq(r.code, 201); assert(/^https:\/\//.test(r.body.url)); eq(r.body.publicId, 'a1'); eq(lastFolder, 'rivvo/avatars');
  });
  await test('upload: arbitrary folder names are ignored (allowlist)', async () => {
    const r = mkRes(); await upload()(mkReq('en', { file: { buffer: Buffer.from('x') }, body: { folder: '../../evil' } }), r, () => {}); eq(lastFolder, 'rivvo/posts');
  });
  await test('upload: Cloudinary rejects → 502 localized, real reason only outside production', async () => {
    cloudFail = true; const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development'; const dev = mkRes(); await quiet(() => upload()(mkReq('ar', { file: { buffer: Buffer.from('x') }, body: {} }), dev, () => {}));
    eq(dev.code, 502); assert(ARABIC.test(dev.body.message)); eq(dev.body.detail, 'Invalid API key'); assert(/CLOUDINARY_API_KEY/.test(dev.body.hint), 'hint for bad key');
    process.env.NODE_ENV = 'production'; const prod = mkRes(); await quiet(() => upload()(mkReq('en', { file: { buffer: Buffer.from('x') }, body: {} }), prod, () => {}));
    eq(prod.body.detail, undefined, 'no internals in production'); eq(prod.body.hint, undefined, 'no hint in production'); process.env.NODE_ENV = prev; cloudFail = false;
  });
  await test('multer fileFilter: rejects non-images with ONLY_IMAGES; errorMiddleware → 400 localized', async () => {
    mocks.multer = Object.assign((opts) => ({ opts }), { memoryStorage: () => ({}) });
    const m = fresh('middleware/uploadMiddleware.js'); let err;
    m.opts.fileFilter({}, { mimetype: 'application/pdf' }, (e) => { err = e; }); eq(err.code, 'ONLY_IMAGES');
    let ok; m.opts.fileFilter({}, { mimetype: 'image/png' }, (e, a) => { ok = a; }); eq(ok, true);
    const r = mkRes(); await quiet(() => fresh('middleware/errorMiddleware.js')(err, mkReq('ar'), r, () => {})); eq(r.code, 400); assert(ARABIC.test(r.body.message));
  });
  await test('500 handler exposes "detail" only outside production', async () => {
    const eh = fresh('middleware/errorMiddleware.js'); const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development'; const a = mkRes(); await quiet(() => eh(new Error('boom'), mkReq('en'), a, () => {})); eq(a.body.detail, 'boom');
    process.env.NODE_ENV = 'production'; const b = mkRes(); await quiet(() => eh(new Error('boom'), mkReq('en'), b, () => {})); eq(b.body.detail, undefined); process.env.NODE_ENV = prev;
  });
  await test('server.js loads .env first; environment.js reads server/.env and repo-root .env', async () => {
    eq(read(path.join(SERVER, 'server.js')).split('\n').find((l) => l.trim() && !l.trim().startsWith('//')).includes("require('./config/environment')"), true, 'first line');
    const rootEnv = path.join(ROOT, '.env'); const created = !fs.existsSync(rootEnv); if (created) fs.writeFileSync(rootEnv, 'X=1\n');
    const loaded = []; mocks.dotenv = { config: ({ path: f }) => { loaded.push(f); } };
    try { fresh('config/environment.js'); } finally { if (created) fs.rmSync(rootEnv); }
    assert(loaded.includes(rootEnv), 'repo-root .env must be loaded even when cwd is server/');
  });

  await test('upload hints: bad cloud name / secret / clock / network each get an actionable hint', async () => {
    const cases = [['Invalid cloud_name abc', /CLOUDINARY_CLOUD_NAME/], ['Invalid Signature xyz', /API_SECRET/], ['Stale request - reported time is 2 hours', /clock/], ['getaddrinfo ENOTFOUND api.cloudinary.com', /Cannot reach/]];
    const prev = process.env.NODE_ENV; process.env.NODE_ENV = 'development';
    for (const [msg, re] of cases) {
      mocks['config/cloudinary'].uploader.upload_stream = (opts, cb) => ({ __done: () => cb(new Error(msg), null) });
      const r = mkRes(); await quiet(() => upload()(mkReq('en', { file: { buffer: Buffer.from('x') }, body: {} }), r, () => {}));
      assert(re.test(r.body.hint || ''), `${msg} -> ${r.body.hint}`);
    }
    process.env.NODE_ENV = prev;
  });

  await test('upload 403: reads the raw reply and explains it (blocked network / restricted account / unreachable)', async () => {
    const prev = process.env.NODE_ENV; process.env.NODE_ENV = 'development';
    mocks['config/cloudinary'].uploader.upload_stream = (opts, cb) => ({ __done: () => cb(new Error('Server returned unexpected status code - 403'), null) });
    const run = async (probe) => { mocks['config/cloudinary'].probe = async () => probe; const r = mkRes(); await quiet(() => upload()(mkReq('en', { file: { buffer: Buffer.from('x') }, body: {} }), r, () => {})); return r; };
    let r = await run({ status: 403, body: '<html><title>Access Denied</title></html>' });
    eq(r.code, 502); assert(/raw reply: HTTP 403/.test(r.body.detail), r.body.detail); assert(/blocking/.test(r.body.hint) && /UPLOAD_DRIVER=local/.test(r.body.hint), r.body.hint);
    r = await run({ status: 403, body: '{"error":{"message":"Customer is marked as untrusted"}}' }); assert(/restricted/.test(r.body.hint), r.body.hint);
    r = await run({ error: 'ENOTFOUND' }); assert(/Cannot reach/.test(r.body.hint), r.body.hint);
    process.env.NODE_ENV = 'production'; r = await run({ status: 403, body: '<html>' }); eq(r.body.detail, undefined); eq(r.body.hint, undefined); process.env.NODE_ENV = prev;
    delete mocks['config/cloudinary'].probe;
  });
  delete process.env.UPLOAD_DRIVER;
  const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 7)]);
  const withLocal = async (fn) => {
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'rivvo-up-')); process.env.UPLOAD_DRIVER = 'local'; process.env.UPLOAD_DIR = dir;
    try { await fn(dir); } finally { delete process.env.UPLOAD_DRIVER; delete process.env.UPLOAD_DIR; fs.rmSync(dir, { recursive: true, force: true }); }
  };
  await test('local driver: saves a real PNG under /uploads and returns a usable url', () => withLocal(async (dir) => {
    const r = mkRes(); await upload()(mkReq('en', { file: { buffer: PNG }, body: { folder: 'rivvo/avatars' } }), r, (e) => { throw e; });
    eq(r.code, 201); assert(/^\/uploads\/rivvo\/avatars\/\d+-[a-f0-9]{16}\.png$/.test(r.body.url), r.body.url);
    assert(fs.readFileSync(path.join(dir, r.body.publicId)).equals(PNG), 'file written intact');
  }));
  await test('local driver: rejects a fake image (text with image mimetype) and cannot escape the upload dir', () => withLocal(async (dir) => {
    let err; await upload()(mkReq('en', { file: { buffer: Buffer.from('<script>alert(1)</script>............'), mimetype: 'image/png' }, body: {} }), mkRes(), (e) => { err = e; });
    eq(err && err.code, 'ONLY_IMAGES');
    const r = mkRes(); await upload()(mkReq('en', { file: { buffer: PNG }, body: { folder: '../../evil' } }), r, (e) => { throw e; });
    assert(r.body.publicId.startsWith('rivvo/posts/') && fs.existsSync(path.join(dir, r.body.publicId)), 'folder allowlist');
    eq(fs.existsSync(path.join(dir, '..', 'evil')), false);
  }));
  await test('auto driver: no Cloudinary keys → falls back to local (no more 503 out of the box)', () => withLocal(async () => {
    delete process.env.UPLOAD_DRIVER; cloudCfg = false;
    const r = mkRes(); await upload()(mkReq('en', { file: { buffer: PNG }, body: {} }), r, (e) => { throw e; }); eq(r.code, 201); assert(r.body.url.startsWith('/uploads/')); cloudCfg = true;
    eq(fresh('controllers/uploadController.js').pickDriver(), 'cloudinary', 'keys present → cloudinary');
  }));
  await test('auto driver: Cloudinary 403 → saved locally (201), not a 502; explicit cloudinary stays strict', () => withLocal(async (dir) => {
    delete process.env.UPLOAD_DRIVER; cloudCfg = true;
    let probed = 0; mocks['config/cloudinary'].probe = async () => { probed++; return { status: 403, body: '<html>Access Denied</html>' }; };
    mocks['config/cloudinary'].uploader.upload_stream = (opts, cb) => ({ __done: () => cb(new Error('Server returned unexpected status code - 403'), null) });
    const warn = console.warn; console.warn = () => {};
    try {
      const r = mkRes(); await quiet(() => upload()(mkReq('en', { file: { buffer: PNG }, body: { folder: 'rivvo/stories' } }), r, (e) => { throw e; }));
      eq(r.code, 201); assert(r.body.url.startsWith('/uploads/rivvo/stories/'), r.body.url); assert(fs.existsSync(path.join(dir, r.body.publicId)), 'file saved locally');
      await new Promise((ok) => setTimeout(ok, 10)); eq(probed, 1, 'raw reply is still logged for diagnosis');
      let err; await quiet(() => upload()(mkReq('en', { file: { buffer: Buffer.from('<script>alert(1)</script>............') }, body: {} }), mkRes(), (e) => { err = e; }));
      eq(err && err.code, 'ONLY_IMAGES', 'fake images are still rejected in fallback');
      process.env.UPLOAD_DRIVER = 'cloudinary'; const strict = mkRes(); await quiet(() => upload()(mkReq('en', { file: { buffer: PNG }, body: {} }), strict, () => {})); eq(strict.code, 502);
    } finally { console.warn = warn; delete mocks['config/cloudinary'].probe; cloudFail = false; }
  }));
  await test('auto driver fails fast: timeout + circuit breaker (no repeated 18s waits)', () => withLocal(async (dir) => {
    delete process.env.UPLOAD_DRIVER; cloudCfg = true; process.env.CLOUDINARY_TIMEOUT_MS = '40';
    let calls = 0; mocks['config/cloudinary'].uploader.upload_stream = () => { calls++; return { __done: () => {} }; }; // never answers = hung connection
    const warn = console.warn; console.warn = () => {};
    try {
      const ctl = fresh('controllers/uploadController.js'); const go = async () => { const r = mkRes(); const t0 = Date.now(); await quiet(() => ctl.uploadImage(mkReq('en', { file: { buffer: PNG }, body: {} }), r, (e) => { throw e; })); return { r, ms: Date.now() - t0 }; };
      const first = await go(); eq(first.r.code, 201); assert(first.r.body.url.startsWith('/uploads/'), 'local url'); assert(first.ms < 3000, `first upload took ${first.ms}ms`); eq(calls, 1);
      const second = await go(); eq(second.r.code, 201); eq(calls, 1, 'Cloudinary is skipped after a failure'); assert(second.ms < 500, `second upload took ${second.ms}ms`);
      const ctl2 = fresh('controllers/uploadController.js'); ctl2.markCloudinaryDown(); calls = 0;
      const r3 = mkRes(); await ctl2.uploadImage(mkReq('en', { file: { buffer: PNG }, body: {} }), r3, (e) => { throw e; }); eq(calls, 0, 'startup check can pre-mark Cloudinary as down'); eq(r3.code, 201);
    } finally { console.warn = warn; delete process.env.CLOUDINARY_TIMEOUT_MS; }
  }));
  await test('app serves /uploads cross-origin; vite proxies /uploads', () => {
    const app = read(path.join(SERVER, 'app.js')); assert(/express\.static/.test(app) && /Cross-Origin-Resource-Policy/.test(app), 'static + CORP');
    assert(/'\/uploads'/.test(read(path.join(ROOT, 'client', 'vite.config.js'))), 'vite proxy'); assert(/server\/uploads\//.test(read(path.join(ROOT, '.gitignore'))), 'gitignored');
  });

  Module._load = origLoad;

  // =====================================================================
  group('C. Client behavior');
  const { pathToFileURL } = require('url');
  const imp = (p) => import(pathToFileURL(path.join(CLIENT, p)).href);
  await test('formatDate: English + Arabic relative time', async () => {
    const { formatDate } = await imp('utils/formatDate.js'); const twoH = new Date(Date.now() - 2 * 3600e3);
    assert(/2 hours ago/.test(formatDate(twoH, 'en')), formatDate(twoH, 'en')); assert(ARABIC.test(formatDate(twoH, 'ar')), 'Arabic expected');
    assert(/seconds? ago|now/.test(formatDate(new Date(), 'en')));
  });
  await test('formatNumber: compact en + ar', async () => {
    const { formatNumber } = await imp('utils/formatNumber.js'); assert(/^12(\.4)?K$/.test(formatNumber(12400, 'en')), formatNumber(12400, 'en'));
    eq(formatNumber(7, 'en'), '7'); assert(ARABIC.test(formatNumber(12400, 'ar')) || /[٠-٩]/.test(formatNumber(12400, 'ar')), 'Arabic formatting');
  });
  await test('client getErrorMessage shows server message + dev detail + hint', async () => {
    const { getErrorMessage } = await imp('utils/errorMessage.js');
    eq(getErrorMessage({ response: { data: { message: 'Upload failed', detail: 'Invalid Signature', hint: 'Secret wrong' } } }, 'x'), 'Upload failed (Invalid Signature) — Secret wrong');
    eq(getErrorMessage({ response: { data: { message: 'Only images' } } }, 'x'), 'Only images');
    assert(getErrorMessage({ message: 'Network Error' }, 'Upload failed').includes('Network Error'));
  });
  await test('validators: email / username / password', async () => {
    const v = await imp('utils/validators.js');
    assert(v.isValidEmail('a@b.co') && !v.isValidEmail('nope') && !v.isValidEmail('a@b'));
    assert(v.isValidUsername('omar_y.1') && !v.isValidUsername('ab') && !v.isValidUsername('has space'));
    assert(v.isStrongPassword('12345678') && !v.isStrongPassword('1234567'));
  });

  let React, renderToStaticMarkup;
  try { React = require('react'); ({ renderToStaticMarkup } = require('react-dom/server')); } catch { /* optional */ }
  if (!ts || !React) skip('i18n render tests', 'typescript/react not resolvable');
  else {
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'rivvo-'));
    const out = (p) => path.join(tmp, p.replace(/\.jsx$/, '.js'));
    for (const p of ['i18n/translations.js', 'context/LanguageContext.jsx', 'components/common/LanguageSwitcher.jsx']) {
      fs.mkdirSync(path.dirname(out(p)), { recursive: true });
      fs.writeFileSync(out(p), ts.transpileModule(read(path.join(CLIENT, p)), { fileName: p.replace(/\.js$/, '.jsx'),
        compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText);
    }
    const store = {}; const dom = { documentElement: { setAttribute() {} }, title: '' };
    global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } }; global.document = dom;
    const { LanguageProvider, useLanguage } = require(out('context/LanguageContext.jsx')); const Switcher = require(out('components/common/LanguageSwitcher.jsx')).default;
    const Probe = ({ k, vars }) => React.createElement('span', { 'data-dir': useLanguage().dir }, useLanguage().t(k, vars));
    const render = (lang, el) => { store.rivvo_lang = lang; return renderToStaticMarkup(React.createElement(LanguageProvider, null, el)); };

    await test('Arabic: translated text + dir=rtl; English: dir=ltr', () => {
      const ar = render('ar', React.createElement(Probe, { k: 'login' })); assert(ar.includes('تسجيل الدخول') && ar.includes('data-dir="rtl"'), ar);
      const en = render('en', React.createElement(Probe, { k: 'login' })); assert(en.includes('Log In') && en.includes('data-dir="ltr"'), en);
    });
    await test('interpolation {email} works in both languages', () => {
      assert(render('ar', React.createElement(Probe, { k: 'resetSentTo', vars: { email: 'o@x.com' } })).includes('o@x.com'));
      assert(render('en', React.createElement(Probe, { k: 'resetSentTo', vars: { email: 'o@x.com' } })).includes('o@x.com'));
    });
    await test('unknown key falls back to the key itself (no crash)', () => assert(render('ar', React.createElement(Probe, { k: 'does_not_exist' })).includes('does_not_exist')));
    await test('LanguageSwitcher offers exactly English + العربية, localized label', () => {
      const html = render('ar', React.createElement(Switcher));
      assert(html.includes('English') && html.includes('العربية') && html.includes('aria-label="اللغة"'), html);
      eq((html.match(/<option/g) || []).length, 2, 'only two languages');
    });
    fs.rmSync(tmp, { recursive: true, force: true });
  }


  group('D. Redux slices (reducer logic with a minimal RTK stand-in)');
  if (!ts) skip('slice reducers', 'typescript not resolvable');
  else {
    const tmp2 = fs.mkdtempSync(path.join(require('os').tmpdir(), 'rivvo-slice-'));
    const load = (name) => {
      const code = ts.transpileModule(read(path.join(CLIENT, 'store', name + '.js')), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const f = path.join(tmp2, name + '.js'); fs.writeFileSync(f, code); delete require.cache[f]; return require(f);
    };
    const toolkit = {
      createAsyncThunk: (type, creator) => { const t = (a) => creator(a); t.pending = { type: type + '/pending' }; t.fulfilled = { type: type + '/fulfilled' }; t.rejected = { type: type + '/rejected' }; return t; },
      createSlice: ({ name, initialState, reducers = {}, extraReducers }) => {
        const cases = {}; const b = { addCase(a, fn) { cases[a.type] = fn; return b; } }; extraReducers && extraReducers(b);
        const actions = {}; Object.keys(reducers).forEach((k) => { actions[k] = (payload) => ({ type: `${name}/${k}`, payload }); cases[`${name}/${k}`] = (st, a) => reducers[k](st, a); });
        return { actions, reducer: (state = initialState, action) => { const fn = cases[action.type]; if (!fn) return state; const d = JSON.parse(JSON.stringify(state)); const r = fn(d, action); return r === undefined ? d : r; } };
      },
    };
    const o = Module._load; const stub = new Proxy({}, { get: () => () => Promise.resolve([]) });
    Module._load = function (req) { if (req === '@reduxjs/toolkit') return toolkit; if (/services\//.test(req)) return { default: stub }; return o.apply(this, arguments); };
    const post = load('postSlice'), chat = load('chatSlice'), notif = load('notificationSlice');
    const reduce = (r, st, type, payload, meta) => r(st, { type, payload, meta });

    await test('feed pagination: page 2 is appended (not replaced) and page advances', () => {
      const r = post.default; let st = r(undefined, { type: '@@init' });
      st = reduce(r, st, 'post/fetchFeed/fulfilled', [{ _id: 'a' }, { _id: 'b' }], { arg: 1 });
      st = reduce(r, st, 'post/fetchFeed/fulfilled', [{ _id: 'c' }], { arg: 2 });
      eq(st.items.map((p) => p._id).join(), 'a,b,c', 'items'); eq(st.page, 2, 'page');
    });
    await test('feed pagination: empty page sets hasMore=false; refresh (page 1) resets list', () => {
      const r = post.default; let st = r(undefined, { type: '@@init' });
      st = reduce(r, st, 'post/fetchFeed/fulfilled', [{ _id: 'a' }], { arg: 1 });
      st = reduce(r, st, 'post/fetchFeed/fulfilled', [], { arg: 2 }); eq(st.hasMore, false);
      st = reduce(r, st, 'post/fetchFeed/fulfilled', [{ _id: 'z' }], { arg: 1 }); eq(st.items.length, 1); eq(st.items[0]._id, 'z');
    });
    await test('createPost prepends; toggleLike updates likes; addComment appends', () => {
      const r = post.default; let st = { ...r(undefined, { type: '@@init' }), items: [{ _id: 'a', likes: [], comments: [] }] };
      st = reduce(r, st, 'post/createPost/fulfilled', { _id: 'new' }); eq(st.items[0]._id, 'new');
      st = reduce(r, st, 'post/toggleLike/fulfilled', { id: 'a', likes: ['u1'] }); eq(st.items.find((p) => p._id === 'a').likes.length, 1);
      st = r(st, post.addComment({ postId: 'a', comment: { _id: 'c1', text: 'hi' } })); eq(st.items.find((p) => p._id === 'a').comments.length, 1);
    });
    await test('chat: receiveMessage appends per conversation; typing set/cleared', () => {
      const r = chat.default; let st = r(undefined, { type: '@@init' });
      st = r(st, chat.receiveMessage({ _id: 'm1', conversation: 'c1', text: 'مرحبا' })); st = r(st, chat.receiveMessage({ _id: 'm2', conversation: 'c1' }));
      eq(st.messagesByConversation.c1.length, 2);
      st = r(st, chat.setTyping({ conversationId: 'c1', userId: 'u2', isTyping: true })); eq(st.typingUsers.c1, 'u2');
      st = r(st, chat.setTyping({ conversationId: 'c1', userId: 'u2', isTyping: false })); eq(st.typingUsers.c1, null);
    });
    await test('notifications: live add bumps unread; reading decrements once, never below 0', () => {
      const r = notif.default; let st = r(undefined, { type: '@@init' });
      st = r(st, notif.addNotification({ _id: 'n1', read: false })); eq(st.unreadCount, 1);
      st = reduce(r, st, 'notification/read/fulfilled', 'n1'); eq(st.unreadCount, 0);
      st = reduce(r, st, 'notification/read/fulfilled', 'n1'); eq(st.unreadCount, 0, 'second read is a no-op');
    });
    Module._load = o; fs.rmSync(tmp2, { recursive: true, force: true });
  }

  // ---------- summary ----------
  const failed = results.filter((r) => r.ok === false), passed = results.filter((r) => r.ok).length, skipped = results.filter((r) => r.skipped).length;
  console.log(`\n${'='.repeat(48)}\n${passed} passed, ${failed.length} failed, ${skipped} skipped (${results.length - skipped} run)`);
  if (failed.length) { console.log('\nFailures:'); failed.forEach((f) => console.log(`  - [${f.section}] ${f.name}`)); }
  process.exit(failed.length ? 1 : 0);
}
main();
