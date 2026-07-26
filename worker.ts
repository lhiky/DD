import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

async function main() {
  const { runWorkerLoop } = await import('./src/workers/osv-worker.ts');
  await runWorkerLoop();
}

main().catch((error) => {
  console.error(JSON.stringify({
    event: 'worker_fatal',
    code: error?.code || 'WORKER_FATAL',
  }));
  process.exitCode = 1;
});
