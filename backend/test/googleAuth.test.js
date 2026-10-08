import assert from 'node:assert/strict';
import test from 'node:test';
import User from '../src/models/userModel.js';
import {
    normalizeGooglePayload,
    verifyGoogleIdToken
} from '../src/providers/googleAuthProvider.js';
import { validateGoogleIdToken } from '../src/validations/authValidation.js';

test('normalizeGooglePayload accepts only a verified Google email', () => {
    const profile = normalizeGooglePayload({
        sub: 'google-account-id',
        email: ' USER@EXAMPLE.COM ',
        email_verified: true,
        name: 'Nguyễn An',
        picture: 'https://example.com/avatar.jpg'
    });

    assert.deepEqual(profile, {
        googleId: 'google-account-id',
        email: 'user@example.com',
        name: 'Nguyễn An',
        avatarUrl: 'https://example.com/avatar.jpg'
    });
    assert.throws(
        () => normalizeGooglePayload({
            sub: 'google-account-id',
            email: 'user@example.com',
            email_verified: false
        }),
        /email đã xác minh/
    );
});

test('Google-only users do not require a password hash', () => {
    const user = new User({
        name: 'Nguyễn An',
        email: 'user@example.com',
        googleId: 'google-account-id'
    });
    const validationError = user.validateSync();

    assert.equal(validationError, undefined);
    assert.equal(User.schema.path('googleId').options.unique, true);
    assert.equal(User.schema.path('googleId').options.sparse, true);
});

test('Google token validation rejects an empty token', () => {
    const req = { body: {} };
    let response;
    let nextCalled = false;
    const res = {
        status(statusCode) {
            response = { statusCode };
            return this;
        },
        json(payload) {
            response.payload = payload;
            return this;
        }
    };

    validateGoogleIdToken(req, res, () => {
        nextCalled = true;
    });

    assert.equal(response.statusCode, 422);
    assert.equal(response.payload.statusCode, 422);
    assert.equal(response.payload.data, null);
    assert.equal(nextCalled, false);
});

test('Google provider rejects a malformed signed token', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test.apps.googleusercontent.com';

    await assert.rejects(
        () => verifyGoogleIdToken('not-a-google-id-token'),
        (error) => error.statusCode === 401
    );
});
