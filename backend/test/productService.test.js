import assert from 'node:assert/strict';
import test from 'node:test';
import { toPublicProduct } from '../src/services/productService.js';

test('public product derives sold-out availability without mutating persisted status', () => {
    const product = toPublicProduct({
        id: 'product-id',
        name: 'Boardgame',
        price: 350000,
        stock: 0,
        status: 'active',
        images: []
    });
    assert.equal(product.status, 'active');
    assert.equal(product.availabilityStatus, 'sold_out');
    assert.equal(product.canPurchase, false);
});
