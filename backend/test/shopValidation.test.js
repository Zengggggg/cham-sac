import assert from 'node:assert/strict';
import test from 'node:test';
import {
    validateAddCartItem,
    validateCheckout,
    validateProductWrite
} from '../src/validations/shopValidation.js';

const runMiddleware = (middleware, request) => {
    const result = { nextCalled: false };
    const response = {
        status(statusCode) {
            result.statusCode = statusCode;
            return this;
        },
        json(body) {
            result.body = body;
            return this;
        }
    };
    middleware(request, response, () => { result.nextCalled = true; });
    return result;
};

test('cart validation rejects unsafe quantities', () => {
    const result = runMiddleware(validateAddCartItem, {
        body: { productId: '507f1f77bcf86cd799439011', quantity: 1.5 }
    });
    assert.equal(result.statusCode, 422);
    assert.equal(result.nextCalled, false);
});

test('checkout validation normalizes shipping data and requires idempotency key', () => {
    const request = {
        get: () => ' checkout-001 ',
        body: {
            customer: { fullName: ' Nguyễn An ', phone: '+84901234567' },
            shippingAddress: { addressLine: ' 01 Đường Mẫu ', province: ' Hà Nội ' }
        }
    };
    const result = runMiddleware(validateCheckout, request);
    assert.equal(result.nextCalled, true);
    assert.equal(request.checkoutKey, 'checkout-001');
    assert.equal(request.body.customer.fullName, 'Nguyễn An');
});

test('admin product validation rejects client-controlled audit fields', () => {
    const result = runMiddleware(validateProductWrite, {
        method: 'POST',
        body: { name: 'Boardgame', price: 100000, stock: 1, changeHistory: [] }
    });
    assert.equal(result.statusCode, 422);
});
