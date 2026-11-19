import assert from 'node:assert/strict';
import test from 'node:test';
import { retry, smokeBackend, smokeFrontend } from '../smoke.mjs';

const sha = 'a'.repeat(40);
const frontendUrl = 'https://shop.example.com';
const backendUrl = 'https://api.example.com';
const assetPath = '/ar-assets/models/sample.glb';
const cors = { 'Access-Control-Allow-Origin': frontendUrl, 'Access-Control-Allow-Credentials': 'true' };
const envelope = (data, headers = cors) => new Response(JSON.stringify({ success: true, statusCode: 200, data }), { headers });

test('backend smoke verifies the real serving commit, CORS and AR response contract', async () => {
    const paths = [];
    await smokeBackend({ backendUrl, frontendUrl, sha, fetchImpl: async (url, init) => {
        assert.equal(init.headers.Origin, frontendUrl);
        paths.push(new URL(url).pathname);
        return envelope(url.endsWith('/ready') ? { status: 'ready', commitSha: sha } : { experiences: [] });
    } });
    assert.deepEqual(paths, ['/chamsacviet/health/ready', '/chamsacviet/ar/experiences']);
});

test('a healthy old backend cannot pass the release gate', async () => {
    await assert.rejects(smokeBackend({ backendUrl, frontendUrl, sha,
        fetchImpl: async () => envelope({ status: 'ready', commitSha: 'b'.repeat(40) })
    }), /different release/);
});

test('backend CORS rejects an unrelated allowed origin', async () => {
    await assert.rejects(smokeBackend({ backendUrl, frontendUrl, sha,
        fetchImpl: async () => envelope({ status: 'ready', commitSha: sha }, { ...cors, 'Access-Control-Allow-Origin': 'https://wrong.example.com' })
    }), /CORS/);
});

const frontendResponse = (url, { oldRelease = false, fakeAsset = false } = {}) => {
    if (url.includes('/release.json')) return new Response(JSON.stringify({ commitSha: oldRelease ? 'b'.repeat(40) : sha }));
    if (url.endsWith('.glb')) return new Response(fakeAsset ? '<html>fallback</html>' : 'glTF\x02\x00\x00\x00', { status: 206 });
    return new Response('<html><div id="root"></div></html>', {
        headers: { 'Content-Type': 'text/html', 'Permissions-Policy': 'camera=(self)' }
    });
};

test('frontend smoke checks SPA routes, release marker, camera policy and actual GLB bytes', async () => {
    const urls = [];
    await smokeFrontend({ frontendUrl, sha, assetPath, fetchImpl: async (url) => {
        urls.push(url);
        return frontendResponse(url);
    } });
    assert.ok(urls.includes(`${frontendUrl}/ar`));
    assert.ok(urls.includes(`${frontendUrl}/login`));
    assert.equal(urls.length, 5);
});

test('SPA fallback returning HTTP 200 cannot masquerade as a GLB', async () => {
    await assert.rejects(smokeFrontend({ frontendUrl, sha, assetPath,
        fetchImpl: async (url) => frontendResponse(url, { fakeAsset: true })
    }), /not the SPA fallback/);
});

test('a stale production frontend fails even when its routes load', async () => {
    await assert.rejects(smokeFrontend({ frontendUrl, sha, assetPath,
        fetchImpl: async (url) => frontendResponse(url, { oldRelease: true })
    }), /different frontend release/);
});

test('transient smoke failures are retried, persistent errors stop at the retry limit', async () => {
    let calls = 0;
    const result = await retry(async () => { if (++calls === 1) throw new Error('warming up'); return 'ready'; }, { sleep: async () => {} });
    assert.equal(result, 'ready');
    assert.equal(calls, 2);
    calls = 0;
    await assert.rejects(retry(async () => { calls += 1; throw new Error('down'); }, { attempts: 3, sleep: async () => {} }), /down/);
    assert.equal(calls, 3);
});
