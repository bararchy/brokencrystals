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

test('POST /api/metadata', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['xxe', 'xss', 'secret_tokens', 'open_database'],
      attackParamLocations: [AttackParamLocation.BODY, AttackParamLocation.HEADER]
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/metadata`,
      body: `\u003csvg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 915 585"\u003e\u003cg stroke-width="3.45" fill="none"\u003e\u003cpath stroke="#000" d="M11.8 11.8h411v411l-411 .01v-411z"/\u003e\u003cpath stroke="#448" d="M489 11.7h415v411H489v-411z"/\u003e\u003c/g\u003e\u003c/svg\u003e`,
      headers: { 'Content-Type': 'text/xml' }
    });
});
