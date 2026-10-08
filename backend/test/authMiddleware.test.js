import assert from 'node:assert/strict';
import test from 'node:test';
import { authorizeRoles } from '../src/middlewares/authMiddleware.js';

test('authorizeRoles allows the configured role', () => {
    let receivedError;
    authorizeRoles('admin')(
        { user: { role: 'admin' } },
        {},
        (error) => {
            receivedError = error;
        }
    );

    assert.equal(receivedError, undefined);
});

test('authorizeRoles rejects a user role from an admin endpoint', () => {
    let receivedError;
    authorizeRoles('admin')(
        { user: { role: 'user' } },
        {},
        (error) => {
            receivedError = error;
        }
    );

    assert.equal(receivedError.statusCode, 403);
});
