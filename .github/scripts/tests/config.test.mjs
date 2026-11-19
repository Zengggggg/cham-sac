import assert from 'node:assert/strict';
import test from 'node:test';
import { checkConfig } from '../check-config.mjs';
import { checkVercelEnvironment } from '../check-vercel-env.mjs';

const env = {
    RENDER_API_KEY: 'test-only', VERCEL_TOKEN: 'test-only',
    VERCEL_ORG_ID: 'team-test', VERCEL_PROJECT_ID: 'prj-test', RENDER_SERVICE_ID: 'srv-test',
    PRODUCTION_BACKEND_URL: 'https://api.example.com', PRODUCTION_FRONTEND_URL: 'https://shop.example.com',
    EXPECTED_COMMIT_SHA: 'a'.repeat(40), AR_SMOKE_ASSET_PATH: '/ar-assets/models/sample.glb'
};

test('deployment config rejects missing secrets, invalid SHA and unsafe production origins', () => {
    assert.doesNotThrow(() => checkConfig(env));
    assert.throws(() => checkConfig({ ...env, RENDER_API_KEY: '' }), /RENDER_API_KEY/);
    assert.throws(() => checkConfig({ ...env, EXPECTED_COMMIT_SHA: 'main' }), /commit SHA/);
    for (const origin of ['http://example.com', 'https://example.com/chamsacviet', 'https://user:pass@example.com', 'https://example.com?q=1']) {
        assert.throws(() => checkConfig({ ...env, PRODUCTION_BACKEND_URL: origin }), /HTTPS origin/);
    }
    assert.throws(() => checkConfig({ ...env, AR_SMOKE_ASSET_PATH: '//example.com/model.glb' }), /AR_SMOKE_ASSET_PATH/);
});

test('frontend build cannot accidentally use a staging backend or an API prefix as its origin', () => {
    assert.doesNotThrow(() => checkVercelEnvironment({ VITE_API_URL: env.PRODUCTION_BACKEND_URL }, env.PRODUCTION_BACKEND_URL));
    assert.throws(() => checkVercelEnvironment({ VITE_API_URL: 'https://staging.example.com' }, env.PRODUCTION_BACKEND_URL), /must match/);
    assert.throws(() => checkVercelEnvironment({ VITE_API_URL: `${env.PRODUCTION_BACKEND_URL}/chamsacviet` }, env.PRODUCTION_BACKEND_URL), /HTTPS origin/);
});
