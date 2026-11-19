import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { commitSha, httpsOrigin, required, runCli } from './config.mjs';

export async function retry(check, { attempts = 12, sleep = delay, intervalMs = 5000 } = {}) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try { return await check(); } catch (error) {
            if (attempt + 1 === attempts) throw error;
            await sleep(intervalMs);
        }
    }
}

export async function smokeBackend({ backendUrl, frontendUrl, sha, fetchImpl = fetch }) {
    const get = async (path) => {
        const response = await fetchImpl(`${backendUrl}${path}`, {
            headers: { Origin: frontendUrl }, signal: AbortSignal.timeout(15000)
        });
        assert.equal(response.status, 200, `Backend ${path} must return 200`);
        assert.equal(response.headers.get('access-control-allow-origin'), frontendUrl, 'Backend CORS must allow the production frontend');
        assert.equal(response.headers.get('access-control-allow-credentials'), 'true', 'Backend must allow credentialed CORS');
        const body = await response.json();
        assert.equal(body.success, true);
        assert.equal(body.statusCode, 200);
        return body.data;
    };
    const readiness = await get('/chamsacviet/health/ready');
    assert.equal(readiness.status, 'ready');
    assert.equal(readiness.commitSha, sha, 'Backend URL is serving a different release');
    const ar = await get('/chamsacviet/ar/experiences');
    assert.ok(Array.isArray(ar.experiences), 'AR API must return an experiences array');
}

export async function smokeFrontend({ frontendUrl, sha, assetPath, fetchImpl = fetch }) {
    for (const path of ['/', '/ar', '/login']) {
        const response = await fetchImpl(`${frontendUrl}${path}`, { signal: AbortSignal.timeout(15000) });
        assert.equal(response.status, 200, `Frontend ${path} must return 200`);
        assert.match(response.headers.get('content-type') || '', /text\/html/);
        assert.match(await response.text(), /id=["']root["']/, `Frontend ${path} must serve the React app`);
        if (path === '/ar') assert.match(response.headers.get('permissions-policy') || '', /camera=\(self\)/);
    }
    const release = await fetchImpl(`${frontendUrl}/release.json?commit=${sha}`, {
        cache: 'no-store', signal: AbortSignal.timeout(15000)
    });
    assert.equal(release.status, 200);
    assert.equal((await release.json()).commitSha, sha, 'Production domain is serving a different frontend release');
    const asset = await fetchImpl(`${frontendUrl}${assetPath}`, {
        headers: { Range: 'bytes=0-11' }, signal: AbortSignal.timeout(15000)
    });
    assert.ok([200, 206].includes(asset.status), 'AR asset proxy must return GLB content');
    // Some origins ignore Range. Read only the header and cancel the remaining body.
    const reader = asset.body.getReader();
    let header = Buffer.alloc(0);
    try {
        while (header.length < 4) {
            const { value, done } = await reader.read();
            if (done) break;
            header = Buffer.concat([header, Buffer.from(value).subarray(0, 4 - header.length)]);
        }
    } finally { await reader.cancel(); }
    assert.equal(header.toString('ascii'), 'glTF', 'AR proxy must serve a GLB, not the SPA fallback HTML');
}

runCli(import.meta.url, async () => {
    const sha = commitSha(required(process.env, 'EXPECTED_COMMIT_SHA'));
    const frontendUrl = httpsOrigin(required(process.env, 'PRODUCTION_FRONTEND_URL'), 'PRODUCTION_FRONTEND_URL');
    const target = process.argv[2];
    if (target === 'backend') {
        const backendUrl = httpsOrigin(required(process.env, 'PRODUCTION_BACKEND_URL'), 'PRODUCTION_BACKEND_URL');
        await retry(() => smokeBackend({ backendUrl, frontendUrl, sha }));
    } else if (target === 'frontend') {
        await retry(() => smokeFrontend({ frontendUrl, sha, assetPath: required(process.env, 'AR_SMOKE_ASSET_PATH') }));
    } else throw new Error('Usage: node .github/scripts/smoke.mjs backend|frontend');
    console.log(`${target} smoke checks passed for ${sha}`);
});
