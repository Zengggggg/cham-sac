import assert from 'node:assert/strict';
import test from 'node:test';
import { getReadiness } from '../src/services/healthService.js';
import { getHealthReadiness } from '../src/controllers/healthController.js';

test('readiness requires a connected MongoDB and successful bounded ping', async () => {
    const sha = 'a'.repeat(40);
    let called = false;
    const connection = {
        readyState: 1,
        db: { command: async (command, options) => {
            called = true;
            assert.deepEqual(command, { ping: 1 });
            assert.equal(options.timeoutMS, 3000);
            return { ok: 1 };
        } }
    };
    assert.deepEqual(await getReadiness({ connection, commit: sha }), { status: 'ready', commitSha: sha });
    assert.equal(called, true);
    await assert.rejects(getReadiness({ connection: { readyState: 0 } }), /not connected/);
});

test('readiness propagates ping failure and does not accept arbitrary commit strings', async () => {
    const connection = { readyState: 1, db: { command: async () => { throw new Error('database credential details'); } } };
    await assert.rejects(getReadiness({ connection }), /credential details/);
    connection.db.command = async () => ({ ok: 1 });
    assert.equal((await getReadiness({ connection, commit: 'invalid' })).commitSha, null);
});

test('readiness HTTP failure is 503, uncached, and hides database details', async () => {
    const headers = {};
    const res = {
        set(name, value) { headers[name] = value; return this; },
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
    await getHealthReadiness({}, res);
    assert.equal(res.statusCode, 503);
    assert.equal(headers['Cache-Control'], 'no-store');
    assert.deepEqual(Object.keys(res.body), ['success', 'statusCode', 'message', 'data', 'meta', 'errors']);
    assert.equal(res.body.success, false);
    assert.equal(res.body.data, null);
    assert.equal(res.body.errors, null);
});
