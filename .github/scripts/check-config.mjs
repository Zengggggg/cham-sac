import { commitSha, httpsOrigin, required, runCli } from './config.mjs';

export function checkConfig(env) {
    for (const name of ['RENDER_API_KEY', 'VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID']) required(env, name);
    if (!/^srv-[a-z0-9]+$/.test(required(env, 'RENDER_SERVICE_ID'))) throw new Error('Invalid RENDER_SERVICE_ID');
    for (const name of ['PRODUCTION_BACKEND_URL', 'PRODUCTION_FRONTEND_URL']) httpsOrigin(required(env, name), name);
    commitSha(required(env, 'EXPECTED_COMMIT_SHA'));
    const assetPath = required(env, 'AR_SMOKE_ASSET_PATH');
    if (!assetPath.startsWith('/ar-assets/') || !assetPath.endsWith('.glb') || /[?#\r\n]/.test(assetPath)) {
        throw new Error('AR_SMOKE_ASSET_PATH must be a /ar-assets/... .glb path without query or fragment');
    }
}

runCli(import.meta.url, async () => {
    checkConfig(process.env);
    console.log('Deployment configuration is present. Secret values are not printed.');
});
