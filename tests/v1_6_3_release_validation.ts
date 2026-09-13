import { spawn, spawnSync, ChildProcess } from 'child_process';

const BASE_URL = 'http://127.0.0.1:3000';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npx.cmd' : 'npx';

function run(command: string, args: string[], label: string): void {
  console.log(`\n===== ${label} =====`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

async function waitForServer(timeoutMs = 20000): Promise<void> {
  const started = Date.now();
  let lastError = 'server not ready';

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/health`);
      if (response.status === 200) {
        return;
      }
      lastError = `health returned ${response.status}`;
    } catch (error: any) {
      lastError = error?.message || String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${BASE_URL}: ${lastError}`);
}

async function main(): Promise<void> {
  let server: ChildProcess | undefined;

  try {
    console.log('================================================================');
    console.log(' MEDREP AI v1.6.3 — RELEASE VALIDATION (NO GEMINI AI QUERIES)');
    console.log('================================================================');

    console.log('\n===== STARTING LOCAL SERVER =====');
    server = spawn(npmCommand, ['tsx', 'server.ts'], {
      stdio: 'inherit',
      shell: false,
      env: process.env,
    });

    await waitForServer();
    console.log('✓ Local server health check passed.');

    // Deterministic v1.6.3 feature coverage.
    run(npmCommand, ['tsx', 'tests/test_v1_6_3_doctor_master_route.ts'], 'v1.6.3 Doctor Master + Route');

    // Server-backed CRM coverage. These suites do not require /api/v1/ai/chat.
    run(npmCommand, ['tsx', 'tests/test_v1_6_2_360_experience.ts'], 'v1.6.2 Doctor 360 + Patient 360');
    run(npmCommand, ['tsx', 'tests/test_v1_6_1_foundation.ts'], 'v1.6.1 CRM Foundation');

    // Product/competitor deterministic guardrails.
    run(npmCommand, ['tsx', 'tests/test_v1_5_2_competitor_retrieval.ts'], 'v1.5.2 Competitor Retrieval');
    run(npmCommand, ['tsx', 'tests/test_v1_5_3_competitor_claim_guard.ts'], 'v1.5.3 Competitor Claim Guard');
    run(npmCommand, ['tsx', 'tests/test_v1_5_4_competitor_deterministic.ts'], 'v1.5.4 Deterministic Competitor Responses');
    run(npmCommand, ['tsx', 'tests/regression-test.ts'], 'Comprehensive Product Regression');

    // Static validation and production build.
    run(npmCommand, ['tsc', '--noEmit'], 'TypeScript Typecheck');
    run('npm', ['run', 'build'], 'Production Build');

    console.log('\n================================================================');
    console.log(' RELEASE VALIDATION PASSED');
    console.log(' Gemini-dependent runtime/API suites intentionally excluded.');
    console.log('================================================================');
  } finally {
    if (server && !server.killed) {
      server.kill();
    }
  }
}

main().catch((error) => {
  console.error('\nRELEASE VALIDATION FAILED:', error);
  process.exit(1);
});
