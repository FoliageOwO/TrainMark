import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [, , ...rawArgs] = process.argv;

const extraEnv = {};
const scriptArgs = [];
let scriptPath = '';

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];
  if (arg === '--env') {
    const assignment = rawArgs[index + 1];
    index += 1;
    if (!assignment || !assignment.includes('=')) {
      console.error('Usage: --env KEY=VALUE');
      process.exit(1);
    }
    const [key, ...valueParts] = assignment.split('=');
    extraEnv[key] = valueParts.join('=');
    continue;
  }
  if (!scriptPath) {
    scriptPath = arg;
    continue;
  }
  if (arg === '--') {
    continue;
  }
  scriptArgs.push(arg);
}

if (!scriptPath) {
  console.error('Usage: node scripts/lib/run-bash-script.mjs <script> [...args]');
  process.exit(1);
}

const candidates = [
  process.env.TRAINMARK_BASH,
  'C:\\Program Files\\Git\\bin\\bash.exe',
  'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
  'E:\\Git\\bin\\bash.exe',
  'E:\\Git\\usr\\bin\\bash.exe',
  'bash',
].filter(Boolean);

let lastError = null;
for (const command of candidates) {
  if (command.includes('\\') && !existsSync(command)) {
    continue;
  }

  const result = spawnSync(command, [scriptPath, ...scriptArgs], {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: false,
  });

  if (result.error) {
    lastError = result.error;
    if (result.error.code === 'ENOENT') {
      continue;
    }
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

if (lastError) {
  console.error(lastError.message);
}
console.error('Unable to find bash. Install Git Bash or set TRAINMARK_BASH to bash.exe.');
process.exit(1);
