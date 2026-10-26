import assert from 'node:assert/strict';
import test from 'node:test';
import {
    validateAdminQuestionWrite,
    validatePrivateQuestionListWrite,
    validateQuestionWrite
} from '../src/validations/questionValidation.js';

const runMiddleware = (middleware, method, body) => {
    const req = { method, body };
    let nextCalled = false;
    let response;
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
    middleware(req, res, () => { nextCalled = true; });
    return { req, response, nextCalled };
};

test('question validation trims content and rejects short questions', () => {
    const valid = runMiddleware(validateQuestionWrite, 'POST', {
        content: '  Di tích này được xây dựng khi nào?  '
    });
    assert.equal(valid.nextCalled, true);
    assert.equal(valid.req.body.content, 'Di tích này được xây dựng khi nào?');

    const invalid = runMiddleware(validateQuestionWrite, 'POST', { content: 'a' });
    assert.equal(invalid.nextCalled, false);
    assert.equal(invalid.response.statusCode, 422);
});

test('private question list validation requires a name and heritage site on create', () => {
    const valid = runMiddleware(validatePrivateQuestionListWrite, 'POST', {
        name: '  Chuyến đi Hà Nội  ',
        heritageSiteId: '507f1f77bcf86cd799439011'
    });
    assert.equal(valid.nextCalled, true);
    assert.deepEqual(valid.req.body, {
        name: 'Chuyến đi Hà Nội',
        heritageSiteId: '507f1f77bcf86cd799439011'
    });

    const invalid = runMiddleware(validatePrivateQuestionListWrite, 'POST', {
        name: '',
        heritageSiteId: 'invalid'
    });
    assert.deepEqual(
        invalid.response.payload.errors.map(({ field }) => field),
        ['name', 'heritageSiteId']
    );
});

test('admin question updates require an optimistic concurrency timestamp', () => {
    const invalid = runMiddleware(validateAdminQuestionWrite, 'PATCH', {
        content: 'Câu hỏi đã chỉnh sửa'
    });
    assert.equal(invalid.response.statusCode, 422);
    assert.equal(invalid.response.payload.errors[0].field, 'expectedUpdatedAt');

    const valid = runMiddleware(validateAdminQuestionWrite, 'PATCH', {
        content: '  Câu hỏi đã chỉnh sửa  ',
        expectedUpdatedAt: '2026-10-26T10:00:00.000Z'
    });
    assert.equal(valid.nextCalled, true);
    assert.equal(valid.req.body.content, 'Câu hỏi đã chỉnh sửa');
    assert.ok(valid.req.body.expectedUpdatedAt instanceof Date);
});
