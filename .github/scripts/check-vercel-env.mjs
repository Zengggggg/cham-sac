import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { httpsOrigin, required, runCli } from './config.mjs';

export function checkVercelEnvironment(values, expectedBackendUrl) {
    const actual = httpsOrigin(required(values, 'VITE_API_URL'), 'VITE_API_URL');
    if (actual !== httpsOrigin(expectedBackendUrl, 'PRODUCTION_BACKEND_URL')) {
        throw new Error('Vercel production VITE_API_URL must match PRODUCTION_BACKEND_URL');
    }
}

runCli(import.meta.url, async () => {
    const values = parseEnv(await readFile('.vercel/.env.production.local', 'utf8'));
    checkVercelEnvironment(values, required(process.env, 'PRODUCTION_BACKEND_URL'));
    console.log('Vercel production API origin matches the release backend.');
});
