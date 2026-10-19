import assert from 'node:assert/strict';
import test from 'node:test';
import {
    PRODUCT_IMAGE_MAX_BYTES,
    validateProductImageUpload
} from '../src/validations/uploadValidation.js';

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

test('product image upload validation accepts and normalizes supported images', () => {
    const req = {
        body: { fileName: '  boardgame.webp  ', contentType: 'IMAGE/WEBP', size: 1024 }
    };
    const res = mockResponse();
    let nextCalled = false;

    validateProductImageUpload(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.deepEqual(req.body, {
        fileName: 'boardgame.webp',
        contentType: 'image/webp',
        size: 1024
    });
});

test('product image upload validation rejects unsupported or oversized files', () => {
    const req = {
        body: { fileName: 'product.svg', contentType: 'image/svg+xml', size: PRODUCT_IMAGE_MAX_BYTES + 1 }
    };
    const res = mockResponse();

    validateProductImageUpload(req, res, () => assert.fail('validation should fail'));

    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.body.errors.map(({ field }) => field), ['contentType', 'size']);
});
