import assert from 'node:assert/strict';
import test from 'node:test';
import {
    validateArModelWrite,
    validateGameRuleWrite,
    validateUserStatusUpdate
} from '../src/validations/adminValidation.js';

const mockResponse = () => ({
    statusCode: null,
    body: null,
    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

test('admin game rule validation normalizes valid create input', () => {
    const req = {
        method: 'POST',
        body: {
            productId: '507f1f77bcf86cd799439011',
            title: '  Luật cơ bản  ',
            summary: '  Tóm tắt  ',
            content: '  Nội dung  ',
            coverImageUrl: 'https://cdn.example.com/rule.jpg'
        }
    };
    const res = mockResponse();
    let nextCalled = false;

    validateGameRuleWrite(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.body.title, 'Luật cơ bản');
    assert.equal(req.body.summary, 'Tóm tắt');
    assert.equal(req.body.content, 'Nội dung');
});

test('admin AR validation rejects non-GLB model URLs and malformed vectors', () => {
    const req = {
        method: 'POST',
        body: {
            heritageSiteId: '507f1f77bcf86cd799439011',
            model3dUrl: 'https://cdn.example.com/model.fbx',
            defaultPosition: { x: 0, y: 0, z: 0, w: 1 }
        }
    };
    const res = mockResponse();

    validateArModelWrite(req, res, () => assert.fail('validation should fail'));

    assert.equal(res.statusCode, 422);
    assert.deepEqual(
        res.body.errors.map(({ field }) => field),
        ['model3dUrl', 'defaultPosition']
    );
});

test('admin AR validation accepts a target index and rejects values outside the bundle', () => {
    const validRequest = {
        method: 'POST',
        body: {
            heritageSiteId: '507f1f77bcf86cd799439011',
            targetIndex: 5,
            model3dUrl: 'https://cdn.example.com/thap-rua.glb',
            status: 'published'
        }
    };
    const validResponse = mockResponse();
    let nextCalled = false;

    validateArModelWrite(validRequest, validResponse, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(validRequest.body.targetIndex, 5);

    const invalidRequest = {
        method: 'POST',
        body: {
            heritageSiteId: '507f1f77bcf86cd799439011',
            targetIndex: 9,
            model3dUrl: 'https://cdn.example.com/thap-rua.glb'
        }
    };
    const invalidResponse = mockResponse();
    validateArModelWrite(invalidRequest, invalidResponse, () => assert.fail('validation should fail'));

    assert.equal(invalidResponse.statusCode, 422);
    assert.equal(invalidResponse.body.errors[0].field, 'targetIndex');
});

test('admin user status validation requires optimistic concurrency timestamp', () => {
    const req = { method: 'PATCH', body: { status: 'blocked' } };
    const res = mockResponse();

    validateUserStatusUpdate(req, res, () => assert.fail('validation should fail'));

    assert.equal(res.statusCode, 422);
    assert.equal(res.body.errors[0].field, 'expectedUpdatedAt');
});
