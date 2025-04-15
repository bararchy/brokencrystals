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

test('POST /api/users/oidc', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['csrf', 'excessive_data_exposure', 'ldap_injection', 'sqli', 'xss', 'xxe'],
      attackParamLocations: [AttackParamLocation.BODY]
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/users/oidc`,
      body: {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
      }
    });
});
