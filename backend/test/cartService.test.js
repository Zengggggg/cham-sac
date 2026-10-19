import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCartSummary } from '../src/services/cartService.js';

test('cart summary uses current product price and flags stale stock', () => {
    const summary = buildCartSummary(
        [{ productId: 'p1', quantity: 3, selected: true }],
        [{ id: 'p1', name: 'Boardgame', price: 100000, stock: 2, status: 'active', images: [] }]
    );
    assert.equal(summary.subtotalAmount, 300000);
    assert.equal(summary.items[0].isAvailable, false);
    assert.equal(summary.items[0].issue, 'INSUFFICIENT_STOCK');
});
