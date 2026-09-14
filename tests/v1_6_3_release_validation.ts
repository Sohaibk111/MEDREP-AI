import { spawn, spawnSync, ChildProcess } from 'child_process';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:3000';
const isWindows = process.platform === 'win32';
const tsxBin = path.resolve(process.cwd(), 'node_modules', '.bin', isWindows ? 'tsx.cmd' : 'tsx');
const tscBin = path.resolve(process.cwd(), 'node_modules', '.bin', isWindows ? 'tsc.cmd' : 'tsc');

function run(command: string, args: string[], label: string): void {
  console.log(`\n===== ${label} =====`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
    windowsVerbatimArguments: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

async function waitForServer(timeoutMs = 30000): Promise<void> {
  const started = Date.now();
  let lastError = 'server not ready';

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/health`);
      if (response.status === 200) return;
      lastError = `health returned ${response.status}`;
    } catch (error: any) {
      lastError = error?.message || String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${BASE_URL}: ${lastError}`);
}

function startServer(): ChildProcess {
  if (isWindows) {
    return spawn('cmd.exe', ['/d', '/s', '/c', 'npm run dev'], {
      stdio: 'inherit',
      shell: false,
      env: process.env,
      windowsHide: false,
    });
  }

  return spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });
}

function stopServer(server: ChildProcess): void {
  if (server.killed) return;

  if (isWindows && server.pid) {
    spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], {
      stdio: 'ignore',
      shell: false,
    });
    return;
  }

  server.kill('SIGTERM');
}

async function main(): Promise<void> {
  let server: ChildProcess | undefined;

  try {
    console.log('================================================================');
    console.log(' MEDREP AI v1.6.3 — RELEASE VALIDATION (NO GEMINI AI QUERIES)');
    console.log('================================================================');

    console.log('\n===== STARTING LOCAL SERVER =====');
    server = startServer();

    await waitForServer();
    console.log('✓ Local server health check passed.');

    run(tsxBin, ['tests/test_v1_6_3_doctor_master_route.ts'], 'v1.6.3 Doctor Master + Route');
    run(tsxBin, ['tests/test_v1_6_2_360_experience.ts'], 'v1.6.2 Doctor 360 + Patient 360');
    run(tsxBin, ['tests/test_v1_6_1_foundation.ts'], 'v1.6.1 CRM Foundation');
    run(tsxBin, ['tests/test_v1_5_2_competitor_retrieval.ts'], 'v1.5.2 Competitor Retrieval');
    run(tsxBin, ['tests/test_v1_5_3_competitor_claim_guard.ts'], 'v1.5.3 Competitor Claim Guard');
    run(tsxBin, ['tests/test_v1_5_4_competitor_deterministic.ts'], 'v1.5.4 Deterministic Competitor Responses');
    run(tsxBin, ['tests/regression-test.ts'], 'Comprehensive Product Regression');
    run(tscBin, ['--noEmit'], 'TypeScript Typecheck');
    run(process.env.npm_execpath || 'npm', ['run', 'build'], 'Production Build');

    console.log('\n================================================================');
    console.log(' RELEASE VALIDATION PASSED');
    console.log(' Gemini-dependent runtime/API suites intentionally excluded.');
    console.log('================================================================');
  } finally {
    if (server) stopServer(server);
  }
}

main().catch((error) => {
  console.error('\nRELEASE VALIDATION FAILED:', error);
  process.exit(1);
});
