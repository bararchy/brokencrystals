import { test, before, after } from 'node:test';
import { Severity, AttackParamLocation, HttpMethod } from '@sectester/scan';
// Other setup and teardown logic from the test skeleton

const timeout = 40 * 60 * 1000;
const baseUrl = process.env.BRIGHT_TARGET_URL!;

// Test for GET /api/products/latest

test('GET /api/products/latest', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['business_constraint_bypass', 'sqli', 'date_manipulation', 'csrf'],
      attackParamLocations: [AttackParamLocation.QUERY],
      skipStaticParams: false // Only relevant for date_manipulation
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.GET,
      url: `${baseUrl}/api/products/latest`,
      query: {
        limit: '3'
      }
    });
});
