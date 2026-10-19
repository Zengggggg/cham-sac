import assert from 'node:assert/strict';
import test from 'node:test';
import User from '../src/models/userModel.js';
import {
    normalizeGooglePayload,
    verifyGoogleIdToken
} from '../src/providers/googleAuthProvider.js';
import { mergeGoogleProfileIntoExistingUser } from '../src/services/authService.js';
import { validateGoogleIdToken } from '../src/validations/authValidation.js';

test('normalizeGooglePayload accepts only a verified Google email', () => {
    const profile = normalizeGooglePayload({
        sub: 'google-account-id',
        email: ' USER@EXAMPLE.COM ',
        email_verified: true,
        hd: 'example.com',
        name: 'Nguyễn An',
        picture: 'https://example.com/avatar.jpg'
    });

    assert.deepEqual(profile, {
        googleId: 'google-account-id',
        email: 'user@example.com',
        name: 'Nguyễn An',
        avatarUrl: 'https://example.com/avatar.jpg',
        hostedDomain: 'example.com',
        isEmailAuthoritative: true
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

test('Google is authoritative for Gmail and Workspace but not third-party email', () => {
    const gmailProfile = normalizeGooglePayload({
        sub: 'gmail-id',
        email: 'user@gmail.com',
        email_verified: true
    });
    const thirdPartyProfile = normalizeGooglePayload({
        sub: 'third-party-id',
        email: 'user@example.com',
        email_verified: true
    });

    assert.equal(gmailProfile.isEmailAuthoritative, true);
    assert.equal(thirdPartyProfile.isEmailAuthoritative, false);
});

test('existing pending user is safely linked and activated by authoritative Google email', () => {
    const verifiedAt = new Date('2026-10-19T00:00:00.000Z');
    const user = new User({
        name: 'Nguyễn An',
        email: 'user@gmail.com',
        passwordHash: 'existing-password-hash',
        role: 'admin',
        status: 'pending_verification',
        emailVerificationOtpHash: 'otp-hash',
        emailVerificationOtpExpiresAt: new Date('2026-10-19T00:10:00.000Z')
    });

    mergeGoogleProfileIntoExistingUser(user, {
        googleId: 'google-account-id',
        avatarUrl: 'https://example.com/avatar.jpg',
        isEmailAuthoritative: true
    }, verifiedAt);

    assert.equal(user.googleId, 'google-account-id');
    assert.equal(user.passwordHash, 'existing-password-hash');
    assert.equal(user.role, 'admin');
    assert.equal(user.status, 'active');
    assert.equal(user.emailVerifiedAt.toISOString(), verifiedAt.toISOString());
    assert.equal(user.emailVerificationOtpHash, null);
    assert.equal(user.emailVerificationOtpExpiresAt, null);
});

test('automatic Google linking rejects blocked users and non-authoritative email', () => {
    const profile = {
        googleId: 'google-account-id',
        avatarUrl: null,
        isEmailAuthoritative: true
    };
    const blockedUser = new User({
        name: 'Nguyễn An',
        email: 'user@gmail.com',
        status: 'blocked'
    });
    const thirdPartyUser = new User({
        name: 'Nguyễn An',
        email: 'user@example.com',
        status: 'active'
    });

    assert.throws(
        () => mergeGoogleProfileIntoExistingUser(blockedUser, profile),
        (error) => error.statusCode === 403
    );
    assert.throws(
        () => mergeGoogleProfileIntoExistingUser(thirdPartyUser, {
            ...profile,
            isEmailAuthoritative: false
        }),
        (error) => error.statusCode === 409
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
