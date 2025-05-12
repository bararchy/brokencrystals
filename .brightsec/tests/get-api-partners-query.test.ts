import { test, before, after } from 'node:test';
import { Severity, AttackParamLocation, HttpMethod } from '@sectester/scan';
// Other setup and teardown logic from the test skeleton

const timeout = 40 * 60 * 1000;
const baseUrl = process.env.BRIGHT_TARGET_URL!;

// Test for GET /api/partners/query

test('GET /api/partners/query', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['xpathi', 'xss', 'full_path_disclosure'],
      attackParamLocations: [AttackParamLocation.QUERY],
      skipStaticParams: false // Not required for the tests specified
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.GET,
      url: `${baseUrl}/api/partners/query`,
      headers: { 'Content-Type': 'text/xml' },
      queryString: { xpath: '/partners/partner/name' }
    });
});