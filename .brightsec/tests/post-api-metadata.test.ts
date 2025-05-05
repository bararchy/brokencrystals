import { test, before, after } from 'node:test';
import { Severity, AttackParamLocation, HttpMethod } from '@sectester/scan';
import { SecRunner } from '@sectester/runner';

let runner!: SecRunner;

before(async () => {
  runner = new SecRunner({
    hostname: process.env.BRIGHT_HOSTNAME!,
    projectId: process.env.BRIGHT_PROJECT_ID!
  });

  await runner.init();
});

after(() => runner.clear());

const timeout = 40 * 60 * 1000;
const baseUrl = process.env.BRIGHT_TARGET_URL!;

// Test for POST /api/metadata

test('POST /api/metadata', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['xxe', 'secret_tokens', 'osi', 'unvalidated_redirect'],
      attackParamLocations: [AttackParamLocation.BODY]
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/metadata`,
      body: `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 915 585">\n  <g stroke-width="3.45" fill="none">\n    <path stroke="#000" d="M11.8 11.8h411v411l-411 .01v-411z"/>\n    <path stroke="#448" d="M489 11.7h415v411H489v-411z"/>\n  </g>\n</svg>`,
      headers: { 'Content-Type': 'text/xml' }
    });
});
