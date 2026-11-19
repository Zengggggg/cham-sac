import assert from 'node:assert/strict';
import test from 'node:test';
import { deployRender } from '../deploy-render.mjs';

const sha = 'a'.repeat(40);
const options = { serviceId: 'srv-test', apiKey: 'test-only', sha, intervalMs: 0, sleep: async () => {}, log: () => {} };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('Render deploy pins the tested commit and polls that deployment until it is live', async () => {
    const calls = [];
    const responses = [
        { autoDeployTrigger: 'off' }, { id: 'dep-test' },
        { status: 'build_in_progress' }, { status: 'live', commit: { id: sha } }
    ];
    const id = await deployRender({ ...options, fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return json(responses.shift());
    } });
    assert.equal(id, 'dep-test');
    assert.deepEqual(JSON.parse(calls[1].init.body), { commitId: sha });
    assert.equal(calls[2].url, 'https://api.render.com/v1/services/srv-test/deploys/dep-test');
    assert.equal(calls[3].url, calls[2].url);
});

test('automatic Git deployments must be disabled before any deployment is created', async () => {
    let calls = 0;
    await assert.rejects(deployRender({ ...options, fetchImpl: async () => {
        calls += 1;
        return json({ autoDeployTrigger: 'commit' });
    } }), /Auto-Deploy to Off/);
    assert.equal(calls, 1);
});

for (const terminal of ['build_failed', 'pre_deploy_failed', 'update_failed', 'canceled', 'deactivated']) {
    test(`Render ${terminal} stops the release`, async () => {
        const responses = [{ autoDeployTrigger: 'off' }, { id: 'dep-test' }, { status: terminal }];
        await assert.rejects(deployRender({ ...options, fetchImpl: async () => json(responses.shift()) }), new RegExp(terminal));
    });
}

test('a live deployment of another commit is rejected', async () => {
    const responses = [{ autoDeployTrigger: 'off' }, { id: 'dep-test' }, { status: 'live', commit: { id: 'b'.repeat(40) } }];
    await assert.rejects(deployRender({ ...options, fetchImpl: async () => json(responses.shift()) }), /different commit/);
});

test('deployment polling is bounded and reports which deployment needs inspection', async () => {
    const responses = [{ autoDeployTrigger: 'off' }, { id: 'dep-test' }];
    await assert.rejects(deployRender({ ...options, attempts: 2,
        fetchImpl: async () => json(responses.shift() || { status: 'build_in_progress' })
    }), /Timed out.*dep-test/);
});

test('an ambiguous POST failure is never retried', async () => {
    let posts = 0;
    await assert.rejects(deployRender({ ...options, fetchImpl: async (_url, init) => {
        if (init.method === 'POST') { posts += 1; throw new Error('network failed'); }
        return json({ autoDeployTrigger: 'off' });
    } }), /network failed/);
    assert.equal(posts, 1);
});

test('API errors do not echo provider responses or credentials into CI logs', async () => {
    await assert.rejects(deployRender({ ...options, fetchImpl: async () => json({ secret: 'never-print-this' }, 401) }), (error) => {
        assert.match(error.message, /HTTP 401/);
        assert.doesNotMatch(error.message, /never-print-this|test-only/);
        return true;
    });
});
