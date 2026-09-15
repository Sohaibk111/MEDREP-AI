import { execFileSync } from 'node:child_process';

const commands = [
  ['tests/test_v1_6_4_company_assignment.ts'],
  ['tests/test_v1_6_4_api_contract.ts'],
  ['tests/test_v1_6_4_route_integration.ts']
] as const;

for (const [script] of commands) {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', script], { stdio: 'inherit' });
}

console.log('v1.6.4 deterministic validation passed');
