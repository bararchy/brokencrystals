import { test, before, after } from 'node:test';
import { SecRunner } from '@sectester/runner';
import { Severity, AttackParamLocation, HttpMethod } from '@sectester/scan';

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

test('PUT /api/file/raw', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['file_upload', 'lfi', 'excessive_data_exposure', 'osi'],
      attackParamLocations: [AttackParamLocation.BODY, AttackParamLocation.PATH]
    })
    .threshold(Severity.CRITICAL)
    .timeout(timeout)
    .run({
      method: HttpMethod.PUT,
      url: `${baseUrl}/api/file/raw?path=some/path/to/file.png`,
      body: '<file content>'
    });
});
