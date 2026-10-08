import assert from 'node:assert/strict';
import test from 'node:test';
import User from '../src/models/userModel.js';
import {
    buildVerificationEmail,
    sendVerificationOtpEmail
} from '../src/providers/emailProvider.js';
import { createEmailOtp, verifyEmailOtpHash } from '../src/utils/emailOtp.js';

test('email OTP is six digits, hashed at rest, and expires at the configured time', async () => {
    const now = new Date('2026-10-05T00:00:00.000Z');
    const otpData = await createEmailOtp({
        saltRounds: 4,
        expiresInMinutes: 10,
        now
    });

    assert.match(otpData.otp, /^\d{6}$/);
    assert.notEqual(otpData.hash, otpData.otp);
    assert.equal(await verifyEmailOtpHash(otpData.otp, otpData.hash), true);
    assert.equal(otpData.expiresAt.toISOString(), '2026-10-05T00:10:00.000Z');
});

test('verification email escapes user content and includes the OTP', () => {
    const email = buildVerificationEmail({
        name: '<script>alert(1)</script>',
        otp: '123456',
        expiresInMinutes: 10
    });

    assert.match(email.html, /123456/);
    assert.doesNotMatch(email.html, /<script>/);
    assert.match(email.text, /10 phút/);
});

test('Resend provider sends the OTP with configured credentials and sender', async () => {
    const originalFetch = globalThis.fetch;
    const originalApiKey = process.env.RESEND_API_KEY;
    const originalFromEmail = process.env.RESEND_FROM_EMAIL;
    const originalFromName = process.env.RESEND_FROM_NAME;
    let request;

    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'no-reply@example.com';
    process.env.RESEND_FROM_NAME = 'Chạm Sắc Việt';
    globalThis.fetch = async (url, options) => {
        request = { url, options };
        return new Response(JSON.stringify({ id: 'email-id' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    };

    try {
        const result = await sendVerificationOtpEmail({
            to: 'an@example.com',
            name: 'Nguyễn An',
            otp: '123456',
            expiresInMinutes: 10,
            idempotencyKey: 'email-verification/test'
        });

        const body = JSON.parse(request.options.body);
        const headers = new Headers(request.options.headers);
        assert.equal(result.id, 'email-id');
        assert.equal(request.url, 'https://api.resend.com/emails');
        assert.equal(headers.get('authorization'), 'Bearer re_test_key');
        assert.equal(headers.get('idempotency-key'), 'email-verification/test');
        assert.equal(body.from, 'Chạm Sắc Việt <no-reply@example.com>');
        assert.deepEqual(body.to, ['an@example.com']);
        assert.match(body.html, /123456/);
    } finally {
        globalThis.fetch = originalFetch;
        if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
        else process.env.RESEND_API_KEY = originalApiKey;
        if (originalFromEmail === undefined) delete process.env.RESEND_FROM_EMAIL;
        else process.env.RESEND_FROM_EMAIL = originalFromEmail;
        if (originalFromName === undefined) delete process.env.RESEND_FROM_NAME;
        else process.env.RESEND_FROM_NAME = originalFromName;
    }
});

test('pending verification fields are valid and OTP secrets are hidden from JSON', () => {
    const user = new User({
        name: 'Nguyễn An',
        email: 'an@example.com',
        passwordHash: 'password-hash',
        status: 'pending_verification',
        emailVerificationOtpHash: 'otp-hash',
        emailVerificationOtpExpiresAt: new Date(Date.now() + 600000),
        emailVerificationOtpAttempts: 1
    });

    assert.equal(user.validateSync(), undefined);
    const json = user.toJSON();
    assert.equal(json.status, 'pending_verification');
    assert.equal(json.emailVerificationOtpHash, undefined);
    assert.equal(json.emailVerificationOtpExpiresAt, undefined);
    assert.equal(json.emailVerificationOtpAttempts, undefined);
});
