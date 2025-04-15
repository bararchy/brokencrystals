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

test('POST /api/chat/query', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['excessive_data_exposure', 'secret_tokens', 'server_side_js_injection', 'csrf', 'http_method_fuzzing'],
      attackParamLocations: [AttackParamLocation.BODY, AttackParamLocation.HEADER]
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/chat/query`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ "role": "user", "content": "Hello, how are you?" }])
    });
});
