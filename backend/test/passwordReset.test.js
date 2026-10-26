import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import User from '../src/models/userModel.js';
import {
    requestPasswordResetOtp,
    resetUserPassword
} from '../src/services/authService.js';

const ENVIRONMENT_KEYS = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'BCRYPT_SALT_ROUNDS',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'EMAIL_OTP_EXPIRES_MINUTES',
    'EMAIL_OTP_MAX_ATTEMPTS',
    'EMAIL_OTP_RESEND_COOLDOWN_SECONDS'
];

const configureTestEnvironment = () => {
    const previous = Object.fromEntries(
        ENVIRONMENT_KEYS.map((key) => [key, process.env[key]])
    );

    process.env.JWT_SECRET = 'jwt-secret-for-password-reset-tests-123456';
    process.env.REFRESH_TOKEN_SECRET = 'refresh-secret-for-password-reset-tests-123456';
    process.env.BCRYPT_SALT_ROUNDS = '4';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'no-reply@example.com';
    process.env.EMAIL_OTP_EXPIRES_MINUTES = '10';
    process.env.EMAIL_OTP_MAX_ATTEMPTS = '5';
    process.env.EMAIL_OTP_RESEND_COOLDOWN_SECONDS = '60';

    return () => {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    };
};

const mockUserQuery = (mock, user) => {
    mock.method(User, 'findOne', () => ({
        select: async () => user
    }));
};

test('password reset request stores only a hash and sends the OTP email', async (context) => {
    const restoreEnvironment = configureTestEnvironment();
    const user = {
        id: '507f1f77bcf86cd799439011',
        email: 'an@example.com',
        name: 'Nguyễn An',
        status: 'active',
        passwordResetOtpSentAt: null,
        async save() {}
    };
    let emailPayload;

    mockUserQuery(context.mock, user);
    context.mock.method(globalThis, 'fetch', async (_url, options) => {
        emailPayload = JSON.parse(options.body);
        return new Response(JSON.stringify({ id: 'email-id' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    });

    try {
        const result = await requestPasswordResetOtp(user.email);
        const otp = emailPayload.text.match(/\b\d{6}\b/)?.[0];

        assert.equal(result.email, user.email);
        assert.equal(result.passwordResetRequired, true);
        assert.equal(result.expiresInSeconds, 600);
        assert.match(otp, /^\d{6}$/);
        assert.notEqual(user.passwordResetOtpHash, otp);
        assert.equal(await bcrypt.compare(otp, user.passwordResetOtpHash), true);
        assert.equal(user.passwordResetOtpAttempts, 0);
        assert.ok(user.passwordResetOtpExpiresAt > user.passwordResetOtpSentAt);
        assert.equal(Object.hasOwn(result, 'otp'), false);
    } finally {
        restoreEnvironment();
    }
});

test('password reset replaces the password, clears OTP state, and revokes refresh tokens', async (context) => {
    const restoreEnvironment = configureTestEnvironment();
    const otp = '123456';
    const user = {
        passwordHash: await bcrypt.hash('oldpassword1', 4),
        passwordResetOtpHash: await bcrypt.hash(otp, 4),
        passwordResetOtpExpiresAt: new Date(Date.now() + 600000),
        passwordResetOtpAttempts: 0,
        passwordResetOtpSentAt: new Date(),
        refreshTokenHash: 'refresh-token-hash',
        refreshTokenExpiresAt: new Date(Date.now() + 600000),
        async save() {}
    };

    mockUserQuery(context.mock, user);

    try {
        await resetUserPassword({
            email: 'an@example.com',
            otp,
            password: 'newpassword1'
        });

        assert.equal(await bcrypt.compare('newpassword1', user.passwordHash), true);
        assert.equal(user.passwordResetOtpHash, null);
        assert.equal(user.passwordResetOtpExpiresAt, null);
        assert.equal(user.passwordResetOtpAttempts, 0);
        assert.equal(user.passwordResetOtpSentAt, null);
        assert.equal(user.refreshTokenHash, null);
        assert.equal(user.refreshTokenExpiresAt, null);
    } finally {
        restoreEnvironment();
    }
});

test('password reset counts an invalid OTP attempt', async (context) => {
    const restoreEnvironment = configureTestEnvironment();
    const user = {
        passwordResetOtpHash: await bcrypt.hash('123456', 4),
        passwordResetOtpExpiresAt: new Date(Date.now() + 600000),
        passwordResetOtpAttempts: 0,
        async save() {}
    };

    mockUserQuery(context.mock, user);

    try {
        await assert.rejects(
            resetUserPassword({
                email: 'an@example.com',
                otp: '654321',
                password: 'newpassword1'
            }),
            (error) => error.statusCode === 400 && /OTP không đúng/.test(error.message)
        );
        assert.equal(user.passwordResetOtpAttempts, 1);
    } finally {
        restoreEnvironment();
    }
});
