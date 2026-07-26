import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

await import('../server.ts');
