import { test, before, after } from 'node:test';
import { Severity, AttackParamLocation, HttpMethod } from '@sectester/scan';
// Other setup and teardown logic from the test skeleton

const timeout = 40 * 60 * 1000;
const baseUrl = process.env.BRIGHT_TARGET_URL!;

test('GET /api/users/search/john', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['sqli', 'xss', 'id_enumeration', 'csrf'],
      attackParamLocations: [AttackParamLocation.QUERY]
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.GET,
      url: `${baseUrl}/api/users/search/john`
    });
});
