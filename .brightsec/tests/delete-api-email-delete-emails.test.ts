import { test, before, after } from 'node:test';
import { Severity, AttackParamLocation, HttpMethod } from '@sectester/scan';
import { SecRunner } from '@sectester/runner';

let runner!: SecRunner;

const timeout = 40 * 60 * 1000;
const baseUrl = process.env.BRIGHT_TARGET_URL!;

before(async () => {
  runner = new SecRunner({
    hostname: process.env.BRIGHT_HOSTNAME!,
    projectId: process.env.BRIGHT_PROJECT_ID!
  });

  await runner.init();
});

after(() => runner.clear());

// Test case for DELETE /api/email/deleteEmails

test('DELETE /api/email/deleteEmails', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['csrf', 'bopla', 'proto_pollution', 'improper_asset_management', 'http_method_fuzzing'],
      attackParamLocations: [AttackParamLocation.HEADER, AttackParamLocation.PATH]
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.DELETE,
      url: `${baseUrl}/api/email/deleteEmails`,
      headers: { 'Authorization': 'Bearer test-token' }
    });
});
