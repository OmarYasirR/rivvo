#!/usr/bin/env node
/**
 * Cloudinary connectivity check:  npm run check:cloudinary
 * Runs 3 real probes and prints Cloudinary's own responses so you can see WHY uploads fail.
 */
require('../config/environment');
const https = require('https');
const cloudinary = require('../config/cloudinary');

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const line = (s = '') => console.log(s);
const errMsg = (e) => `${e?.message || e?.error?.message || e?.code || e}${e?.http_code ? ` (http ${e.http_code})` : ''}`;

(async () => {
  line('Cloudinary check');
  line('----------------');
  line(`cloud name : ${process.env.CLOUDINARY_CLOUD_NAME || '(missing)'}`);
  line(`api key    : ${process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.slice(0, 4) + '...' : '(missing)'}`);
  line(`api secret : ${process.env.CLOUDINARY_API_SECRET ? 'set' : '(missing)'}`);
  if (!cloudinary.isConfigured()) {
    line('\nX Keys are missing: fill CLOUDINARY_* in .env and run again.');
    process.exit(1);
  }

  // 1) Admin API ping — validates credentials end-to-end
  let pingOk = false;
  let pingMsg = '';
  try {
    const r = await cloudinary.api.ping();
    pingOk = r && r.status === 'ok';
    pingMsg = JSON.stringify(r);
  } catch (e) {
    pingMsg = errMsg(e);
  }
  line(`\n1) Admin API ping              -> ${pingOk ? 'OK ' : 'FAILED: '}${pingMsg}`);

  // 2) Raw network reachability — proves DNS/TLS/firewall allow api.cloudinary.com
  const raw = await new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/ping`,
        method: 'GET',
        timeout: 8000,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
  line(
    `2) Raw HTTPS reachability      -> ${
      raw.error ? 'network error: ' + raw.error : `HTTP ${raw.status}  ${(raw.body || '').slice(0, 160)}`
    }`
  );

  // 3) SDK upload — exactly what the app does
  let sdkOk = false;
  let sdkMsg = '';
  try {
    const r = await cloudinary.uploader.upload(TINY_PNG, {
      public_id: 'rivvo/_probe_sdk',
      overwrite: true,
      timeout: 15000,
    });
    sdkOk = true;
    sdkMsg = r.secure_url;
  } catch (e) {
    sdkMsg = errMsg(e);
  }
  line(`3) SDK upload (what Rivvo uses) -> ${sdkOk ? 'OK ' + sdkMsg : 'FAILED: ' + sdkMsg}`);

  line('\nVerdict');
  line('-------');
  if (raw.error) {
    line('X Cannot reach api.cloudinary.com from Node: internet, VPN, proxy, firewall or antivirus is blocking it.');
  } else if (/401|403|invalid|unauthori|unknown|signature/i.test(pingMsg) && !pingOk) {
    line('X Credentials rejected. Re-copy cloud name / api key / api secret from the dashboard and restart the server.');
  } else if (pingOk && sdkOk) {
    line('OK Everything works. Restart the Node server — uploads will succeed.');
  } else if (pingOk && !sdkOk) {
    line('X Admin API works but uploader fails. See message above.');
    line('  Common causes: untrusted account (verify email/phone), usage limit, or a network device filtering multipart.');
  } else {
    line('X Unknown combination — inspect the three lines above.');
  }
})().catch((e) => {
  console.error('check failed:', e);
  process.exit(1);
});