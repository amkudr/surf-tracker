import { spawn } from 'child_process';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runCommand(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      env,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

async function migrateDatabase(env: NodeJS.ProcessEnv) {
  if (env.SKIP_MIGRATIONS === 'true' || env.USE_EXTERNAL_SERVERS === 'true') {
    console.log('[global-setup] Skipping migrations (external stack assumed)');
    return;
  }
  const alembicCmd = env.ALEMBIC_CMD ?? 'alembic';
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await runCommand('bash', ['-lc', `cd .. && ${alembicCmd} upgrade head`], env);
      return;
    } catch (err) {
      if (attempt === maxAttempts) {
        throw err;
      }
      // Wait a bit for Postgres to become ready.
      await sleep(2000 * attempt);
    }
  }
}

export default async function globalSetup() {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL:
      process.env.DATABASE_URL ??
      'postgresql+asyncpg://postgres:postgres@localhost:5432/surf_tracker',
    SECRET_KEY: process.env.SECRET_KEY ?? 'dev-secret-key',
    CORS_ALLOWED_ORIGINS:
      process.env.CORS_ALLOWED_ORIGINS ??
      '["http://localhost:4173","http://127.0.0.1:4173"]',
  };

  await migrateDatabase(env);
}
