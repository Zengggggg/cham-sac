import assert from 'node:assert/strict';
import test from 'node:test';
import {
    validateEmailOtp,
    validateLogin,
    validateRegistration,
    validateVerificationEmail
} from '../src/validations/authValidation.js';

const runMiddleware = (middleware, body) => {
    const req = { body };
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

    middleware(req, res, () => {
        nextCalled = true;
    });

    return { req, response, nextCalled };
};

test('registration normalizes valid input and does not accept a public role', () => {
    const valid = runMiddleware(validateRegistration, {
        name: '  Nguyễn An  ',
        email: '  AN@EXAMPLE.COM ',
        password: 'matkhau123'
    });

    assert.equal(valid.nextCalled, true);
    assert.deepEqual(valid.req.body, {
        name: 'Nguyễn An',
        email: 'an@example.com',
        password: 'matkhau123'
    });

    const roleInjection = runMiddleware(validateRegistration, {
        name: 'Nguyễn An',
        email: 'an@example.com',
        password: 'matkhau123',
        role: 'admin'
    });

    assert.equal(roleInjection.response.statusCode, 422);
    assert.equal(roleInjection.nextCalled, false);
});

test('login rejects missing credentials without throwing', () => {
    const result = runMiddleware(validateLogin, undefined);

    assert.equal(result.response.statusCode, 422);
    assert.equal(result.response.payload.success, false);
    assert.equal(result.response.payload.statusCode, 422);
    assert.equal(result.response.payload.data, null);
    assert.equal(result.response.payload.meta, null);
    assert.ok(Array.isArray(result.response.payload.errors));
    assert.equal(result.nextCalled, false);
});

test('email OTP validation normalizes email and requires exactly six digits', () => {
    const valid = runMiddleware(validateEmailOtp, {
        email: ' USER@EXAMPLE.COM ',
        otp: '123456'
    });

    assert.equal(valid.nextCalled, true);
    assert.deepEqual(valid.req.body, {
        email: 'user@example.com',
        otp: '123456'
    });

    const invalid = runMiddleware(validateEmailOtp, {
        email: 'user@example.com',
        otp: '12345a'
    });

    assert.equal(invalid.response.statusCode, 422);
    assert.equal(invalid.nextCalled, false);
});

test('resend OTP validation accepts only a normalized email', () => {
    const result = runMiddleware(validateVerificationEmail, {
        email: ' USER@EXAMPLE.COM '
    });

    assert.equal(result.nextCalled, true);
    assert.deepEqual(result.req.body, { email: 'user@example.com' });
});
